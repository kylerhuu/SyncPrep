import { DateTime } from "luxon";

/**
 * Normalize screenshot-parsed draft windows into the same shape as manual availability.
 * Maps day names or date strings to the app's 7-day schedule dates and assigns ids.
 */

import type { OtherPersonWindow } from "@/types";

export interface ScheduleDayOption {
  date: string;
  label: string;
}

export interface ParsedDraftWindow {
  date: string;
  start: string;
  end: string;
}

function nextId(): string {
  return `win-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Normalize time to HH:mm 24h. Matches API behavior so draft times always work in overlap and time inputs. */
function normalizeTime(s: string): string {
  const t = (s ?? "").trim();
  const match = t.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const h = Math.min(23, Math.max(0, parseInt(match[1], 10)));
    const m = Math.min(59, Math.max(0, parseInt(match[2], 10)));
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const dot = t.match(/^(\d{1,2})\.(\d{2})$/);
  if (dot) {
    const h = Math.min(23, Math.max(0, parseInt(dot[1], 10)));
    const m = Math.min(59, Math.max(0, parseInt(dot[2], 10)));
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const twelve = t.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (twelve) {
    let h = parseInt(twelve[1], 10);
    const m = Math.min(59, Math.max(0, parseInt(twelve[2], 10)));
    const pm = (twelve[3] || "").toLowerCase() === "pm";
    if (pm && h < 12) h += 12;
    if (!pm && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const ampm = t.match(/^(\d{1,2})\s*(am|pm)$/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const pm = ampm[2].toLowerCase() === "pm";
    if (pm && h < 12) h += 12;
    if (!pm && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:00`;
  }
  return t;
}

/** Normalize date string to yyyy-MM-dd for exact match against schedule. */
function normalizeDateString(d: string): string {
  const s = (d ?? "").trim();
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return `${iso[1]}-${String(parseInt(iso[2], 10)).padStart(2, "0")}-${String(parseInt(iso[3], 10)).padStart(2, "0")}`;
  }
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    return `${us[3]}-${String(parseInt(us[1], 10)).padStart(2, "0")}-${String(parseInt(us[2], 10)).padStart(2, "0")}`;
  }
  return s;
}

/**
 * Resolve a draft date to a schedule date key. Supports:
 * - yyyy-MM-dd (exact or normalized)
 * - Today, Tomorrow
 * - Friday, This Friday, Next Friday (the matching day in the 7-day window)
 * - This Monday, This weekend (first Sat/Sun in window)
 * Returns the schedule date if resolved confidently, or null if out of range / ambiguous.
 */
function resolveDraftDate(
  draftDate: string,
  scheduleDays: ScheduleDayOption[]
): string | null {
  if (scheduleDays.length === 0) return null;

  const normalized = normalizeDateString(draftDate);
  const exact = scheduleDays.find((d) => d.date === normalized);
  if (exact) return exact.date;

  // If normalized looks like a full ISO date, try mapping by weekday
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const dt = DateTime.fromISO(normalized, { zone: "utc" });
    if (dt.isValid) {
      const weekday = dt.weekday; // 1 = Monday ... 7 = Sunday
      const byWeekday = scheduleDays.find((d) => {
        const sd = DateTime.fromISO(d.date, { zone: "utc" });
        return sd.isValid && sd.weekday === weekday;
      });
      if (byWeekday) return byWeekday.date;
    }
    // If we can't map by weekday, treat as unresolved rather than forcing today.
    return null;
  }

  const lower = draftDate.trim().toLowerCase();
  if (lower === "today") return scheduleDays[0]?.date ?? null;
  if (lower === "tomorrow") return scheduleDays[1]?.date ?? null;

  const matchDayName = (label: string): ScheduleDayOption | undefined => {
    const lab = label.toLowerCase();
    return scheduleDays.find((d) => {
      const dlab = d.label.toLowerCase();
      return dlab.startsWith("mon") && (lab.includes("mon") || lab === "monday") ||
        dlab.startsWith("tue") && (lab.includes("tue") || lab.includes("tues")) ||
        dlab.startsWith("wed") && (lab.includes("wed")) ||
        dlab.startsWith("thu") && (lab.includes("thu") || lab.includes("thur")) ||
        dlab.startsWith("fri") && (lab.includes("fri")) ||
        dlab.startsWith("sat") && (lab.includes("sat")) ||
        dlab.startsWith("sun") && (lab.includes("sun"));
    });
  };

  if (lower.includes("weekend")) {
    const sat = scheduleDays.find((d) => d.label.toLowerCase().startsWith("sat"));
    const sun = scheduleDays.find((d) => d.label.toLowerCase().startsWith("sun"));
    return (sat ?? sun)?.date ?? null;
  }
  if (lower.includes("next week")) return null;

  const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  for (const day of dayNames) {
    if (lower.includes(day) || lower === day.slice(0, 3)) {
      const m = matchDayName(day);
      return m?.date ?? null;
    }
  }

  const short = lower.slice(0, 3);
  const byShort = scheduleDays.find(
    (d) => d.label.toLowerCase().startsWith(short) || d.label.toLowerCase().includes(lower)
  );
  return byShort?.date ?? null;
}

export interface NormalizeDraftStats {
  inRange: number;
  skipped: number;
  outOfRange: number;
}

/**
 * Convert API draft windows into OtherPersonWindow[] with ids and schedule-aligned dates.
 * Tracks how many were in range, skipped (invalid time), or out of range (unresolvable date).
 */
export function normalizeDraftToWindows(
  draft: ParsedDraftWindow[],
  scheduleDays: ScheduleDayOption[]
): { windows: OtherPersonWindow[]; stats: NormalizeDraftStats } {
  const scheduleDates = new Set(scheduleDays.map((d) => d.date));
  const windows: OtherPersonWindow[] = [];
  const stats: NormalizeDraftStats = { inRange: 0, skipped: 0, outOfRange: 0 };

  for (const w of draft) {
    const start = normalizeTime(w.start);
    const end = normalizeTime(w.end);
    if (!start || !end || start >= end || start.length !== 5 || end.length !== 5) {
      stats.skipped++;
      continue;
    }
    const date = resolveDraftDate(w.date, scheduleDays);
    if (date == null || !scheduleDates.has(date)) {
      stats.outOfRange++;
      continue;
    }
    windows.push({
      id: nextId(),
      date,
      start,
      end,
    });
    stats.inRange++;
  }

  return { windows, stats };
}
