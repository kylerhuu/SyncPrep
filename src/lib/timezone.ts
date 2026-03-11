/**
 * Timezone and overlap utilities for SyncPrep scheduling.
 *
 * OVERLAP ALGORITHM (brief):
 * 1. Reference day: "today" in zone A; same calendar day in zone B (so both sides use one logical day).
 * 2. Convert each availability window (local start/end) to UTC for that day; if end <= start, treat as overnight (end += 1 day).
 * 3. For each pair (window A, window B): overlap = [max(A_start, B_start), min(A_end, B_end)]. Skip if overlap_start >= overlap_end.
 * 4. Within each overlap, step by meeting duration (30/60/90 min); emit slots [cursor, cursor + duration] while cursor + duration <= overlap_end.
 * 5. Dedupe by start ISO, sort by start, return top N suggestions.
 *
 * Uses Luxon (IANA time zones, DST-safe) for all conversions.
 */

import { DateTime } from "luxon";
import type { TimeWindow, AvailabilityRange } from "@/types";

/** Common city/region names → IANA time zone. User can also type IANA directly (e.g. America/New_York). */
const CITY_TO_TZ: Record<string, string> = {
  "new york": "America/New_York",
  nyc: "America/New_York",
  "los angeles": "America/Los_Angeles",
  la: "America/Los_Angeles",
  chicago: "America/Chicago",
  "san francisco": "America/Los_Angeles",
  london: "Europe/London",
  paris: "Europe/Paris",
  berlin: "Europe/Berlin",
  tokyo: "Asia/Tokyo",
  singapore: "Asia/Singapore",
  sydney: "Australia/Sydney",
  "hong kong": "Asia/Hong_Kong",
  mumbai: "Asia/Kolkata",
  india: "Asia/Kolkata",
  "new delhi": "Asia/Kolkata",
  eastern: "America/New_York",
  pacific: "America/Los_Angeles",
  central: "America/Chicago",
  mountain: "America/Denver",
  utc: "UTC",
  gmt: "UTC",
};

export function resolveTimezone(input: string): string {
  if (!input.trim()) return "UTC";
  const key = input.trim().toLowerCase();
  return CITY_TO_TZ[key] ?? input.trim();
}

/** Returns true if the string is a valid IANA time zone (Luxon can parse it). */
export function isValidZone(zoneOrCity: string): boolean {
  if (!zoneOrCity.trim()) return false;
  const resolved = resolveTimezone(zoneOrCity.trim());
  return DateTime.now().setZone(resolved).isValid;
}

/** Valid time window: start and end are "HH:mm" and start < end (same-day windows only for simplicity). */
export function validateTimeWindow(w: TimeWindow): { valid: boolean; error?: string } {
  const start = w.start?.trim() ?? "";
  const end = w.end?.trim() ?? "";
  if (!start || !end) return { valid: false, error: "Start and end time required" };
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (Number.isNaN(sh) || Number.isNaN(sm) || Number.isNaN(eh) || Number.isNaN(em)) {
    return { valid: false, error: "Use HH:mm format" };
  }
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  if (endMins <= startMins) {
    return { valid: false, error: "End time must be after start time" };
  }
  return { valid: true };
}

function windowToUTC(
  w: TimeWindow,
  zone: string,
  dayStart: DateTime
): { start: DateTime; end: DateTime } {
  const [sh, sm] = w.start.split(":").map(Number);
  const [eh, em] = w.end.split(":").map(Number);
  const start = dayStart.setZone(zone).set({
    hour: sh ?? 0,
    minute: sm ?? 0,
    second: 0,
    millisecond: 0,
  });
  let end = dayStart.setZone(zone).set({
    hour: eh ?? 0,
    minute: em ?? 0,
    second: 0,
    millisecond: 0,
  });
  if (end <= start) end = end.plus({ days: 1 });
  return { start: start.toUTC(), end: end.toUTC() };
}

/**
 * Convert time-of-day windows (in zone) for a reference day into UTC availability ranges.
 */
export function windowsToUtcRanges(
  zone: string,
  windows: TimeWindow[],
  refDate: DateTime
): AvailabilityRange[] {
  const tz = resolveTimezone(zone);
  const dayStart = refDate.setZone(tz).startOf("day");
  const valid = windows.filter((w) => validateTimeWindow(w).valid);
  const ranges: AvailabilityRange[] = [];
  for (const w of valid) {
    const { start, end } = windowToUTC(w, tz, dayStart);
    ranges.push({ startISO: start.toISO()!, endISO: end.toISO()! });
  }
  return ranges;
}

/** Busy event with ISO start/end (e.g. from Google Calendar). */
export interface BusyBlock {
  start: string;
  end: string;
}

/**
 * Compute availability = working hours minus busy blocks (imported calendar events).
 *
 * Algorithm:
 * 1. Convert working hours (local time-of-day in zone) to UTC ranges for refDate.
 * 2. Filter busy blocks to those overlapping the ref day (UTC day bounds).
 * 3. For each working-hour block: treat it as a segment [start, end]. For each
 *    busy block that overlaps the segment, clip busy to the segment (so we only
 *    subtract time inside the working window). Emit a free gap [segmentStart, busyStart]
 *    when segmentStart < busyStart; then set segmentStart = busyEnd and continue.
 * 4. After processing all busy, emit the final gap [segmentStart, segmentEnd] if non-empty.
 * 5. Return all gaps as AvailabilityRange[] (UTC).
 */
export function workingHoursMinusBusy(
  zone: string,
  workingHours: TimeWindow[],
  busyBlocks: BusyBlock[],
  refDate: DateTime
): AvailabilityRange[] {
  const tz = resolveTimezone(zone);
  const dayStart = refDate.setZone(tz).startOf("day");
  const dayEndUtc = dayStart.plus({ days: 1 }).toUTC();
  const dayStartUtc = dayStart.toUTC();

  const workingRanges = windowsToUtcRanges(zone, workingHours, refDate);
  if (workingRanges.length === 0) return [];

  const busyInDay = busyBlocks
    .map((b) => ({
      start: DateTime.fromISO(b.start, { setZone: true }).toUTC(),
      end: DateTime.fromISO(b.end, { setZone: true }).toUTC(),
    }))
    .filter((b) => b.end > dayStartUtc && b.start < dayEndUtc)
    .sort((a, b) => a.start.valueOf() - b.start.valueOf());

  const gaps: AvailabilityRange[] = [];
  for (const block of workingRanges) {
    let segmentStart = DateTime.fromISO(block.startISO, { setZone: true });
    const segmentEnd = DateTime.fromISO(block.endISO, { setZone: true });
    for (const busy of busyInDay) {
      if (busy.end <= segmentStart || busy.start >= segmentEnd) continue;
      const busyStart = DateTime.max(busy.start, segmentStart);
      const busyEnd = DateTime.min(busy.end, segmentEnd);
      if (segmentStart < busyStart) {
        gaps.push({
          startISO: segmentStart.toISO()!,
          endISO: busyStart.toISO()!,
        });
      }
      segmentStart = busyEnd;
      if (segmentStart >= segmentEnd) break;
    }
    if (segmentStart < segmentEnd) {
      gaps.push({
        startISO: segmentStart.toISO()!,
        endISO: segmentEnd.toISO()!,
      });
    }
  }
  return gaps.sort((a, b) => a.startISO.localeCompare(b.startISO));
}

export interface OverlapSlotResult {
  start: string;
  end: string;
  label: string;
  startISO: string;
  endISO: string;
}

/**
 * Find overlapping meeting slots from two lists of UTC availability ranges.
 *
 * Overlap flow (used by schedule page):
 * 1. User (A): rangesA = working hours minus imported calendar busy (or plain working hours if no calendar).
 * 2. Other (B): rangesB = working hours converted to UTC for ref day.
 * 3. For each pair (rangeA, rangeB), overlap = [max(startA, startB), min(endA, endB)]; step by duration to emit slots.
 * 4. Dedupe by startISO, sort chronologically; suggestions = top N.
 */
export function findOverlappingSlotsFromRanges(
  rangesA: AvailabilityRange[],
  rangesB: AvailabilityRange[],
  zoneA: string,
  zoneB: string,
  durationMinutes: number = 60
): OverlapSlotResult[] {
  const tzA = resolveTimezone(zoneA);
  const slots: OverlapSlotResult[] = [];
  const duration = { minutes: durationMinutes };

  for (const ra of rangesA) {
    const startA = DateTime.fromISO(ra.startISO, { setZone: true });
    const endA = DateTime.fromISO(ra.endISO, { setZone: true });
    for (const rb of rangesB) {
      const startB = DateTime.fromISO(rb.startISO, { setZone: true });
      const endB = DateTime.fromISO(rb.endISO, { setZone: true });
      const start = DateTime.max(startA, startB);
      const end = DateTime.min(endA, endB);
      if (start >= end) continue;
      let cursor = start;
      while (cursor.plus(duration).valueOf() <= end.valueOf()) {
        const slotEnd = cursor.plus(duration);
        const startISO = cursor.toISO()!;
        const endISO = slotEnd.toISO()!;
        slots.push({
          start: startISO,
          end: endISO,
          label: `${cursor.setZone(tzA).toFormat("h:mm a")} – ${slotEnd.setZone(tzA).toFormat("h:mm a")}`,
          startISO,
          endISO,
        });
        cursor = slotEnd;
      }
    }
  }

  const seen = new Set<string>();
  const unique = slots.filter((s) => {
    if (seen.has(s.startISO)) return false;
    seen.add(s.startISO);
    return true;
  });
  unique.sort((a, b) => a.startISO.localeCompare(b.startISO));
  return unique;
}

/**
 * Find all overlapping meeting slots for one reference day (from time-of-day windows).
 * Delegates to windowsToUtcRanges + findOverlappingSlotsFromRanges.
 */
export function findOverlappingSlots(
  zoneA: string,
  windowsA: TimeWindow[],
  zoneB: string,
  windowsB: TimeWindow[],
  refDate: DateTime = DateTime.now(),
  durationMinutes: number = 60
): OverlapSlotResult[] {
  const rangesA = windowsToUtcRanges(zoneA, windowsA, refDate);
  const rangesB = windowsToUtcRanges(zoneB, windowsB, refDate);
  return findOverlappingSlotsFromRanges(
    rangesA,
    rangesB,
    zoneA,
    zoneB,
    durationMinutes
  );
}

export function getBestSuggestions(
  slots: OverlapSlotResult[],
  n: number = 5
): OverlapSlotResult[] {
  return slots.slice(0, n);
}

/** Supported meeting durations in minutes. */
export const MEETING_DURATIONS = [30, 60, 90] as const;
export type MeetingDurationMinutes = (typeof MEETING_DURATIONS)[number];
