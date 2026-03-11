/**
 * Fetch events from Google Calendar API (server-side, with valid access token).
 */

import type { CalendarEventItem } from "@/types/calendar";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  htmlLink?: string;
}

/** Fetch primary calendar events for the given time range (ISO strings). */
export async function fetchCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEventItem[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "100",
  });
  const res = await fetch(`${CALENDAR_API}?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    const err = await res.text();
    throw new Error(`Calendar API error: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { items?: GoogleCalendarEvent[] };
  const items = data.items ?? [];
  const out: CalendarEventItem[] = [];
  for (const e of items) {
    const start = e.start?.dateTime ?? e.start?.date;
    const end = e.end?.dateTime ?? e.end?.date;
    if (!start || !end) continue;
    out.push({
      id: e.id,
      summary: e.summary ?? "(No title)",
      start,
      end,
      htmlLink: e.htmlLink,
    });
  }
  return out;
}
