/**
 * Convert ISO 8601 string to Google Calendar format: YYYYMMDDTHHMMSSZ (UTC).
 * Strips hyphens, colons, fractional seconds; normalizes timezone to Z.
 */
function toGoogleDatesFormat(iso: string): string {
  const s = iso.replace(/[-:]/g, "").replace(/\.\d+/, "");
  const withoutTz = s.split(/[Z+-]/)[0];
  return withoutTz + "Z";
}

/**
 * Build a Google Calendar "Add event" URL for a given time slot.
 * User opens in new tab to add to their calendar.
 * Uses www.google.com/calendar/render and keeps the slash in dates unencoded so Google accepts it.
 */
export function buildGoogleCalendarUrl(
  startISO: string,
  endISO: string,
  title: string = "Meeting",
  details: string = ""
): string {
  const base = "https://www.google.com/calendar/render";
  const startStr = toGoogleDatesFormat(startISO);
  const endStr = toGoogleDatesFormat(endISO);
  const params = new URLSearchParams();
  params.set("action", "TEMPLATE");
  params.set("text", title);
  // dates must be start/end with a literal slash; building manually so slash isn't encoded
  const dates = `${startStr}/${endStr}`;
  params.set("dates", dates);
  if (details) params.set("details", details);
  const query = params.toString();
  // Google expects dates=YYYYMMDDTHHMMSSZ/YYYYMMDDTHHMMSSZ - re-insert slash if it was encoded
  const finalQuery = query.includes("%2F") ? query.replace("%2F", "/") : query;
  return `${base}?${finalQuery}`;
}
