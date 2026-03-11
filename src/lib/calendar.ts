/**
 * Google Calendar "Add event" URL builder.
 *
 * Uses the action=TEMPLATE format. Times must be in UTC (ISO 8601).
 * Google expects: dates=YYYYMMDDTHHMMSSZ/YYYYMMDDTHHMMSSZ (start/end).
 */

const CALENDAR_BASE = "https://www.google.com/calendar/render";

/**
 * Convert an ISO 8601 string to Google's format: YYYYMMDDTHHMMSSZ (UTC).
 * Strips hyphens, colons, and fractional seconds; normalizes timezone to Z.
 */
function toGoogleDate(iso: string): string {
  if (!iso || typeof iso !== "string" || !iso.includes("T")) return "";
  const s = iso.replace(/[-:]/g, "").replace(/\.\d+/, "");
  const base = s.split(/[Z+-]/)[0];
  return base ? base + "Z" : "";
}

export interface CalendarEventOptions {
  /** Event title (e.g. "Meeting") */
  title?: string;
  /** Optional description body */
  details?: string;
}

/**
 * Build a Google Calendar URL that opens the "Add event" form with pre-filled
 * start and end times (UTC). The user's calendar will show the event in their
 * local timezone.
 *
 * @param startISO - Start time in ISO 8601 (e.g. from Luxon toISO())
 * @param endISO - End time in ISO 8601
 * @param title - Event title (default "Meeting")
 * @param details - Optional description
 */
export function buildGoogleCalendarUrl(
  startISO: string,
  endISO: string,
  title: string = "Meeting",
  details: string = ""
): string {
  const startStr = toGoogleDate(startISO);
  const endStr = toGoogleDate(endISO);
  if (!startStr || !endStr) return CALENDAR_BASE;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startStr}/${endStr}`,
  });
  if (details) params.set("details", details);
  const query = params.toString().replace("%2F", "/");
  return `${CALENDAR_BASE}?${query}`;
}
