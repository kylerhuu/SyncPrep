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
4. Run dev: `npm run dev` → open [http://localhost:3000](http://localhost:3000)

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint

## Flow

1. **Landing** (`/`) — value prop and “Get started” to `/schedule`
2. **Schedule** (`/schedule`) — left: time zones, availability windows, meeting context (type, resume, JD); right: overlapping slots, “Add to Google Calendar,” and “Generate prep notes”
3. **API** `POST /api/prep` — sends meeting type + optional context/resume/job description to OpenAI; returns structured prep JSON

State is kept in React and optionally in `sessionStorage` so a refresh keeps your inputs and selected time.

## Docs

See [docs/MVP_PLAN.md](docs/MVP_PLAN.md) for product definition, MVP scope, and architecture.
