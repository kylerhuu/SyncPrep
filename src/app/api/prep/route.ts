import { NextResponse } from "next/server";
import type { PrepNotes } from "@/types";

function toArray(value: unknown): string[] {
  if (Array.isArray(value))
    return value
      .filter((x): x is string => typeof x === "string")
      .map((s) => s.trim())
      .filter(Boolean);
  if (typeof value === "string" && value.trim())
    return [value.trim()];
  return [];
}

const SYSTEM_PROMPT = `You are a concise meeting preparation assistant. You output only valid JSON—no markdown, no extra text.

Required JSON structure (omit a key only if you have no content for it):
{
  "meetingSummary": "One or two sentences: what this meeting is and how to approach it.",
  "questionsToPrepare": ["Question they might ask or you should prepare for", "..."],
  "talkingPoints": ["Point to bring up or steer the conversation", "..."],
  "strengthsToHighlight": ["Strength to mention", "..."],
  "skillsToReview": ["Skill or topic to brush up on", "..."],
  "gapsOrMissing": ["Gap vs role or context—only if relevant", "..."],
  "followUpQuestions": ["Question to ask them at the end", "..."]
}

Rules:
- Keep each list to 3–6 items. One short line per item.
- Be specific and actionable. Do not give generic advice that could apply to any meeting.
- Do not repeat the same idea across sections. Do not use filler like "research the company" unless you tie it to the resume or job description.
- When resume or job description is provided, use them: tailor likely questions, strengths, and gaps to the role and the candidate. Reference concrete experience or requirements.
- meetingSummary must be 1–2 sentences only.`;

export async function POST(request: Request) {
  let body: {
    meetingType?: string;
    context?: string;
    resume?: string;
    jobDescription?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const meetingType = body.meetingType ?? "other";
  const parts: string[] = [
    `Meeting type: ${meetingType}.`,
    body.context?.trim() && `Meeting goal or context: ${body.context.trim()}`,
    body.resume?.trim() && `Resume (paste):\n${body.resume.trim()}`,
    body.jobDescription?.trim() &&
      `Job description (paste):\n${body.jobDescription.trim()}`,
  ].filter(Boolean) as string[];
  const userMessage = `${parts.join("\n\n")}\n\nGenerate structured preparation notes as JSON.`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Meeting brief is not configured. Please contact support." },
      { status: 503 }
    );
  }

  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "The service returned an empty response. Please try again." },
        { status: 502 }
      );
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "Something went wrong generating your brief. Please try again." },
        { status: 502 }
      );
    }
    const notes: PrepNotes = {
      meetingSummary:
        typeof parsed.meetingSummary === "string"
          ? parsed.meetingSummary.trim()
          : undefined,
      talkingPoints: toArray(parsed.talkingPoints),
      questionsToPrepare: toArray(parsed.questionsToPrepare),
      strengthsToHighlight: toArray(parsed.strengthsToHighlight),
      skillsToReview: toArray(parsed.skillsToReview),
      gapsOrMissing: toArray(parsed.gapsOrMissing),
      followUpQuestions: toArray(parsed.followUpQuestions),
    };
    return NextResponse.json(notes);
  } catch (err) {
    console.error("OpenAI prep error:", err);
    const isRateLimit = err instanceof Error && /rate limit|429/i.test(err.message);
    const message = isRateLimit
      ? "Too many requests. Please wait a moment and try again."
      : "We couldn't generate your meeting brief. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
