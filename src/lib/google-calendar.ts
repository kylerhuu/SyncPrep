/**
 * Google Calendar API helpers: fetch existing events and create new ones
 * using the authenticated user's primary calendar.
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

export interface CreateCalendarEventInput {
  startISO: string;
  endISO: string;
  timeZone: string;
  title: string;
  description?: string;
  attendees?: string[];
}

/** Create a single event on the user's primary calendar. */
export async function createCalendarEvent(
  accessToken: string,
  input: CreateCalendarEventInput
): Promise<CalendarEventItem> {
  const body = {
    summary: input.title,
    description: input.description ?? "",
    start: {
      dateTime: input.startISO,
      timeZone: input.timeZone,
    },
    end: {
      dateTime: input.endISO,
      timeZone: input.timeZone,
    },
    attendees:
      input.attendees && input.attendees.length > 0
        ? input.attendees.map((email) => ({ email }))
        : undefined,
  };

  const res = await fetch(CALENDAR_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    const err = await res.text();
    throw new Error(`CREATE_EVENT_ERROR:${res.status}:${err}`);
  }

  const data = (await res.json()) as GoogleCalendarEvent;
  const start = data.start?.dateTime ?? data.start?.date;
  const end = data.end?.dateTime ?? data.end?.date;
  if (!data.id || !start || !end) {
    throw new Error("CREATE_EVENT_MALFORMED_RESPONSE");
  }

  return {
    id: data.id,
    summary: data.summary ?? input.title,
    start,
    end,
    htmlLink: data.htmlLink,
  };
}
