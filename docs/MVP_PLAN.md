# SyncPrep MVP — Product Definition & Build Plan

## 1. Product Definition (Buildable)

**SyncPrep** is a single-page–oriented web app that:

- Lets a user specify **two time zones** (or city names resolved to time zones) and **availability windows** for each side.
- **Computes overlapping meeting slots** and surfaces **top suggested times**.
- Lets the user **pick a time** and get a **Google Calendar event URL** they can open or share.
- Captures **meeting context** (interview, networking, team meeting) and optionally **resume + job description** text.
- Calls **OpenAI** to produce **structured prep notes** (summary, talking points, questions to prepare, strengths to highlight, gaps, follow-up questions) and displays them in a clear, sectioned layout.

**Out of scope for MVP:** User accounts, persistence across sessions, Calendly-style shareable links, calendar sync, or multi-user collaboration. State lives in React/localStorage as needed.

---

## 2. MVP Scope

| In scope | Out of scope |
|----------|--------------|
| Two time zones + availability windows | More than two participants |
| Overlap calculation + best-time suggestions | Database / user auth |
| Google Calendar event link (open in new tab) | Calendly-style public booking pages |
| Meeting type + optional resume/job description | Calendar sync (Google/Microsoft) |
| Structured AI prep notes via OpenAI | Notifications, reminders |
| Single primary flow: schedule → pick time → prep | Enterprise features |

---

## 3. Tech Architecture

- **Framework:** Next.js 14+ (App Router), React, TypeScript.
- **Styling:** Tailwind CSS.
- **Timezone:** `luxon` (IANA zones, DST-safe) for overlap math; optional city→tz via a small lookup or fixed list.
- **AI:** OpenAI API (e.g. `gpt-4o-mini` or `gpt-4o`) via **Next.js API routes** (no keys in client).
- **State:** React state + optional `sessionStorage`/`localStorage` for selected time and context so refresh doesn’t lose everything.
- **No database** for MVP.

**Data flow:**

1. User inputs → client state.
2. Overlap calculation in client (luxon) for simplicity and speed.
3. “Create calendar link” → build `https://calendar.google.com/calendar/render?action=TEMPLATE&...` in client.
4. “Generate prep notes” → POST to `/api/prep` with meeting type, context, resume, JD → server calls OpenAI → returns structured JSON → client renders sections.

---

## 4. Folder Structure

```
SyncPrep/
├── docs/
│   └── MVP_PLAN.md
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Landing
│   │   ├── schedule/
│   │   │   └── page.tsx              # Scheduler + prep flow
│   │   └── api/
│   │       └── prep/
│   │           └── route.ts          # OpenAI prep generation
│   ├── components/
│   │   ├── scheduler/
│   │   │   ├── TimezoneFields.tsx
│   │   │   ├── AvailabilityWindows.tsx
│   │   │   ├── OverlapResults.tsx
│   │   │   └── CalendarLink.tsx
│   │   ├── prep/
│   │   │   ├── MeetingContextForm.tsx
│   │   │   └── PrepNotesPanel.tsx
│   │   └── ui/                      # shared (card, button, etc.)
│   ├── lib/
│   │   ├── timezone.ts               # overlap + suggestions
│   │   └── calendar.ts              # Google Calendar URL
│   └── types/
│       └── index.ts
├── .env.local.example
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 5. Main Pages, Components, API Routes

| Item | Purpose |
|------|--------|
| **Pages** | |
| `app/page.tsx` | Landing: value prop, CTA to “Get started” → `/schedule` |
| `app/schedule/page.tsx` | Main flow: left = form (tz, availability, context, resume/JD); right = overlap results + prep notes |
| **Components** | |
| `TimezoneFields` | Two inputs: timezone or city for Person A & B |
| `AvailabilityWindows` | For each side: list of [start, end] windows (e.g. 9–12, 14–17) in local time |
| `OverlapResults` | Renders overlapping slots and “best” suggestions; click to select |
| `CalendarLink` | Shows “Add to Google Calendar” button/link using selected slot |
| `MeetingContextForm` | Meeting type, short context, optional resume + JD textareas |
| `PrepNotesPanel` | Displays structured prep sections from API |
| **API** | |
| `POST /api/prep` | Body: `{ meetingType, context?, resume?, jobDescription? }` → OpenAI → structured prep JSON |

---

## 6. Step-by-Step Implementation Plan

1. **Scaffold** Next.js + TypeScript + Tailwind; add `luxon` and `openai`.
2. **Landing page** with clear CTA to `/schedule`.
3. **Schedule page layout**: left column (form), right column (results + prep).
4. **Timezone + availability**: inputs and state; use luxon for overlap calculation in `lib/timezone.ts`.
5. **Overlap results + suggestions**: compute and show; on select, store in state and show CalendarLink.
6. **Google Calendar URL**: implement in `lib/calendar.ts` and use in CalendarLink.
7. **Meeting context form**: meeting type, context, resume, JD.
8. **API route `/api/prep`**: parse body, call OpenAI with structured prompt, return JSON.
9. **PrepNotesPanel**: call API, show loading, render sections (summary, talking points, questions, etc.).
10. **Persist** selected time/context in sessionStorage so refresh keeps state; polish and responsive pass.

---

## 7. Implementation

Proceeding to implement the app file by file.
