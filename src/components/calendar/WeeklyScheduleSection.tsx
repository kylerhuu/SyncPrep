"use client";

import Link from "next/link";
import { DateTime } from "luxon";
import { WeekViewTimeline, type WeekViewBlock } from "@/components/calendar/WeekViewTimeline";
import { resolveTimezone } from "@/lib/timezone";
import type { TimeWindow } from "@/types";
import type { CalendarEventItem } from "@/types/calendar";
import type { OverlapSlotResult } from "@/lib/timezone";

const START_HOUR = 6;
const END_HOUR = 20;
const WEEKDAYS = 5;

interface WeeklyScheduleSectionProps {
  userTimeZone: string;
  workingHours: TimeWindow;
  events: CalendarEventItem[];
  connected: boolean;
  selectedSlot: OverlapSlotResult | null;
  compact?: boolean;
}

function getWeekStart(refDate: DateTime, iana: string): DateTime {
  const inZone = refDate.setZone(iana);
  return inZone.minus({ days: inZone.weekday - 1 }).startOf("day");
}

export function WeeklyScheduleSection({
  userTimeZone,
  workingHours,
  events,
  connected,
  selectedSlot,
  compact = false,
}: WeeklyScheduleSectionProps) {
  const iana = userTimeZone.trim()
    ? resolveTimezone(userTimeZone)
    : Intl.DateTimeFormat().resolvedOptions().timeZone;
  const refDate = DateTime.now();
  const weekStart = getWeekStart(refDate, iana);

  const dayLabels = Array.from({ length: WEEKDAYS }, (_, i) => {
    const d = weekStart.plus({ days: i });
    const today = refDate.setZone(iana).startOf("day");
    if (d.equals(today)) return "Today";
    return d.toFormat("EEE");
  });

  const daySublabels = Array.from({ length: WEEKDAYS }, (_, i) =>
    weekStart.plus({ days: i }).toFormat("d")
  );

  const weekLabel = `${weekStart.toFormat("MMM d")} – ${weekStart.plus({ days: 4 }).toFormat("MMM d")}`;

  const blocks: WeekViewBlock[] = [];

  for (let dayIndex = 0; dayIndex < WEEKDAYS; dayIndex++) {
    const dayStart = weekStart.plus({ days: dayIndex });
    const dayEnd = dayStart.plus({ days: 1 });

    events.forEach((ev) => {
      const evStart = DateTime.fromISO(ev.start, { setZone: true }).setZone(iana);
      const evEnd = DateTime.fromISO(ev.end, { setZone: true }).setZone(iana);
      if (evEnd <= dayStart || evStart >= dayEnd) return;
      const clipStart = DateTime.max(evStart, dayStart);
      const clipEnd = DateTime.min(evEnd, dayEnd);
      blocks.push({
        dayIndex,
        startISO: clipStart.toISO()!,
        endISO: clipEnd.toISO()!,
        type: "busy",
        label: ev.summary,
      });
    });

  }

  if (selectedSlot) {
    const start = DateTime.fromISO(selectedSlot.startISO, { setZone: true }).setZone(iana);
    const dayStart = start.startOf("day");
    const diff = dayStart.diff(weekStart, "days").days;
    if (diff >= 0 && diff < WEEKDAYS) {
      blocks.push({
        dayIndex: Math.floor(diff),
        startISO: selectedSlot.startISO,
        endISO: selectedSlot.endISO,
        type: "selected",
        label: "Selected",
      });
    }
  }

  return (
    <section aria-label="Weekly schedule" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Weekly schedule
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Your week at a glance—busy blocks and open gaps.
          </p>
        </div>
        <Link
          href="/calendar"
          className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline shrink-0 transition-colors"
        >
          Full schedule →
        </Link>
      </div>
      {!userTimeZone.trim() ? (
        <div className="rounded-2xl border-2 border-slate-200 bg-surface-elevated px-5 py-8 text-center">
          <p className="text-sm text-slate-600">
            Set your time zone above to see your week.
          </p>
        </div>
      ) : (
        <>
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
          <div className="flex flex-wrap gap-6 text-xs text-slate-600 bg-surface-elevated rounded-xl px-5 py-3.5 border border-slate-200/80 shadow-sm">
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-lg bg-gradient-to-br from-amber-300 to-amber-400 border border-amber-500/50 shrink-0 shadow-sm" />
              <span className="font-semibold text-slate-700">Busy</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-lg bg-gradient-to-br from-[#e66d0f] to-[#ff8c2a] shrink-0 shadow-sm ring-1 ring-[#ff7a18]/50" />
              <span className="font-semibold text-slate-700">Selected</span>
            </span>
          </div>
        </>
      )}
    </section>
  );
}
