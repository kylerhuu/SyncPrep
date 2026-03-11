# Google Calendar import (MVP)

SyncPrep can import your Google Calendar events (read-only) so you see them next to your availability.

## Architecture

- **OAuth**: Server-side flow. User clicks "Connect Google Calendar" → redirect to Google → callback at `/api/auth/google/callback` exchanges the code for tokens.
- **Token storage**: Access and refresh tokens are stored in an **encrypted httpOnly cookie** (using `jose`). No database required for MVP.
- **API**: **events.list** (not freebusy) so we can show event titles and times in the calendar view. Freebusy would only give busy slots.
- **Scope**: `https://www.googleapis.com/auth/calendar.events.readonly` (read-only events).
- **Range**: Next 14 days of events from the user’s **primary** calendar.

## Setup

1. **Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.
   - Enable **Google Calendar API**: APIs & Services → Library → search "Google Calendar API" → Enable.
   - Create OAuth 2.0 credentials: APIs & Services → Credentials → Create Credentials → OAuth client ID.
   - Application type: **Web application**.
   - Add **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/google/callback` (local)
     - `https://your-app.vercel.app/api/auth/google/callback` (production; use your Vercel deployment URL)
   - Copy the **Client ID** and **Client secret**.

2. **Environment variables** (in `.env.local`)

   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   SESSION_SECRET=at-least-32-characters-long-random-string
   ```

   `SESSION_SECRET` is used to encrypt the OAuth tokens in the cookie. Use a long random string (e.g. `openssl rand -base64 32`).

3. Restart the dev server and use **Connect Google Calendar** on the schedule page.

## Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/google` | GET | Redirects to Google OAuth consent. |
| `/api/auth/google/callback` | GET | Exchanges code for tokens, sets cookie, redirects to `/schedule?calendar=connected`. |
| `/api/auth/google/disconnect` | POST | Clears the token cookie. |
| `/api/calendar/events` | GET | Returns `{ connected, events }` for the next 14 days (uses cookie). |

## UI

- **Your calendar** card on the schedule page (left column, below Time zones & availability).
- When disconnected: "Connect Google Calendar" button.
- When connected: list of events grouped by day (Today, Tomorrow, then date), with time and title; "Disconnect calendar" link.
- Event times are shown in the user’s selected time zone (or browser default if none).

## Security

- Tokens never sent to the client; only the server reads the cookie.
- Cookie is httpOnly, sameSite=lax, and secure in production.
- Minimum scope: read-only calendar events.

## Limitations (MVP)

- No two-way sync; import only.
- No recurring-event expansion (Google returns recurring instances when `singleEvents=true`).
- No calendar picker; only primary calendar.
- Tokens stored in a cookie (no DB). Logging out or clearing cookies disconnects the calendar.
