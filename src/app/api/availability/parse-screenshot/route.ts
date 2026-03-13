import { NextResponse } from "next/server";
import { normalizeModelWindows } from "@/lib/screenshot-normalize";

/** Draft window as returned by the parser (date can be yyyy-MM-dd or day name). */
export interface ParsedDraftWindow {
  date: string;
  start: string;
  end: string;
}

export interface ParseScreenshotResponse {
  draft: ParsedDraftWindow[];
  /** True if extraction was partial or uncertain; user should review carefully. */
  partial?: boolean;
  message?: string;
  /** Counts for transparency: parsed from model, normalized, skipped (could not normalize). */
  stats?: { totalParsed: number; normalized: number; skipped: number };
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function buildSystemPrompt(scheduleDaysJson: string): string {
  return `You are an assistant that extracts availability from a screenshot of a calendar or availability view.

The user will send an image that may show:
- A weekly or daily calendar (Google Calendar, Apple Calendar, etc.)
- A list or text of available/busy times
- Any other view that indicates when someone is free or busy

When the image is a WEEKLY calendar view, treat it as a grid:
- Read the DAY HEADERS at the top first (for example: "SUN 8", "MON 9", "TUE 10", etc.).
- Horizontal position (column) determines the DAY.
- Vertical position determines the TIME of day.

For each event or available block you detect:
- Determine which DAY COLUMN it falls under (using the headers).
- Use the provided 7-day schedule list (dates and labels) to map that header to an exact calendar date in yyyy-MM-dd.
- NEVER output vague labels like "Today", "Tomorrow", "This Friday", "Next week", etc.
- ALWAYS output a concrete date that matches one of the 7 schedule days exactly (yyyy-MM-dd).

Your task: extract time windows when the person appears AVAILABLE (free to meet). If the screenshot shows busy blocks, infer the available gaps instead.

Output ONLY valid JSON, no markdown or extra text. Required format:
{
  "windows": [
    { "date": "yyyy-MM-dd", "start": "HH:mm", "end": "HH:mm" },
    ...
  ],
  "partial": false
}

Rules:
- date must be yyyy-MM-dd and MUST be one of the dates in the provided 7-day schedule.
- start and end must be HH:mm in 24-hour format (e.g. "09:00", "14:30").
- Each window is one continuous available block. If there are multiple blocks on the same day, output multiple entries.
- If you cannot confidently determine the day column for a block, still extract the time range if possible, set "partial": true, and explain in "reason" that some days could not be mapped confidently.
- If the image shows no usable availability, return { "windows": [], "partial": true, "reason": "brief explanation" }.
- Prefer interpreting content as AVAILABLE windows. If you see busy blocks, infer free time as the gaps (e.g. 9-5 with a 10-11 meeting → 9-10 and 11-5).`;
}

function buildUserPrompt(scheduleDaysJson: string): string {
  return `Use these as the next 7 days for resolving day names to yyyy-MM-dd dates. Today is the first date in the list.

Schedule days (date, label):
${scheduleDaysJson}

When the screenshot is a weekly calendar grid with day columns (e.g. SUN, MON, TUE):
- Use the column headers and the horizontal position of each block to decide which exact date from the schedule it belongs to.
- For every extracted window, output the concrete date (yyyy-MM-dd) from the list above, not generic labels like "Today" or "Tomorrow".

Analyze the attached screenshot and return the JSON object with "windows" and optionally "partial".`;
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Screenshot parsing is not configured. Please contact support." },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data. Upload an image file." },
      { status: 400 }
    );
  }

  const imageFile = formData.get("image") as { arrayBuffer?: () => Promise<ArrayBuffer>; size?: number; type?: string } | null;
  // In the Node runtime, File may not be globally defined; check by capability instead of instanceof.
  if (!imageFile || typeof imageFile.arrayBuffer !== "function") {
    return NextResponse.json(
      { error: "Missing image file. Please upload a screenshot." },
      { status: 400 }
    );
  }

  if ((imageFile.size ?? 0) > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image is too large. Please use an image under 10 MB." },
      { status: 400 }
    );
  }

  const type = (imageFile.type ?? "").toLowerCase();
  if (!ALLOWED_TYPES.includes(type)) {
    return NextResponse.json(
      { error: "Unsupported image type. Use JPEG, PNG, WebP, or GIF." },
      { status: 400 }
    );
  }

  const scheduleDaysRaw = formData.get("scheduleDays");
  const scheduleDaysJson =
    typeof scheduleDaysRaw === "string"
      ? scheduleDaysRaw
      : JSON.stringify([
          { date: new Date().toISOString().slice(0, 10), label: "Today" },
        ]);

  let base64: string;
  try {
    const buffer = await imageFile.arrayBuffer();
    base64 = Buffer.from(buffer).toString("base64");
  } catch {
    return NextResponse.json(
      { error: "Failed to read image. Please try again." },
      { status: 400 }
    );
  }

  const mime = imageFile.type || "image/jpeg";
  const dataUrl = `data:${mime};base64,${base64}`;

  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildSystemPrompt(scheduleDaysJson) },
        {
          role: "user",
          content: [
            { type: "text", text: buildUserPrompt(scheduleDaysJson) },
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1024,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "Could not read availability from the image. Please try again or enter manually." },
        { status: 422 }
      );
    }

    const parsed = JSON.parse(raw) as {
      windows?: unknown[];
      partial?: boolean;
      reason?: string;
    };

    const rawWindows = Array.isArray(parsed.windows) ? parsed.windows : [];

    // Detect vague date outputs like "Today", "Tomorrow", "This Friday", etc. and treat as partial.
    const hasVagueDates = rawWindows.some((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const obj = entry as Record<string, unknown>;
      const possibleDate =
        (typeof obj.date === "string" && obj.date) ||
        (typeof obj.dateLabel === "string" && obj.dateLabel) ||
        (typeof obj.day === "string" && obj.day) ||
        (typeof obj.dayLabel === "string" && obj.dayLabel) ||
        "";
      const d = possibleDate.toLowerCase();
      if (!d) return false;
      return (
        d.includes("today") ||
        d.includes("tomorrow") ||
        d.includes("tonight") ||
        d.includes("this ") ||
        d.includes("next ") ||
        d.includes("week")
      );
    });

    const { draft, stats } = normalizeModelWindows(rawWindows);

    const response: ParseScreenshotResponse = {
      draft,
      partial: Boolean(parsed.partial) || draft.length === 0 || hasVagueDates,
      message: parsed.reason,
      stats,
    };
    return NextResponse.json(response);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return NextResponse.json(
        { error: "We couldn't read availability from this screenshot. Please try another image or enter manually." },
        { status: 422 }
      );
    }
    console.error("Parse screenshot error:", e);
    return NextResponse.json(
      { error: "Something went wrong while reading the screenshot. Please try again or enter availability manually." },
      { status: 500 }
    );
  }
}

