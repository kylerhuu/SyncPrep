"use client";

import { useMemo } from "react";
import { DateTime } from "luxon";
import { WeekViewTimeline, type WeekViewBlock } from "@/components/calendar/WeekViewTimeline";
import { resolveTimezone } from "@/lib/timezone";
import type { WeeklyPattern, OtherPersonWindow } from "@/types";

const START_HOUR = 6;
const END_HOUR = 20;
const WEEKDAYS = 5;
const WEEKDAY_KEYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

interface TheirAvailabilityPreviewProps {
  zoneB: string;
  weeklyPattern: WeeklyPattern;
  windows: OtherPersonWindow[];
}

export function TheirAvailabilityPreview({
  zoneB,
  weeklyPattern,
  windows,
}: TheirAvailabilityPreviewProps) {
  const iana = resolveTimezone(zoneB.trim() ? zoneB : Intl.DateTimeFormat().resolvedOptions().timeZone);
  const refDate = DateTime.now().setZone(iana);
  const weekStart = refDate.minus({ days: refDate.weekday - 1 }).startOf("day");

  const { dayLabels, daySublabels, weekLabel, blocks } = useMemo(() => {
    const dayLabels = WEEKDAY_KEYS.map((_, i) => {
      const d = weekStart.plus({ days: i });
      const today = refDate.startOf("day");
      if (d.equals(today)) return "Today";
      return d.toFormat("EEE");
    });
    const daySublabels = WEEKDAY_KEYS.map((_, i) =>
      weekStart.plus({ days: i }).toFormat("d")
    );
    const weekLabel = `${weekStart.toFormat("MMM d")} – ${weekStart.plus({ days: 4 }).toFormat("MMM d")}`;

    const blocks: WeekViewBlock[] = [];
    const dateKeysThisWeek = new Set(
      Array.from({ length: 5 }, (_, i) => weekStart.plus({ days: i }).toFormat("yyyy-MM-dd"))
    );

    const hasWeekly = WEEKDAY_KEYS.some((day) => {
      const w = weeklyPattern[day];
      return Array.isArray(w) && w.length > 0;
    });
    const hasWindows = windows.some((w) => w.date && dateKeysThisWeek.has(w.date));

    if (hasWeekly) {
      for (let dayIndex = 0; dayIndex < WEEKDAYS; dayIndex++) {
        const dayStart = weekStart.plus({ days: dayIndex });
        const dayName = WEEKDAY_KEYS[dayIndex];
        const dayWindows = weeklyPattern[dayName] ?? [];
        for (const tw of dayWindows) {
          const [sh, sm] = tw.start.split(":").map(Number);
          const [eh, em] = tw.end.split(":").map(Number);
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
          blocks.push({
            dayIndex,
            startISO: start.toISO()!,
            endISO: end.toISO()!,
            type: "free",
            label: "Available",
          });
        }
      }
    }

    if (hasWindows) {
      for (const w of windows) {
        if (!w.date || !dateKeysThisWeek.has(w.date)) continue;
        const dayStart = DateTime.fromISO(w.date, { zone: iana }).startOf("day");
        const diff = dayStart.diff(weekStart, "days").days;
        const dayIndex = Math.round(diff);
        if (dayIndex < 0 || dayIndex >= WEEKDAYS) continue;
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
        blocks.push({
          dayIndex,
          startISO: start.toISO()!,
          endISO: end.toISO()!,
          type: "free",
          label: "Available",
        });
      }
    }

    return { dayLabels, daySublabels, weekLabel, blocks };
  }, [weekStart, refDate, weeklyPattern, windows, iana]);

  const hasAny = blocks.length > 0;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-800 tracking-tight">
        Their week at a glance
      </p>
      {hasAny ? (
        <WeekViewTimeline
          weekLabel={weekLabel}
          dayLabels={dayLabels}
          daySublabels={daySublabels}
          startHour={START_HOUR}
          endHour={END_HOUR}
          blocks={blocks}
          zone={iana}
          compact={true}
        />
      ) : (
        <p className="text-xs text-slate-500 py-4">
          Add weekly pattern or specific dates to see their availability.
        </p>
      )}
    </div>
  );
}
