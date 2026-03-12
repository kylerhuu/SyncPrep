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

/** Abbreviation → IANA time zone. */
const ABBREV_TO_TZ: Record<string, string> = {
  pst: "America/Los_Angeles",
  est: "America/New_York",
  gmt: "Europe/London",
  ict: "Asia/Bangkok",
  kst: "Asia/Seoul",
  jst: "Asia/Tokyo",
  pdt: "America/Los_Angeles",
  edt: "America/New_York",
  cst: "America/Chicago",
  mst: "America/Denver",
  utc: "UTC",
};

/** City/region names → IANA time zone. */
const CITY_TO_TZ: Record<string, string> = {
  "new york": "America/New_York",
  nyc: "America/New_York",
  "los angeles": "America/Los_Angeles",
  la: "America/Los_Angeles",
  chicago: "America/Chicago",
  "san francisco": "America/Los_Angeles",
  "san jose": "America/Los_Angeles",
  london: "Europe/London",
  paris: "Europe/Paris",
  berlin: "Europe/Berlin",
  tokyo: "Asia/Tokyo",
  singapore: "Asia/Singapore",
  sydney: "Australia/Sydney",
  "hong kong": "Asia/Hong_Kong",
  bangkok: "Asia/Bangkok",
  seoul: "Asia/Seoul",
  mumbai: "Asia/Kolkata",
  india: "Asia/Kolkata",
  "new delhi": "Asia/Kolkata",
  eastern: "America/New_York",
  pacific: "America/Los_Angeles",
  central: "America/Chicago",
  mountain: "America/Denver",
};

/** Human-readable zone names for display (e.g. "Pacific Time", "Asia/Bangkok"). */
const ZONE_DISPLAY_NAMES: Record<string, string> = {
  UTC: "UTC",
  "America/New_York": "Eastern Time",
  "America/Los_Angeles": "Pacific Time",
  "America/Chicago": "Central Time",
  "America/Denver": "Mountain Time",
  "Europe/London": "GMT/BST",
  "Europe/Paris": "Central European Time",
  "Europe/Berlin": "Central European Time",
  "Asia/Tokyo": "Japan Standard Time",
  "Asia/Seoul": "Asia/Seoul",
  "Asia/Bangkok": "Asia/Bangkok",
  "Asia/Hong_Kong": "Asia/Hong_Kong",
  "Asia/Singapore": "Asia/Singapore",
  "Asia/Kolkata": "India Standard Time",
  "Australia/Sydney": "Australia Eastern Time",
};

function toTitleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

/** All timezone options for autocomplete: label (e.g. "San Francisco — America/Los_Angeles"), value (IANA). */
let _suggestionsCache: { label: string; value: string }[] | null = null;

function buildSuggestions(): { label: string; value: string }[] {
  if (_suggestionsCache) return _suggestionsCache;
  const list: { label: string; value: string }[] = [];
  for (const [key, iana] of Object.entries(CITY_TO_TZ)) {
    const label = toTitleCase(key.replace(/_/g, " "));
    list.push({ label: `${label} — ${iana}`, value: iana });
  }
  for (const [key, iana] of Object.entries(ABBREV_TO_TZ)) {
    list.push({ label: `${key.toUpperCase()} — ${iana}`, value: iana });
  }
  list.sort((a, b) => a.label.localeCompare(b.label));
  _suggestionsCache = list;
  return list;
}

/** Filter suggestions by query (matches label or value). */
export function getTimezoneSuggestions(query: string): { label: string; value: string }[] {
  const all = buildSuggestions();
  const q = query.trim().toLowerCase();
  if (!q) return all.slice(0, 12);
  return all.filter(
    (opt) =>
      opt.label.toLowerCase().includes(q) ||
      opt.value.toLowerCase().includes(q)
  ).slice(0, 12);
}

/** Human-readable timezone label for UI (e.g. "Pacific Time", "Asia/Bangkok"). */
export function getZoneDisplayName(ianaZone: string): string {
  if (ZONE_DISPLAY_NAMES[ianaZone]) return ZONE_DISPLAY_NAMES[ianaZone];
  const region = ianaZone.split("/").pop()?.replace(/_/g, " ") ?? ianaZone;
  return ianaZone.includes("/") ? ianaZone : region;
}

function isValidIANA(zone: string): boolean {
  if (!zone.trim()) return false;
  return DateTime.now().setZone(zone.trim()).isValid;
}

/**
 * Resolve user input to an IANA timezone string.
 * 1. Normalize (trim, lowercase for lookups).
 * 2. Check abbreviation alias map (PST, EST, ICT, etc.).
 * 3. Check if input is a valid IANA timezone.
 * 4. Check city-to-timezone map.
 * 5. Return resolved IANA or raw input (caller can validate with isValidZone).
 */
export function resolveTimezone(input: string): string {
  if (!input.trim()) return "UTC";
  const trimmed = input.trim();
  const key = trimmed.toLowerCase();

  if (ABBREV_TO_TZ[key]) return ABBREV_TO_TZ[key];
  if (CITY_TO_TZ[key]) return CITY_TO_TZ[key];
  if (isValidIANA(trimmed)) return trimmed;
  return trimmed;
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
  if (!start || !end) return { valid: false, error: "Start and end time are required" };
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (Number.isNaN(sh) || Number.isNaN(sm) || Number.isNaN(eh) || Number.isNaN(em)) {
    return { valid: false, error: "Enter time as HH:mm (e.g. 09:00)" };
  }
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  if (endMins <= startMins) {
    return { valid: false, error: "End time must be after start time." };
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
