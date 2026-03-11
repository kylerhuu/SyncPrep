import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { PrepNotes } from "@/types";

const PREP_SYSTEM = `You are a concise meeting preparation assistant. You output only valid JSON with no markdown or extra text.
Use this exact structure (omit keys if no content):
{
  "meetingSummary": "1-2 sentence summary of the meeting and how to approach it",
  "talkingPoints": ["point 1", "point 2", ...],
  "questionsToPrepare": ["question 1", ...],
  "strengthsToHighlight": ["strength 1", ...],
  "skillsToReview": ["skill or topic 1", ...],
  "gapsOrMissing": ["gap 1", ...],
  "followUpQuestions": ["question to ask 1", ...]
}
Keep each list to 3-6 items. Be specific and actionable. Do not be generic or rambly.`;

function buildUserMessage(
  meetingType: string,
  context?: string,
  resume?: string,
  jobDescription?: string
): string {
  const parts: string[] = [`Meeting type: ${meetingType}.`];
  if (context?.trim()) parts.push(`Context: ${context.trim()}`);
  if (resume?.trim()) parts.push(`\nResume:\n${resume.trim()}`);
  if (jobDescription?.trim()) parts.push(`\nJob description:\n${jobDescription.trim()}`);
  parts.push("\nGenerate structured preparation notes as JSON.");
  return parts.join("\n");
}

export async function POST(request: Request) {
  let body: { meetingType?: string; context?: string; resume?: string; jobDescription?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const meetingType = body.meetingType ?? "other";
  const userMessage = buildUserMessage(
    meetingType,
    body.context,
    body.resume,
    body.jobDescription
  );

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local." },
        { status: 500 }
      );
    }
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: PREP_SYSTEM },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "Empty response from OpenAI" }, { status: 500 });
    }
    const parsed = JSON.parse(raw) as PrepNotes;
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("OpenAI prep error:", err);
    const message = err instanceof Error ? err.message : "OpenAI request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
