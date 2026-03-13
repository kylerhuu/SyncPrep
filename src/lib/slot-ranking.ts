/**
 * Ranking and recommendation for mutual meeting slots.
 * Scores slots by time-of-day preference, recency, and edge-of-day penalties
 * so the best options surface first. Kept simple and extensible.
 */

import { DateTime } from "luxon";
import type { OverlapSlotResult } from "@/lib/timezone";
import { resolveTimezone } from "@/lib/timezone";

export interface RankedSlot {
  slot: OverlapSlotResult;
  score: number;
  /** Human-readable label for UI: "Best match", "Good option", or null. */
  recommendation: string | null;
}

/** Minimum score to show "Best match" (avoid overclaiming on poor slots). */
const BEST_MATCH_MIN_SCORE = 45;
/** Minimum score to show "Good option". */
const GOOD_OPTION_MIN_SCORE = 35;
/** Max number of slots to label "Good option" (after the one "Best match"). */
const GOOD_OPTION_MAX_COUNT = 4;

/**
 * Score a single meeting slot from 0–100 based on practical scheduling heuristics.
 * Higher = better. Uses user's timezone (zoneA) for time-of-day and refDate for recency.
 *
 * Weights:
 * - Time of day (65%): Prefer mid-morning (9–11) and mid-afternoon (14–16). Penalize
 *   very early (<8) and late (>17) so we don't surface awkward edge times.
 * - Recency (35%): Prefer sooner (today > tomorrow > later) so users see actionable
 *   options first when all else is equal.
 * - Edge penalty: Small deduction for slots that start exactly on a common boundary
 *   (e.g. 9:00, 17:00) or end right at end-of-day, so we slightly prefer slots
 *   that sit comfortably inside the day rather than squeezed at the edges.
 *
 * Extensible: can later add weights for duration fit, buffer time, or user preferences.
 */
export function scoreMeetingSlot(
  slot: OverlapSlotResult,
  zoneA: string,
  refDate: DateTime
): number {
  const tz = resolveTimezone(zoneA);
  const start = DateTime.fromISO(slot.startISO, { setZone: true }).setZone(tz);
  const end = DateTime.fromISO(slot.endISO, { setZone: true }).setZone(tz);
  if (!start.isValid || !end.isValid) return 0;

  const todayStart = refDate.setZone(tz).startOf("day");
  const slotDayStart = start.startOf("day");
  const daysFromToday = Math.round(
    (slotDayStart.valueOf() - todayStart.valueOf()) / (24 * 60 * 60 * 1000)
  );

  const hour = start.hour + start.minute / 60;

  // Time-of-day score: ideal 9–11 and 14–16. Piecewise linear.
  let timeScore: number;
  if (hour >= 9 && hour < 12) {
    timeScore = 95 + (10 - Math.abs(hour - 10)) * 0.5; // peak around 10
  } else if (hour >= 14 && hour < 17) {
    timeScore = 95 + (10 - Math.abs(hour - 15)) * 0.5; // peak around 15
  } else if (hour >= 8 && hour < 9) {
    timeScore = 70 + (hour - 8) * 25;
  } else if (hour >= 12 && hour < 14) {
    timeScore = 85;
  } else if (hour >= 17 && hour < 18) {
    timeScore = 75 - (hour - 17) * 25;
  } else if (hour >= 7 && hour < 8) {
    timeScore = 50 + (hour - 7) * 20;
  } else if (hour >= 18 && hour < 19) {
    timeScore = 50 - (hour - 18) * 20;
  } else if (hour < 7) {
    timeScore = Math.max(0, 40 - (7 - hour) * 10);
  } else {
    timeScore = Math.max(0, 40 - (hour - 19) * 10);
  }
  timeScore = Math.round(Math.min(100, Math.max(0, timeScore)));

  // Recency score: today best, then decay by day.
  const recencyScore =
    daysFromToday <= 0
      ? 100
      : daysFromToday === 1
        ? 88
        : Math.max(30, 100 - daysFromToday * 12);
  const recencyNorm = Math.min(100, Math.max(0, recencyScore));

  // Edge penalty: slot starts on the hour at common boundaries, or ends at 17:00
  let edgePenalty = 0;
  if (start.minute === 0 && (start.hour === 8 || start.hour === 9 || start.hour === 17)) {
    edgePenalty += 4;
  }
  if (end.hour === 17 && end.minute === 0) {
    edgePenalty += 3;
  }

  const combined = 0.65 * timeScore + 0.35 * recencyNorm - edgePenalty;
  return Math.round(Math.min(100, Math.max(0, combined)));
}

/**
 * Rank mutual slots by score and assign recommendation labels.
 * Returns slots sorted by score descending; assigns "Best match" to the top slot
 * (if score >= threshold), "Good option" to the next few, and null for the rest
 * so we don't overclaim when all slots are poor or there's only one.
 */
export function rankMutualSlots(
  slots: OverlapSlotResult[],
  zoneA: string,
  refDate: DateTime
): RankedSlot[] {
  if (slots.length === 0) return [];

  const withScores: RankedSlot[] = slots.map((slot) => ({
    slot,
    score: scoreMeetingSlot(slot, zoneA, refDate),
    recommendation: null,
  }));

  withScores.sort((a, b) => b.score - a.score);

  let goodOptionCount = 0;
  for (let i = 0; i < withScores.length; i++) {
    const r = withScores[i];
    if (i === 0 && r.score >= BEST_MATCH_MIN_SCORE) {
      r.recommendation = "Best match";
    } else if (
      goodOptionCount < GOOD_OPTION_MAX_COUNT &&
      r.score >= GOOD_OPTION_MIN_SCORE
    ) {
      r.recommendation = "Good option";
      goodOptionCount++;
    }
  }

  return withScores;
}

/** Slots that have a recommendation label (for "Recommended times" section). */
export function getRecommendedSlots(ranked: RankedSlot[]): RankedSlot[] {
  return ranked.filter((r) => r.recommendation !== null);
}
