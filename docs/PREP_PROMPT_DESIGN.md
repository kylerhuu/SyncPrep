# AI Prep — Prompt Design

## Goal

Produce **structured, concise** preparation notes from meeting type, goal/context, and optional resume + job description. Output must be **parseable JSON** and **non-generic** (specific to the user’s inputs).

## Inputs (user-provided)

- **Meeting type** — interview | networking | team_meeting | other
- **Meeting goal or context** — free text (e.g. “30-min technical screen with eng manager”)
- **Resume** (optional) — pasted text
- **Job description** (optional) — pasted text

## Output schema (JSON)

- `meetingSummary` — 1–2 sentences: what this meeting is and how to approach it
- `likelyQuestions` / `questionsToPrepare` — questions the user is likely to be asked (or should prepare for)
- `talkingPoints` — 3–5 points to bring up or steer the conversation
- `strengthsToHighlight` — 3–5 strengths to mention (aligned with resume/JD when provided)
- `skillsToReview` — 2–4 skills or topics to brush up on before the meeting
- `gapsOrMissing` (optional) — gaps vs. role or context; only when relevant (e.g. interviews)
- `followUpQuestions` — 3–5 questions the user can ask at the end

## Prompt design principles

1. **System prompt**
   - Role: “concise meeting preparation assistant”
   - Strict JSON-only output; exact keys; omit keys if no content
   - Rules: 3–6 items per list; be **specific and actionable**; **do not** use generic phrases like “research the company” or “be confident” without tying them to the provided context, resume, or JD
   - For interviews: use resume + JD to tailor likely questions, strengths, and gaps

2. **User prompt**
   - Start with meeting type and goal/context so the model knows the situation
   - Append resume and job description when present (clearly labeled)
   - End with one clear instruction: “Generate structured preparation notes as JSON.”

3. **Anti-generic**
   - Instruct: “Do not repeat the same idea across sections. Do not give generic advice that could apply to any meeting. Reference the resume and job description when provided.”
   - Prefer concrete examples (e.g. “Discuss your React migration at X” over “Discuss relevant projects”).

4. **Length**
   - Meeting summary: 1–2 sentences
   - Each list: 3–6 items; one line per item where possible

## Implementation

- Server-side only: `POST /api/prep` with body `{ meetingType, context?, resume?, jobDescription? }`
- Model: `gpt-4o-mini` with `response_format: { type: "json_object" }`
- Parse response and validate shape; return typed `PrepNotes` to the client.
