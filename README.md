# SyncPrep

AI-powered meeting preparation and scheduling for students and early-career professionals. Find overlapping times across time zones, get a Google Calendar link, and generate structured prep notes (including resume and job description analysis).

## Stack

- **Next.js 14** (App Router), **React**, **TypeScript**, **Tailwind CSS**
- **Luxon** for timezone and overlap logic
- **OpenAI API** for prep notes (via server route)

## Setup

1. Install dependencies: `npm install`
2. Copy env example: `cp .env.local.example .env.local`
3. Add your OpenAI API key to `.env.local`: `OPENAI_API_KEY=sk-...`
4. (Optional) For **Google Calendar import**: add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `SESSION_SECRET` to `.env.local`. See [docs/GOOGLE_CALENDAR_SETUP.md](docs/GOOGLE_CALENDAR_SETUP.md).
5. Run dev: `npm run dev` → open [http://localhost:3000](http://localhost:3000)

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint

## Flow

1. **Landing** (`/`) — value prop and “Get started” → `/schedule`
2. **Schedule** (`/schedule`) — time zones, availability, meeting context; optional Google Calendar connection to show your events; overlapping slots, calendar link, and “Generate prep notes”. Prep notes also saved to sessionStorage.
3. **Prep results** (`/prep`) — focused view of last generated prep notes (read from sessionStorage). Link appears on schedule after generating.
4. **API** `POST /api/prep` — meeting type + optional context/resume/job description → OpenAI → structured prep JSON

State: React state + sessionStorage for form data, selected slot, and prep notes.

## Folder structure

See [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md) for the full tree. Summary: `src/app` (layout, pages, api), `src/components` (ui, scheduler, prep), `src/lib` (timezone, calendar), `src/types`.

## Docs

- [docs/MVP_SPEC.md](docs/MVP_SPEC.md) — refined MVP definition, user flow, components, API, state
- [docs/MVP_PLAN.md](docs/MVP_PLAN.md) — original plan
- [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md) — folder structure
- [docs/GOOGLE_CALENDAR_SETUP.md](docs/GOOGLE_CALENDAR_SETUP.md) — Google Calendar OAuth and import (MVP)
