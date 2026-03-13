/**
 * Normalization layer for screenshot-parser model output.
 * Maps alternate key shapes (startTime/endTime, from/to, dateLabel, 12h/24h, etc.)
 * into a single internal shape { date, start, end } so we don't drop entries aggressively.
 */

export interface NormalizedWindow {
  date: string;
  start: string;
  end: string;
}

export interface NormalizeResult {
  draft: NormalizedWindow[];
  stats: {
    totalParsed: number;
    normalized: number;
    skipped: number;
  };
}

/** Keys we accept for date (first match wins). Case-insensitive. */
const DATE_KEYS = ["date", "dateLabel", "day", "dayLabel"];

/** Keys we accept for start time (first match wins). */
const START_KEYS = ["start", "startTime", "from", "begin"];

/** Keys we accept for end time (first match wins). */
const END_KEYS = ["end", "endTime", "to", "until"];

function getString(obj: unknown, keys: string[]): string | undefined {
  if (obj == null || typeof obj !== "object") return undefined;
  const o = obj as Record<string, unknown>;
  for (const key of keys) {
    for (const k of Object.keys(o)) {
      if (k.toLowerCase() === key.toLowerCase()) {
        const v = o[k];
        if (typeof v === "string" && v.trim()) return v.trim();
        if (typeof v === "number" && !Number.isNaN(v)) return String(v);
        break;
      }
    }
  }
  return undefined;
}

/** Normalize time to HH:mm 24h. Handles 9am, 5:30 pm, 09:00, 17:00, minor caps. */
export function normalizeTime(s: string): string {
  const t = (s ?? "").trim();
  const match = t.match(/^(\d{1,2}):(\d{2})$/i);
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

/** Normalize date to yyyy-MM-dd. Handles 2025-3-14, 3/14/2025. */
export function normalizeDate(d: string): string {
  const s = (d ?? "").trim();
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const y = iso[1];
    const m = String(parseInt(iso[2], 10)).padStart(2, "0");
    const day = String(parseInt(iso[3], 10)).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    const m = String(parseInt(us[1], 10)).padStart(2, "0");
    const day = String(parseInt(us[2], 10)).padStart(2, "0");
    return `${us[3]}-${m}-${day}`;
  }
  return s;
}

/**
 * Try to extract one normalized window from a raw model entry.
 * Supports date/dateLabel/day, start/startTime/from, end/endTime/to.
 * Returns null if we cannot confidently produce a valid window.
 */
export function normalizeModelWindow(raw: unknown): NormalizedWindow | null {
  if (raw == null || typeof raw !== "object") return null;
  const dateRaw = getString(raw, DATE_KEYS);
  const startRaw = getString(raw, START_KEYS);
  const endRaw = getString(raw, END_KEYS);
  if (dateRaw == null || startRaw == null || endRaw == null) return null;
  const dateLabelLower = dateRaw.toLowerCase();
  if (
    dateLabelLower.includes("today") ||
    dateLabelLower.includes("tomorrow") ||
    dateLabelLower.includes("tonight") ||
    dateLabelLower.includes("next ") ||
    dateLabelLower.includes("this ") ||
    dateLabelLower.includes("week")
  ) {
    return null;
  }
  const date = normalizeDate(dateRaw);
  const start = normalizeTime(startRaw);
  const end = normalizeTime(endRaw);
  if (start.length !== 5 || end.length !== 5 || start >= end) return null;
  if (!date || date.length < 2) return null;
  return { date, start, end };
}

/**
 * Normalize an array of raw model windows into a single format and track stats.
 */
export function normalizeModelWindows(rawWindows: unknown[]): NormalizeResult {
  const draft: NormalizedWindow[] = [];
  let skipped = 0;
  for (const raw of rawWindows) {
    const w = normalizeModelWindow(raw);
    if (w) draft.push(w);
    else skipped++;
  }
  return {
    draft,
    stats: {
      totalParsed: rawWindows.length,
      normalized: draft.length,
      skipped,
    },
  };
}
