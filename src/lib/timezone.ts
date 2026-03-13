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
import type { TimeWindow, AvailabilityRange, WeeklyPattern } from "@/types";

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
 * Normalize and filter busy blocks for scheduling: keep only blocks with valid
 * ISO start/end where start < end. Skips malformed or missing dates (e.g. from
 * API failures or all-day events that might be date-only). Safe for empty input.
 */
export function toValidBusyBlocks(
  blocks: { start?: string; end?: string }[]
): BusyBlock[] {
  const result: BusyBlock[] = [];
  for (const b of blocks) {
    const start = typeof b.start === "string" ? b.start.trim() : "";
    const end = typeof b.end === "string" ? b.end.trim() : "";
    if (!start || !end) continue;
    const startDt = DateTime.fromISO(start, { setZone: true });
    const endDt = DateTime.fromISO(end, { setZone: true });
    if (!startDt.isValid || !endDt.isValid || startDt >= endDt) continue;
    result.push({ start, end });
  }
  return result;
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

  const busyInDay: { start: DateTime; end: DateTime }[] = [];
  for (const b of busyBlocks) {
    const start = DateTime.fromISO(b.start, { setZone: true });
    const end = DateTime.fromISO(b.end, { setZone: true });
    if (!start.isValid || !end.isValid || start >= end) continue;
    const startUtc = start.toUTC();
    const endUtc = end.toUTC();
    if (endUtc <= dayStartUtc || startUtc >= dayEndUtc) continue;
    busyInDay.push({ start: startUtc, end: endUtc });
  }
  busyInDay.sort((a, b) => a.start.valueOf() - b.start.valueOf());

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
 * Find overlapping (mutual) meeting slots from two lists of UTC availability ranges.
 *
 * Overlap algorithm (timezone-safe):
 * - All inputs are already in UTC (rangesA, rangesB have startISO/endISO in UTC).
 * - For each pair (rangeA, rangeB): overlap = [max(startA, startB), min(endA, endB)].
 *   If overlap is non-empty, step through it by meeting duration to emit slots.
 * - Partial overlaps (e.g. your 9–11, their 10–12) yield slots only in 10–11.
 * - Multiple windows on the same day: each range in rangesB is compared with each
 *   in rangesA, so multiple windows are handled correctly.
 * - Slots are deduped by startISO and sorted. Labels are formatted in zoneA for display.
 *
 * Used for two-person scheduling: my free slots (rangesA) vs their availability (rangesB).
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
    if (!startA.isValid || !endA.isValid) continue;
    for (const rb of rangesB) {
      const startB = DateTime.fromISO(rb.startISO, { setZone: true });
      const endB = DateTime.fromISO(rb.endISO, { setZone: true });
      if (!startB.isValid || !endB.isValid) continue;
      const start = DateTime.max(startA, startB);
      const end = DateTime.min(endA, endB);
      if (start >= end) continue;
      let cursor = start;
      while (cursor.plus(duration).valueOf() <= end.valueOf()) {
        const slotEnd = cursor.plus(duration);
        const startISO = cursor.toISO();
        const endISO = slotEnd.toISO();
        if (!startISO || !endISO) break;
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

/**
 * Convert one set of availability ranges (UTC) into bookable slots by stepping
 * through each range at the given duration. Used for single-user scheduling:
 * "when am I free?" without overlapping with another person's schedule.
 */
export function availabilityRangesToSlots(
  ranges: AvailabilityRange[],
  zone: string,
  durationMinutes: number = 60
): OverlapSlotResult[] {
  const tz = resolveTimezone(zone);
  const slots: OverlapSlotResult[] = [];
  const duration = { minutes: durationMinutes };

  for (const r of ranges) {
    const start = DateTime.fromISO(r.startISO, { setZone: true });
    const end = DateTime.fromISO(r.endISO, { setZone: true });
    if (!start.isValid || !end.isValid || start >= end) continue;
    let cursor = start;
    while (cursor.plus(duration).valueOf() <= end.valueOf()) {
      const slotEnd = cursor.plus(duration);
      const startISO = cursor.toISO();
      const endISO = slotEnd.toISO();
      if (!startISO || !endISO) break;
      slots.push({
        start: startISO,
        end: endISO,
        label: `${cursor.setZone(tz).toFormat("h:mm a")} – ${slotEnd.setZone(tz).toFormat("h:mm a")}`,
        startISO,
        endISO,
      });
      cursor = slotEnd;
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
 * Single-user availability: next 7 days of free slots from working hours minus
 * calendar busy. No second timezone or overlap with another person. Use this
 * for "my availability" only.
 */
export function getAvailabilityByDaySingleUser(
  zone: string,
  workingHours: TimeWindow[],
  busyBlocks: BusyBlock[],
  durationMinutes: number,
  refDate: DateTime = DateTime.now()
): DayAvailability[] {
  const todayInZone = refDate.setZone(resolveTimezone(zone)).startOf("day");
  const nowUtc = refDate.toUTC();
  const result: DayAvailability[] = [];

  for (let i = 0; i < AVAILABILITY_DAYS_AHEAD; i++) {
    const dayStart = todayInZone.plus({ days: i });
    const dateKey = dayStart.toFormat("yyyy-MM-dd");
    const label =
      i === 0 ? "Today" : i === 1 ? "Tomorrow" : dayStart.toFormat("EEE MMM d");

    let ranges: AvailabilityRange[];
    if (busyBlocks.length > 0) {
      ranges = workingHoursMinusBusy(zone, workingHours, busyBlocks, dayStart);
    } else {
      ranges = windowsToUtcRanges(zone, workingHours, dayStart);
    }

    if (i === 0) {
      ranges = clipRangesToMinStart(ranges, nowUtc);
    }

    const slots = availabilityRangesToSlots(ranges, zone, durationMinutes);
    result.push({ date: dateKey, label, slots });
  }

  return result;
}

/**
 * Clip availability ranges so none start before minStartUtc (e.g. "now" for today).
 * Used to avoid showing past slots on the current day. Ranges entirely in the
 * past are dropped; partially past ranges are clipped to minStartUtc.
 */
function clipRangesToMinStart(
  ranges: AvailabilityRange[],
  minStartUtc: DateTime
): AvailabilityRange[] {
  const out: AvailabilityRange[] = [];
  for (const r of ranges) {
    const start = DateTime.fromISO(r.startISO, { setZone: true });
    const end = DateTime.fromISO(r.endISO, { setZone: true });
    if (!start.isValid || !end.isValid || end <= minStartUtc) continue;
    const clippedStart = DateTime.max(start, minStartUtc);
    if (clippedStart >= end) continue;
    out.push({
      startISO: clippedStart.toISO()!,
      endISO: end.toISO()!,
    });
  }
  return out;
}

/** One day's availability for the day-toggle UI. */
export interface DayAvailability {
  date: string;
  label: string;
  slots: OverlapSlotResult[];
}

/** Manual availability window for the other person (date + time in their timezone). Id is UI-only. */
export interface OtherPersonWindowInput {
  date: string;
  start: string;
  end: string;
}

/**
 * Convert manual "other person" windows for a given day into UTC availability ranges.
 * Timezone: dateKey is interpreted in the given zone (e.g. "2026-03-13" = that calendar
 * day in their timezone); start/end are local time on that day, then converted to UTC.
 * This keeps day boundaries and labels consistent and avoids midnight-shift bugs.
 * Windows on other days are ignored. Multiple windows on the same day all contribute.
 */
export function manualWindowsToUtcRangesForDay(
  windows: OtherPersonWindowInput[],
  dateKey: string,
  zone: string
): AvailabilityRange[] {
  const tz = resolveTimezone(zone);
  const dayStart = DateTime.fromISO(dateKey, { zone: tz }).startOf("day");
  if (!dayStart.isValid) return [];

  const ranges: AvailabilityRange[] = [];
  for (const w of windows) {
    if (w.date !== dateKey) continue;
    const [sh, sm] = w.start.split(":").map(Number);
    const [eh, em] = w.end.split(":").map(Number);
    const start = dayStart.set({
      hour: sh ?? 0,
      minute: sm ?? 0,
      second: 0,
      millisecond: 0,
    });
    let end = dayStart.set({
      hour: eh ?? 0,
      minute: em ?? 0,
      second: 0,
      millisecond: 0,
    });
    if (end <= start) continue;
    ranges.push({
      startISO: start.toUTC().toISO()!,
      endISO: end.toUTC().toISO()!,
    });
  }
  return ranges.sort((a, b) => a.startISO.localeCompare(b.startISO));
}

/**
 * Convert recurring weekly pattern windows (by weekday) for a given date into UTC ranges.
 * The weekday is determined from dateKey in the other person's timezone.
 */
function weeklyPatternToUtcRangesForDay(
  pattern: WeeklyPattern | null | undefined,
  dateKey: string,
  zone: string
): AvailabilityRange[] {
  if (!pattern) return [];
  const tz = resolveTimezone(zone);
  const dayStart = DateTime.fromISO(dateKey, { zone: tz }).startOf("day");
  if (!dayStart.isValid) return [];

  const weekday = dayStart.weekday; // 1 = Monday ... 7 = Sunday
  const weekdayName: keyof WeeklyPattern =
    weekday === 1
      ? "Monday"
      : weekday === 2
        ? "Tuesday"
        : weekday === 3
          ? "Wednesday"
          : weekday === 4
            ? "Thursday"
            : weekday === 5
              ? "Friday"
              : weekday === 6
                ? "Saturday"
                : "Sunday";

  const windows = pattern[weekdayName] ?? [];
  const ranges: AvailabilityRange[] = [];
  for (const w of windows) {
    const [sh, sm] = w.start.split(":").map(Number);
    const [eh, em] = w.end.split(":").map(Number);
    const start = dayStart.set({
      hour: sh ?? 0,
      minute: sm ?? 0,
      second: 0,
      millisecond: 0,
    });
    let end = dayStart.set({
      hour: eh ?? 0,
      minute: em ?? 0,
      second: 0,
      millisecond: 0,
    });
    if (end <= start) continue;
    ranges.push({
      startISO: start.toUTC().toISO()!,
      endISO: end.toUTC().toISO()!,
    });
  }
  return ranges.sort((a, b) => a.startISO.localeCompare(b.startISO));
}

/**
 * Two-person mutual availability: for each of the next 7 days, intersect your free
 * slots (working hours minus calendar busy, in zoneA) with the other person's manual
 * windows (in zoneB). Returns one entry per day with only mutual slots.
 *
 * - My side: rangesA = working hours minus busy blocks for that day; today clipped to "now".
 * - Their side: rangesB = manual windows for that date, converted to UTC via zoneB.
 * - Overlap: findOverlappingSlotsFromRanges(rangesA, rangesB, ...) returns slots that
 *   fit in both. Empty days get slots: [] so the UI can show "No mutual availability".
 *
 * Timezone: "today" and date keys use zoneA; their windows are interpreted in zoneB
 * then converted to UTC so overlap is computed in a single time base (UTC).
 */
export function getAvailabilityByDayWithManualOther(
  zoneA: string,
  workingHoursA: TimeWindow[],
  busyBlocks: BusyBlock[],
  durationMinutes: number,
  refDate: DateTime,
  otherPersonWindows: OtherPersonWindowInput[],
  zoneB: string,
  weeklyPattern?: WeeklyPattern | null
): DayAvailability[] {
  const tzA = resolveTimezone(zoneA);
  const todayInZoneA = refDate.setZone(tzA).startOf("day");
  const nowUtc = refDate.toUTC();
  const result: DayAvailability[] = [];

  for (let i = 0; i < AVAILABILITY_DAYS_AHEAD; i++) {
    const dayStart = todayInZoneA.plus({ days: i });
    const dateKey = dayStart.toFormat("yyyy-MM-dd");
    const label =
      i === 0 ? "Today" : i === 1 ? "Tomorrow" : dayStart.toFormat("EEE MMM d");

    let rangesA: AvailabilityRange[];
    if (busyBlocks.length > 0) {
      rangesA = workingHoursMinusBusy(
        zoneA,
        workingHoursA,
        busyBlocks,
        dayStart
      );
    } else {
      rangesA = windowsToUtcRanges(zoneA, workingHoursA, dayStart);
    }

    if (i === 0) {
      rangesA = clipRangesToMinStart(rangesA, nowUtc);
    }

    const manualRanges = manualWindowsToUtcRangesForDay(
      otherPersonWindows,
      dateKey,
      zoneB
    );
    const weeklyRanges = weeklyPatternToUtcRangesForDay(
      weeklyPattern,
      dateKey,
      zoneB
    );
    const rangesB = [...manualRanges, ...weeklyRanges].sort((a, b) =>
      a.startISO.localeCompare(b.startISO)
    );
    const slots = findOverlappingSlotsFromRanges(
      rangesA,
      rangesB,
      zoneA,
      zoneB,
      durationMinutes
    );
    result.push({ date: dateKey, label, slots });
  }

  return result;
}

const AVAILABILITY_DAYS_AHEAD = 7;

/**
 * Generate availability for exactly 7 days: today (in zone A) through the next 6 days.
 * - Date boundaries: each day is that calendar day in zone A (start-of-day to next start-of-day).
 * - Working hours: applied per day via windowsToUtcRanges(..., dayStart); events outside
 *   working hours do not affect slot generation (we only subtract busy within working window).
 * - Busy blocks: filtered to those overlapping the day (UTC), then clipped to working
 *   segments; overlapping and partially overlapping events are merged correctly by
 *   the segment loop in workingHoursMinusBusy.
 * - Today: availability is clipped to "now" so no past slots are returned.
 * - Empty days: still included in the result with slots: [] so the UI can show all 7 days.
 * Returns one entry per day; no duplicate slots (findOverlappingSlotsFromRanges dedupes by startISO).
 */
export function getAvailabilityByDay(
  zoneA: string,
  zoneB: string,
  workingHoursA: TimeWindow[],
  workingHoursB: TimeWindow[],
  busyBlocks: BusyBlock[],
  durationMinutes: number,
  refDate: DateTime = DateTime.now()
): DayAvailability[] {
  const tzA = resolveTimezone(zoneA);
  const todayInZoneA = refDate.setZone(tzA).startOf("day");
  const nowUtc = refDate.toUTC();
  const result: DayAvailability[] = [];

  for (let i = 0; i < AVAILABILITY_DAYS_AHEAD; i++) {
    const dayStart = todayInZoneA.plus({ days: i });
    const dateKey = dayStart.toFormat("yyyy-MM-dd");
    const label =
      i === 0
        ? "Today"
        : i === 1
          ? "Tomorrow"
          : dayStart.toFormat("EEE MMM d");

    let rangesA: AvailabilityRange[];
    if (busyBlocks.length > 0) {
      rangesA = workingHoursMinusBusy(
        zoneA,
        workingHoursA,
        busyBlocks,
        dayStart
      );
    } else {
      rangesA = windowsToUtcRanges(zoneA, workingHoursA, dayStart);
    }

    if (i === 0) {
      rangesA = clipRangesToMinStart(rangesA, nowUtc);
    }

    const rangesB = windowsToUtcRanges(zoneB, workingHoursB, dayStart);
    const slots = findOverlappingSlotsFromRanges(
      rangesA,
      rangesB,
      zoneA,
      zoneB,
      durationMinutes
    );

    result.push({ date: dateKey, label, slots });
  }

  return result;
}

/** Supported meeting durations in minutes. */
export const MEETING_DURATIONS = [30, 60, 90] as const;
export type MeetingDurationMinutes = (typeof MEETING_DURATIONS)[number];
