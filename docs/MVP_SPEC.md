# SyncPrep — Refined MVP Spec

A single reference for a **clean, buildable MVP**: definition, user flow, pages, components, API, state, libraries, and folder structure. Kept realistic for a class project with no extra backend complexity.

---

## 1. Tighter MVP Definition

**One-sentence:** SyncPrep lets a user enter two time zones and availability, see overlapping meeting times, get a Google Calendar link for a chosen slot, and generate structured AI prep notes from meeting type plus optional resume/job description.

**In scope (only):**

| Feature | What it means |
|--------|----------------|
| Two time zones | Two text inputs (IANA zone or city name); simple client-side city→zone lookup. |
| Availability windows | For each side: one or more [start time, end time] in local time for **one day** (e.g. today). |
| Overlap + suggestions | Client-side calculation (Luxon); show overlapping 1-hour slots; surface top 5 as “suggestions.” |
| Pick a time | User clicks a slot → store selection → show “Add to Google Calendar” with a working link. |
| Google Calendar link | Open in new tab; prefill title, start, end (UTC). No calendar API or OAuth. |
| Meeting context | One form: meeting type (interview / networking / team meeting / other), optional free-text context, optional resume paste, optional job description paste. |
| AI prep notes | One button “Generate prep notes” → POST to API → display structured sections (summary, talking points, questions, strengths, gaps, follow-ups). No streaming; one request, one response. |

**Out of scope (explicit no):**

- User accounts, login, database, persistence across devices.
- More than two people or recurring availability.
- Calendly-style shareable booking pages or calendar sync (Google/Microsoft APIs).
- Email, reminders, or notifications.
- Multiple “sessions” or saved meetings; one flow per page load (with optional sessionStorage so refresh keeps form data).

**Success criteria for MVP:** User can complete the flow in one sitting: enter zones + availability → see overlaps → select a time → open calendar link → fill context (and optionally resume/JD) → generate and read prep notes. No crashes; calendar link opens with correct time; prep output is structured and readable.

---

## 2. User Flow

Single linear flow; no branching paths.

1. **Land** on home → read value prop → click “Get started” (or “Start scheduling”).
2. **Schedule page** loads (single page for the rest of the flow).
3. **Left column:**  
   - Enter “Your time zone” and “Other person’s time zone” (e.g. `New York`, `London`).  
   - Enter “Your availability” and “Other person’s availability” (add/remove time windows; default one window 9–5).  
   - Optionally fill “Meeting context”: type, short context, resume, job description.  
   - Click “Generate prep notes” when ready (can be before or after picking a time).
4. **Right column (reactive):**  
   - As soon as both zones and at least one window per side are present, show **overlapping slots** and **top 5 suggestions**.  
   - User **clicks a slot** to select it → “Add to Google Calendar” appears with a link; user can open in new tab.  
   - After “Generate prep notes”, show **prep panel** (loading → structured sections or error).
5. **No separate “results” or “prep” page.** Everything stays on the schedule page; right column updates from state.

No auth gates, no “save” or “load meeting” — just one continuous flow. Optional: persist form + selected slot in sessionStorage so a refresh doesn’t lose work.

---

## 3. Page Structure

| Route | Purpose | Content |
|-------|--------|---------|
| `/` | Landing | Hero + value prop (time zones, calendar link, AI prep); primary CTA “Get started” → `/schedule`. Optional “Home” in header on schedule page back to `/`. |
| `/schedule` | Main app | One page: **left** = form (time zones, availability, meeting context + “Generate prep notes”); **right** = overlap results, selected-slot calendar link, prep notes panel. Responsive: stack vertically on small screens. |

No other routes for MVP. No `/api` pages visible to the user; API is used only via fetch from the schedule page.

---

## 4. Component Breakdown

**Layout / shell**

- **Root layout** (`app/layout.tsx`): HTML shell, global CSS (Tailwind), metadata. No shared nav beyond what’s on each page.
- **Landing** (`app/page.tsx`): Header (logo + “Get started”), hero text, CTA button, short feature list. No state.

**Schedule page** (`app/schedule/page.tsx`)

- **Client component.** Holds all form and results state; composes the components below.
- **Layout:** Header (logo + “Home”), title “Schedule & prepare”, then two-column grid (left = form blocks, right = results blocks).

**Scheduler (left column)**

| Component | Responsibility | Props (conceptual) |
|-----------|----------------|-------------------|
| `TimezoneFields` | Two text inputs: “Your time zone”, “Other person’s time zone”. Placeholder hints (e.g. city or IANA). | `zoneA`, `zoneB`, `onZoneAChange`, `onZoneBChange` |
| `AvailabilityWindows` | List of time ranges for one side. Each row: start time, end time, “Remove”. “Add window” button. Uses `<input type="time">`. | `windows`, `onChange`, `label` (e.g. “Your availability”) |
| (Optional wrapper card) | Card “Time zones & availability” wrapping the two above. | — |

**Results (right column)**

| Component | Responsibility | Props |
|-----------|----------------|-------|
| `OverlapResults` | If no slots: short message “Enter time zones and availability…”. If slots: list of **suggested** slots (top 5); each is a button; selected state visually distinct. | `allSlots`, `suggestedSlots`, `selectedSlot`, `onSelectSlot` |
| `CalendarLink` | Renders only if `slot` is set. “Add to Google Calendar” link (target blank); show slot label below. | `slot`, optional `title` |
| `PrepNotesPanel` | If loading: “Generating…”. If error: show message. If data: render sections (summary, talking points, questions, strengths, skills to review, gaps, follow-ups). | `notes`, `loading`, `error` |

**Prep (left column)**

| Component | Responsibility | Props |
|-----------|----------------|-------|
| `MeetingContextForm` | Meeting type `<select>`, optional context `<textarea>`, optional resume `<textarea>`, optional job description `<textarea>`. | All current values + `on*Change` handlers |
| (Button) | “Generate prep notes” — in schedule page, not inside a card. Calls API and passes result to `PrepNotesPanel`. | — |

**Shared UI**

| Component | Use |
|-----------|-----|
| `Card` | Wrapper with optional title bar for “Time zones & availability”, “Available times”, “Add to calendar”, “Meeting context”, “Preparation notes”. |

No need for a design system beyond Card and standard form elements; keep components presentational and fed by parent state.

---

## 5. API Route Breakdown

**Single route:** `POST /api/prep`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Accept meeting context; call OpenAI; return structured prep JSON. |
| **Auth** | None. API key stays on server (`OPENAI_API_KEY` in env). |
| **Request** | `Content-Type: application/json`. Body: `{ meetingType, context?, resume?, jobDescription? }`. All optional except `meetingType` (string). |
| **Response** | 200: JSON object matching `PrepNotes` (see types). 4xx/5xx: `{ error: string }`. |
| **Implementation** | Instantiate OpenAI client **inside the handler** (not at module scope) so build works without env. Use `gpt-4o-mini` (or `gpt-4o`), single user message + system prompt that enforces JSON shape. `response_format: { type: "json_object" }` if supported. Parse and return. No streaming. |
| **Errors** | Missing/invalid body → 400. Missing `OPENAI_API_KEY` or OpenAI failure → 500 with message. |

No other API routes. Overlap math and calendar URL are computed on the client.

---

## 6. State Management Approach

**No Redux, Zustand, or global store.** Single-page state in the schedule route.

- **Where:** All state lives in `app/schedule/page.tsx`: `useState` for zones, windows A/B, selected slot, meeting type, context, resume, job description, prep notes, loading, error.
- **Derived data:** `allSlots` and `suggestedSlots` from `useMemo` (Luxon overlap + “top 5”). No separate store for “computed slots.”
- **Persistence:** Optional `sessionStorage`: on mount, read keys for form + selected slot; on state change, write back. Keys namespaced (e.g. `syncprep_zoneA`). Prep notes and loading/error are not persisted (re-generate on refresh).
- **API:** One handler function that sets loading, calls `fetch('/api/prep', { method: 'POST', body: JSON.stringify(...) })`, then sets notes or error and clears loading. No caching layer for MVP.

This keeps the app easy to reason about and suitable for a class project: one parent component, clear data flow, minimal moving parts.

---

## 7. Recommended Libraries

| Need | Library | Version / note |
|------|---------|-----------------|
| Framework | Next.js (App Router) | 14.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| Time zones / overlap | Luxon | 3.x; IANA, DST-safe; use for “today” in zone A, same calendar day in zone B, 1-hour slots. |
| AI | openai (official SDK) | 4.x; used only in API route. |
| Runtime | React | 18.x (comes with Next.js). |

**Do not add for MVP:** database client, auth library, state library, date picker (use native `type="time"`), UI component library (keep Tailwind + minimal custom components). Add ESLint + TypeScript strict so the project stays buildable.

---

## 8. Project Folder Structure

```
SyncPrep/
├── docs/
│   ├── MVP_PLAN.md          # Original plan (optional to keep)
│   └── MVP_SPEC.md          # This spec
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout, metadata, globals.css
│   │   ├── page.tsx         # Landing
│   │   ├── schedule/
│   │   │   └── page.tsx     # Main app (client): form + results
│   │   ├── api/
│   │   │   └── prep/
│   │   │       └── route.ts  # POST /api/prep → OpenAI → JSON
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   │   └── Card.tsx
│   │   ├── scheduler/
│   │   │   ├── TimezoneFields.tsx
│   │   │   ├── AvailabilityWindows.tsx
│   │   │   ├── OverlapResults.tsx
│   │   │   └── CalendarLink.tsx
│   │   └── prep/
│   │       ├── MeetingContextForm.tsx
│   │       └── PrepNotesPanel.tsx
│   ├── lib/
│   │   ├── timezone.ts      # resolveTimezone, findOverlappingSlots, getBestSuggestions
│   │   └── calendar.ts     # buildGoogleCalendarUrl
│   └── types/
│       └── index.ts         # MeetingType, TimeWindow, OverlapSlot, PrepNotes, MeetingContext
├── .env.local.example       # OPENAI_API_KEY=
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

**Conventions:** Use `@/` path alias for `src/`. Keep API route in `app/api`; keep all prep/scheduler UI components under `components/` with subfolders by feature. No `pages/` directory (App Router only).

---

## Design Direction (recap)

- **Modern, organized, familiar:** Calendars and forms; cards and panels; clear hierarchy. No experimental or flashy visuals.
- **Desktop-first, responsive:** Two-column layout on large screens; stack on small. Touch-friendly targets.
- **Minimal clutter:** Only the form fields and results needed for the flow; no extra dashboards or settings for MVP.

This spec is the single source of truth for what “MVP” means and how the project is structured. Implementation should match it so the app stays clean and buildable.
