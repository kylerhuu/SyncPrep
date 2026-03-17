import { DateTime } from "luxon";
import type { ParsedBusyInterval, DayCoverage } from "@/lib/screenshot-parse";
import type { ParsedDraftWindow } from "@/lib/availability-draft";
import type { WeeklyPattern, Weekday, TimeWindow } from "@/types";

const WEEKDAY_KEYS: Weekday[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function minutesToTime(totalMinutes: number): string {
  const bounded = Math.max(0, Math.min(24 * 60, Math.round(totalMinutes)));
  const hours = Math.floor(bounded / 60);
  const minutes = bounded % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function mergeBusyIntervals(intervals: ParsedBusyInterval[]): ParsedBusyInterval[] {
  const sorted = [...intervals].sort((a, b) => a.start.localeCompare(b.start));
  const merged: ParsedBusyInterval[] = [];
  for (const interval of sorted) {
    if (merged.length === 0) {
      merged.push(interval);
      continue;
    }
    const prev = merged[merged.length - 1];
    if (timeToMinutes(interval.start) <= timeToMinutes(prev.end)) {
      prev.end =
        timeToMinutes(interval.end) > timeToMinutes(prev.end) ? interval.end : prev.end;
      prev.warnings = Array.from(new Set([...(prev.warnings ?? []), ...(interval.warnings ?? [])]));
      prev.overallConfidence = Math.min(prev.overallConfidence ?? 1, interval.overallConfidence ?? 1);
    } else {
      merged.push(interval);
    }
  }
  return merged;
}

function subtractBusyFromWindow(
  window: TimeWindow,
  busy: ParsedBusyInterval[]
): Array<{ start: string; end: string }> {
  const windowStart = timeToMinutes(window.start);
  const windowEnd = timeToMinutes(window.end);
  if (windowEnd <= windowStart) return [];
  const clipped = mergeBusyIntervals(
    busy.filter((interval) => interval.end > window.start && interval.start < window.end)
  );
  const free: Array<{ start: string; end: string }> = [];
  let cursor = windowStart;
  for (const interval of clipped) {
    const busyStart = Math.max(windowStart, timeToMinutes(interval.start));
    const busyEnd = Math.min(windowEnd, timeToMinutes(interval.end));
    if (busyStart > cursor) {
      free.push({ start: minutesToTime(cursor), end: minutesToTime(busyStart) });
    }
    cursor = Math.max(cursor, busyEnd);
  }
  if (cursor < windowEnd) {
    free.push({ start: minutesToTime(cursor), end: minutesToTime(windowEnd) });
  }
  return free.filter((interval) => interval.end > interval.start);
}

export function createDefaultScreenshotWorkingHours(): WeeklyPattern {
  return {
    Sunday: [],
    Monday: [{ start: "09:00", end: "17:00" }],
    Tuesday: [{ start: "09:00", end: "17:00" }],
    Wednesday: [{ start: "09:00", end: "17:00" }],
    Thursday: [{ start: "09:00", end: "17:00" }],
    Friday: [{ start: "09:00", end: "17:00" }],
    Saturday: [],
  };
}

export function getWeekdayFromIsoDate(date: string): Weekday {
  const dt = DateTime.fromISO(date);
  return WEEKDAY_KEYS[dt.weekday % 7];
}

export function deriveAvailabilityFromBusyMap(args: {
  busyByDate: Record<string, ParsedBusyInterval[]>;
  dayCoverage: Record<string, DayCoverage>;
  workingHours: WeeklyPattern;
}): { draft: ParsedDraftWindow[]; warnings: string[] } {
  const { busyByDate, dayCoverage, workingHours } = args;
  const draft: ParsedDraftWindow[] = [];
  const warnings: string[] = [];

  for (const [date, coverage] of Object.entries(dayCoverage)) {
    const busy = busyByDate[date] ?? [];
    if (coverage === "unknown") {
      warnings.push(`Skipped ${date} because screenshot coverage was unknown.`);
      continue;
    }
    const weekday = getWeekdayFromIsoDate(date);
    const workWindows = workingHours[weekday] ?? [];
    if (workWindows.length === 0) continue;
    if (coverage === "partial" && busy.length === 0) {
      warnings.push(`Skipped ${date} because screenshot coverage was partial with no confirmed busy times.`);
      continue;
    }
    for (const workWindow of workWindows) {
      const freeWindows = subtractBusyFromWindow(workWindow, busy);
      for (const free of freeWindows) {
        draft.push({
          date,
          start: free.start,
          end: free.end,
          overallConfidence:
            coverage === "partial"
              ? Math.min(0.6, busy.length > 0 ? Math.min(...busy.map((item) => item.overallConfidence ?? 0.6)) : 0.6)
              : busy.length > 0
                ? Math.min(...busy.map((item) => item.overallConfidence ?? 1))
                : 0.9,
          warnings: Array.from(
            new Set([
              ...busy.flatMap((item) => item.warnings ?? []),
              ...(coverage === "partial" ? ["This day was only partially parsed from the screenshot."] : []),
            ])
          ),
          parseType: coverage === "partial" ? "partial draft" : "full-week draft",
          uncertainDate: coverage === "partial",
          uncertainTime: coverage === "partial",
        });
      }
    }
  }

  return { draft, warnings: Array.from(new Set(warnings)) };
}
