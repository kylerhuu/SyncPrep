import { DateTime } from "luxon";
import type { TimeWindow } from "@/types";

const SLOT_DURATION_MINUTES = 60;
const MAX_SUGGESTIONS = 5;

/**
 * Resolve city or label to IANA timezone. Simple lookup for common cities.
 * User can also type IANA zones directly (e.g. America/New_York).
 */
const CITY_TO_TZ: Record<string, string> = {
  "new york": "America/New_York",
  "nyc": "America/New_York",
  "los angeles": "America/Los_Angeles",
  "la": "America/Los_Angeles",
  "chicago": "America/Chicago",
  "london": "Europe/London",
  "paris": "Europe/Paris",
  "berlin": "Europe/Berlin",
  "tokyo": "Asia/Tokyo",
  "singapore": "Asia/Singapore",
  "sydney": "Australia/Sydney",
  "india": "Asia/Kolkata",
  "mumbai": "Asia/Kolkata",
  "pacific": "America/Los_Angeles",
  "eastern": "America/New_York",
  "central": "America/Chicago",
  "mountain": "America/Denver",
  "utc": "UTC",
};

export function resolveTimezone(input: string): string {
  if (!input.trim()) return "UTC";
  const normalized = input.trim().toLowerCase();
  return CITY_TO_TZ[normalized] ?? input.trim();
}

/**
 * Parse "HH:mm" in the given zone for a reference date (today).
 */
function parseLocalTime(timeStr: string, zone: string, refDate: DateTime): DateTime {
  const [h, m] = timeStr.split(":").map(Number);
  return refDate.setZone(zone).set({ hour: h ?? 0, minute: m ?? 0, second: 0, millisecond: 0 });
}

/**
 * Convert a time window in local time to UTC start/end for a given day (today).
 */
function windowToUTC(
  window: TimeWindow,
  zone: string,
  refDate: DateTime
): { start: DateTime; end: DateTime } {
  const start = parseLocalTime(window.start, zone, refDate);
  let end = parseLocalTime(window.end, zone, refDate);
  if (end <= start) end = end.plus({ days: 1 });
  return { start: start.toUTC(), end: end.toUTC() };
}

export interface OverlapSlotResult {
  start: string;
  end: string;
  label: string;
  startISO: string;
  endISO: string;
}

/**
 * Find overlapping slots between two time zones and availability windows.
 * Uses "today" in zone A and the same calendar day in zone B; generates 1-hour slots.
 */
export function findOverlappingSlots(
  zoneA: string,
  windowsA: TimeWindow[],
  zoneB: string,
  windowsB: TimeWindow[],
  refDate: DateTime = DateTime.utc()
): OverlapSlotResult[] {
  const tzA = resolveTimezone(zoneA);
  const tzB = resolveTimezone(zoneB);
  const dayStartA = refDate.setZone(tzA).startOf("day");
  const dayStartB = dayStartA.setZone(tzB).startOf("day");

  const rangesA: { start: DateTime; end: DateTime }[] = [];
  for (const w of windowsA) {
    const { start, end } = windowToUTC(w, tzA, dayStartA);
    rangesA.push({ start, end });
  }
  const rangesB: { start: DateTime; end: DateTime }[] = [];
  for (const w of windowsB) {
    const { start, end } = windowToUTC(w, tzB, dayStartB);
    rangesB.push({ start, end });
  }

  const slots: OverlapSlotResult[] = [];
  const slotDuration = SLOT_DURATION_MINUTES;

  for (const ra of rangesA) {
    for (const rb of rangesB) {
      const overlapStart = DateTime.max(ra.start, rb.start);
      const overlapEnd = DateTime.min(ra.end, rb.end);
      if (overlapStart >= overlapEnd) continue;

      let cursor = overlapStart;
      while (cursor.plus({ minutes: slotDuration }) <= overlapEnd) {
        const slotEnd = cursor.plus({ minutes: slotDuration });
        const startISO = cursor.toISO()!;
        const endISO = slotEnd.toISO()!;
        const label = `${cursor.setZone(tzA).toFormat("h:mm a ZZZ")} – ${slotEnd.setZone(tzA).toFormat("h:mm a ZZZ")}`;
        slots.push({
          start: cursor.toISO()!,
          end: endISO,
          label,
          startISO,
          endISO,
        });
        cursor = slotEnd;
      }
    }
  }

  // Dedupe by start time and sort
  const seen = new Set<string>();
  const unique = slots.filter((s) => {
    const key = s.startISO;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.sort((a, b) => a.startISO.localeCompare(b.startISO));
  return unique;
}

/**
 * Return the best N suggestions (first N in sorted order, e.g. morning slots first).
 */
export function getBestSuggestions(
  slots: OverlapSlotResult[],
  n: number = MAX_SUGGESTIONS
): OverlapSlotResult[] {
  return slots.slice(0, n);
}
