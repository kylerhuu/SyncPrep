/** Event from Google Calendar API (simplified for UI). */
export interface CalendarEventItem {
  id: string;
  summary: string;
  start: string; // ISO
  end: string;   // ISO
  htmlLink?: string;
}
