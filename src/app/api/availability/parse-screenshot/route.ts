import { NextResponse } from "next/server";
import type { ScheduleDayOption } from "@/lib/availability-draft";
import {
  validateScreenshotBusyAnalysis,
  type ParsedBusyInterval,
  type DayCoverage,
  type ScreenshotParseDebug,
  type ConfidenceBreakdown,
} from "@/lib/screenshot-parse";

export interface ParseScreenshotResponse {
  busyByDate: Record<string, ParsedBusyInterval[]>;
  dayCoverage: Record<string, DayCoverage>;
  partial?: boolean;
  message?: string;
  warnings?: string[];
  parseType?: string;
  confidence?: ConfidenceBreakdown;
  debug?: ScreenshotParseDebug;
  rawDebug?: {
    primaryParsed: Record<string, unknown> | null;
    fallbackParsed: Record<string, unknown> | null;
    columnParses?: Array<{
      date: string | null;
      startX?: number;
      endX?: number;
      parsed: Record<string, unknown> | null;
    }>;
  };
  stats?: { totalParsed: number; normalized: number; skipped: number };
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function addDaysToIsoDate(date: string, offset: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

function buildSystemPrompt(scheduleDaysJson: string): string {
  return `You analyze screenshots of calendars and availability views.

Goal: return only confirmed BUSY times from the screenshot. Do not compute final availability.
If uncertain, omit the interval and add a warning.

Prioritize geometric structure over OCR:
1. Detect calendar/week-style layout.
2. Detect visible weekday columns with normalized x boundaries.
3. Detect the left-side time axis with normalized y positions.
4. Detect rectangular busy event blocks.
5. Convert those blocks into confirmed busy intervals only when support is sufficient.

Rules:
- Treat this as draft generation only.
- Use the screenshot's own visible week if different from the app's schedule list.
- If fewer than 3 day columns are confidently visible, mark the parse as partial.
- If time labels are weak, return only intervals with explicit visible times.
- Ignore uncertain days or times instead of guessing.

Return ONLY JSON:
{
  "layout": {
    "kind": "week_calendar" | "single_day_calendar" | "availability_list" | "unknown",
    "confidence": 0.0,
    "cropped": false
  },
  "headers": [
    {
      "text": "Tue 17",
      "columnIndex": 2,
      "startX": 0.32,
      "endX": 0.45,
      "confidence": 0.0,
      "resolvedDate": "2026-03-17",
      "resolvedDateConfidence": 0.0
    }
  ],
  "timeAxis": {
    "detected": true,
    "confidence": 0.0,
    "labels": [
      { "text": "11 AM", "time": "11:00", "y": 0.27, "confidence": 0.0 }
    ]
  },
  "busyBlocks": [
    {
      "x": 0.33,
      "y": 0.27,
      "width": 0.11,
      "height": 0.08,
      "dayColumnIndex": 2,
      "date": "2026-03-17",
      "start": "11:00",
      "end": "12:20",
      "dateConfidence": 0.0,
      "timeConfidence": 0.0,
      "blockConfidence": 0.0,
      "source": "busy",
      "warnings": []
    }
  ],
  "busyIntervals": [
    {
      "date": "2026-03-17",
      "start": "11:00",
      "end": "12:20",
      "dateConfidence": 0.0,
      "timeConfidence": 0.0,
      "blockConfidence": 0.0,
      "overallConfidence": 0.0,
      "warnings": []
    }
  ],
  "warnings": []
}

Schedule list for context only:
${scheduleDaysJson}`;
}

function buildFallbackSystemPrompt(scheduleDaysJson: string): string {
  return `You are extracting only confirmed busy times from a weekly calendar screenshot, usually Google Calendar.

Use the screenshot's own visible week even if it differs from the provided schedule.
Return only busy intervals you can directly support from visible event blocks and visible times.
Do not infer free time. Do not guess.

Return ONLY JSON:
{
  "busyIntervals": [
    {
      "date": "yyyy-MM-dd",
      "start": "HH:mm",
      "end": "HH:mm",
      "dateConfidence": 0.0,
      "timeConfidence": 0.0,
      "blockConfidence": 0.0,
      "overallConfidence": 0.0,
      "warnings": []
    }
  ],
  "partial": true,
  "warnings": ["..."],
  "reason": "..."
}

Schedule list for context only:
${scheduleDaysJson}`;
}

function buildUserPrompt(scheduleDaysJson: string): string {
  return `Use these as context for possible date mapping, but preserve the screenshot's own dates when visible.

Schedule days (date, label):
${scheduleDaysJson}

Analyze the screenshot and return only structured busy-time evidence.`;
}

function buildFallbackUserPrompt(): string {
  return `Analyze this as a Google Calendar-style week screenshot if applicable and return only confirmed busy intervals from visible timed events.`;
}

function buildColumnExtractionSystemPrompt(date: string, startX: number, endX: number): string {
  return `You are extracting busy times from exactly one day column in a week calendar screenshot.

Focus only on the timed grid area for the column whose normalized horizontal range is approximately ${startX.toFixed(3)} to ${endX.toFixed(3)}.
This column corresponds to date ${date}.

Rules:
- Return every visible timed busy event in this one column, including stacked events later in the day.
- Ignore all-day events above the timed grid.
- Ignore every other column.
- Prefer recall within this column: if a timed event is visibly present and reasonably readable, include it.
- Use non-zero confidence values when an interval is visibly supported. Do not leave all confidence fields as 0 for supported intervals.
- Do not invent times that are not visible or infer free time.

Return ONLY JSON:
{
  "busyIntervals": [
    {
      "date": "${date}",
      "start": "HH:mm",
      "end": "HH:mm",
      "dateConfidence": 0.0,
      "timeConfidence": 0.0,
      "blockConfidence": 0.0,
      "overallConfidence": 0.0,
      "warnings": []
    }
  ],
  "warnings": []
}`;
}

function buildColumnExtractionUserPrompt(date: string): string {
  return `Extract all visible timed busy events for ${date} from only that one day column.`;
}

async function requestJsonObject(
  openai: any,
  systemPrompt: string,
  userPrompt: string,
  dataUrl: string
): Promise<Record<string, unknown> | null> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1400,
  });
  const raw = completion.choices?.[0]?.message?.content;
  if (!raw) return null;
  return JSON.parse(raw) as Record<string, unknown>;
}

function parseScheduleDays(raw: string): ScheduleDayOption[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object")
      .map((entry) => ({
        date: typeof entry.date === "string" ? entry.date : "",
        label: typeof entry.label === "string" ? entry.label : "",
      }))
      .filter((entry) => Boolean(entry.date));
  } catch {
    return [];
  }
}

function fallbackBusyByDate(raw: unknown[]): Record<string, ParsedBusyInterval[]> {
  const grouped = new Map<string, ParsedBusyInterval[]>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const interval = item as ParsedBusyInterval;
    if (
      typeof interval.date !== "string" ||
      typeof interval.start !== "string" ||
      typeof interval.end !== "string"
    ) {
      continue;
    }
    grouped.set(interval.date, [...(grouped.get(interval.date) ?? []), interval]);
  }
  return Object.fromEntries(grouped.entries());
}

function parseColumnCandidates(
  raw: Record<string, unknown> | null,
  scheduleDays: ScheduleDayOption[]
): Array<{
  resolvedDate: string;
  startX: number;
  endX: number;
  confidence: number;
}> {
  const headers = Array.isArray(raw?.headers) ? raw.headers : [];
  const explicit = headers
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      resolvedDate: typeof item.resolvedDate === "string" ? item.resolvedDate : "",
      startX: typeof item.startX === "number" ? item.startX : NaN,
      endX: typeof item.endX === "number" ? item.endX : NaN,
      columnIndex: typeof item.columnIndex === "number" ? item.columnIndex : null,
      confidence: Math.min(
        1,
        Math.max(
          0,
          ((typeof item.confidence === "number" ? item.confidence : 0) +
            (typeof item.resolvedDateConfidence === "number" ? item.resolvedDateConfidence : 0)) / 2
        )
      ),
    }))
    .filter(
      (item) =>
        /^\d{4}-\d{2}-\d{2}$/.test(item.resolvedDate) &&
        Number.isFinite(item.startX) &&
        Number.isFinite(item.endX) &&
        item.endX > item.startX &&
        item.confidence >= 0.65
    );

  if (explicit.length >= 3) {
    return explicit.map(({ resolvedDate, startX, endX, confidence }) => ({
      resolvedDate,
      startX,
      endX,
      confidence,
    }));
  }

  const layout = raw?.layout;
  const isWeekLayout =
    !!layout &&
    typeof layout === "object" &&
    (layout as Record<string, unknown>).kind === "week_calendar";

  if (!isWeekLayout) {
    return explicit.map(({ resolvedDate, startX, endX, confidence }) => ({
      resolvedDate,
      startX,
      endX,
      confidence,
    }));
  }

  const anchoredHeader = explicit.find(
    (item) => item.columnIndex != null && Number.isFinite(item.startX) && Number.isFinite(item.endX)
  );
  if (anchoredHeader && anchoredHeader.columnIndex != null) {
    const width = anchoredHeader.endX - anchoredHeader.startX;
    const candidates = Array.from({ length: 7 }, (_, index) => {
      const startX = anchoredHeader.startX + (index - anchoredHeader.columnIndex!) * width;
      const endX = startX + width;
      return {
        resolvedDate: addDaysToIsoDate(anchoredHeader.resolvedDate, index - anchoredHeader.columnIndex!),
        startX: Math.max(0, Math.min(1, startX)),
        endX: Math.max(0, Math.min(1, endX)),
        confidence: Math.max(0.55, anchoredHeader.confidence * 0.85),
      };
    }).filter((item) => item.endX - item.startX >= 0.06);
    if (candidates.length >= 5) {
      return candidates;
    }
  }

  if (scheduleDays.length >= 5) {
    const left = 0.06;
    const right = 0.97;
    const width = (right - left) / 7;
    return scheduleDays.slice(0, 7).map((day, index) => ({
      resolvedDate: day.date,
      startX: Number((left + index * width).toFixed(3)),
      endX: Number((left + (index + 1) * width).toFixed(3)),
      confidence: 0.58,
    }));
  }

  return explicit.map(({ resolvedDate, startX, endX, confidence }) => ({
    resolvedDate,
    startX,
    endX,
    confidence,
  }));
}

function collectBusyIntervals(raw: Record<string, unknown> | null): ParsedBusyInterval[] {
  const intervals = Array.isArray(raw?.busyIntervals) ? raw.busyIntervals : [];
  return intervals
    .filter((item): item is ParsedBusyInterval => !!item && typeof item === "object")
    .filter(
      (item) =>
        typeof item.date === "string" &&
        typeof item.start === "string" &&
        typeof item.end === "string" &&
        Math.max(
          item.overallConfidence ?? 0,
          item.dateConfidence ?? 0,
          item.timeConfidence ?? 0,
          item.blockConfidence ?? 0
        ) > 0
    );
}

function dedupeBusyIntervals(intervals: ParsedBusyInterval[]): ParsedBusyInterval[] {
  const byKey = new Map<string, ParsedBusyInterval>();
  for (const interval of intervals) {
    const key = `${interval.date}:${interval.start}:${interval.end}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, interval);
      continue;
    }
    byKey.set(key, {
      ...existing,
      dateConfidence: Math.max(existing.dateConfidence ?? 0, interval.dateConfidence ?? 0),
      timeConfidence: Math.max(existing.timeConfidence ?? 0, interval.timeConfidence ?? 0),
      blockConfidence: Math.max(existing.blockConfidence ?? 0, interval.blockConfidence ?? 0),
      overallConfidence: Math.max(existing.overallConfidence ?? 0, interval.overallConfidence ?? 0),
      warnings: Array.from(new Set([...(existing.warnings ?? []), ...(interval.warnings ?? [])])),
    });
  }
  return Array.from(byKey.values());
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
      : JSON.stringify([{ date: new Date().toISOString().slice(0, 10), label: "Today" }]);
  const scheduleDays = parseScheduleDays(scheduleDaysJson);

  let base64: string;
  try {
    const buffer = await imageFile.arrayBuffer();
    base64 = Buffer.from(buffer).toString("base64");
  } catch {
    return NextResponse.json({ error: "Failed to read image. Please try again." }, { status: 400 });
  }

  const mime = imageFile.type || "image/jpeg";
  const dataUrl = `data:${mime};base64,${base64}`;

  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey });

    const primaryParsed = await requestJsonObject(
      openai,
      buildSystemPrompt(scheduleDaysJson),
      buildUserPrompt(scheduleDaysJson),
      dataUrl
    );
    if (!primaryParsed) {
      return NextResponse.json(
        { error: "Could not read busy times from the image. Please try again or enter manually." },
        { status: 422 }
      );
    }

    const columnCandidates = parseColumnCandidates(primaryParsed, scheduleDays);
    const columnParses: Array<{
      date: string | null;
      startX?: number;
      endX?: number;
      parsed: Record<string, unknown> | null;
    }> = [];
    const columnIntervals: ParsedBusyInterval[] = [];

    for (const candidate of columnCandidates) {
      const parsed = await requestJsonObject(
        openai,
        buildColumnExtractionSystemPrompt(candidate.resolvedDate, candidate.startX, candidate.endX),
        buildColumnExtractionUserPrompt(candidate.resolvedDate),
        dataUrl
      );
      columnParses.push({
        date: candidate.resolvedDate,
        startX: candidate.startX,
        endX: candidate.endX,
        parsed,
      });
      columnIntervals.push(...collectBusyIntervals(parsed));
    }

    const enrichedPrimaryParsed: Record<string, unknown> = {
      ...primaryParsed,
      headers: columnCandidates.map((candidate, index) => ({
        text: candidate.resolvedDate,
        columnIndex: index,
        startX: candidate.startX,
        endX: candidate.endX,
        confidence: candidate.confidence,
        resolvedDate: candidate.resolvedDate,
        resolvedDateConfidence: candidate.confidence,
      })),
      busyIntervals: dedupeBusyIntervals([
        ...collectBusyIntervals(primaryParsed),
        ...columnIntervals,
      ]),
    };

    let result = validateScreenshotBusyAnalysis(enrichedPrimaryParsed, scheduleDays);
    let fallbackParsed: Record<string, unknown> | null = null;
    let totalParsed = Array.isArray(enrichedPrimaryParsed.busyIntervals)
      ? enrichedPrimaryParsed.busyIntervals.length
      : 0;

    if (Object.keys(result.busyByDate).length === 0) {
      fallbackParsed = await requestJsonObject(
        openai,
        buildFallbackSystemPrompt(scheduleDaysJson),
        buildFallbackUserPrompt(),
        dataUrl
      );
      if (fallbackParsed) {
        const rawBusyIntervals = Array.isArray(fallbackParsed.busyIntervals)
          ? fallbackParsed.busyIntervals
          : [];
        const busyByDate = fallbackBusyByDate(rawBusyIntervals);
        const fallbackWarnings = Array.isArray(fallbackParsed.warnings)
          ? fallbackParsed.warnings.filter((item): item is string => typeof item === "string")
          : [];
        result = {
          ...result,
          busyByDate,
          dayCoverage: Object.fromEntries(
            Object.keys(busyByDate).map((date) => [date, "partial" as DayCoverage])
          ),
          partial: true,
          warnings: Array.from(
            new Set([
              ...result.warnings,
              ...fallbackWarnings,
              "Fallback parser used: geometry extraction was inconclusive.",
            ])
          ),
          parseType: Object.keys(busyByDate).length > 0 ? "partial draft" : result.parseType,
        };
        totalParsed = rawBusyIntervals.length;
      }
    }

    const normalizedCount = Object.values(result.busyByDate).reduce(
      (sum, intervals) => sum + intervals.length,
      0
    );

    const response: ParseScreenshotResponse = {
      busyByDate: result.busyByDate,
      dayCoverage: result.dayCoverage,
      partial: result.partial,
      message:
        result.parseType === "single-day partial parse"
          ? "Only one day could be parsed confidently from this screenshot."
          : result.partial
            ? "Busy times extracted from screenshot with warnings. Review before applying."
            : "Busy times extracted from screenshot.",
      warnings: result.warnings,
      parseType: result.parseType,
      confidence: result.confidence,
      debug: result.debug,
      rawDebug: {
        primaryParsed,
        fallbackParsed,
        columnParses,
      },
      stats: {
        totalParsed,
        normalized: normalizedCount,
        skipped: Math.max(0, totalParsed - normalizedCount),
      },
    };

    return NextResponse.json(response);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return NextResponse.json(
        { error: "We couldn't read busy times from this screenshot. Please try another image or enter manually." },
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
