"use client";

import { useState } from "react";
import { DateTime } from "luxon";
import { buildGoogleCalendarUrl } from "@/lib/calendar";
import { resolveTimezone, getZoneDisplayName } from "@/lib/timezone";
import type { OverlapSlotResult } from "@/lib/timezone";
import { CheckCircleIcon } from "@/components/ui/Icons";
import { CalendarIcon } from "@/components/ui/Icons";

interface SelectedMeetingCardProps {
  slot: OverlapSlotResult;
  zoneA: string;
  zoneB: string;
  title?: string;
}

function formatTimeRangeInZone(startISO: string, endISO: string, ianaZone: string): string {
  const start = DateTime.fromISO(startISO, { setZone: true }).setZone(ianaZone);
  const end = DateTime.fromISO(endISO, { setZone: true }).setZone(ianaZone);
  if (!start.isValid || !end.isValid) return "";
  return `${start.toFormat("h:mm a")} – ${end.toFormat("h:mm a")}`;
}

export function SelectedMeetingCard({
  slot,
  zoneA,
  zoneB,
  title = "Meeting",
}: SelectedMeetingCardProps) {
  const [calendarOpened, setCalendarOpened] = useState(false);
  const tzA = resolveTimezone(zoneA);
  const tzB = resolveTimezone(zoneB);
  const timeRangeA = formatTimeRangeInZone(slot.startISO, slot.endISO, tzA);
  const timeRangeB = formatTimeRangeInZone(slot.startISO, slot.endISO, tzB);
  const zoneLabelA = getZoneDisplayName(tzA);
  const zoneLabelB = getZoneDisplayName(tzB);
  const url = buildGoogleCalendarUrl(slot.startISO, slot.endISO, title);

  return (
    <div className="relative rounded-2xl border-2 border-blue-400/70 bg-white overflow-hidden shadow-[0_12px_40px_-8px_rgba(37,99,235,0.35),0_0_0_1px_rgba(37,99,235,0.12)] ring-2 ring-blue-400/40 transition-all duration-300 hover:shadow-[0_20px_50px_-10px_rgba(37,99,235,0.4)] hover:-translate-y-1">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" aria-hidden />
      <div className="border-b border-slate-200/80 bg-gradient-to-r from-blue-50 via-indigo-50/90 to-slate-50 px-5 py-4 flex items-center gap-2.5">
        <span className="[&_svg]:text-[var(--accent-blue)]" aria-hidden>
          <CheckCircleIcon />
        </span>
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">
          Selected meeting
        </h2>
      </div>
      <div className="p-5 space-y-5">
        <div className="space-y-3">
          <div>
            <p className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">
              {timeRangeA}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">Your time ({zoneLabelA})</p>
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900 tabular-nums tracking-tight">
              {timeRangeB}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">Their time ({zoneLabelB})</p>
          </div>
        </div>
        <div className="border-t border-slate-200 pt-5 space-y-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setCalendarOpened(true)}
            className="inline-flex items-center justify-center gap-2.5 w-full min-w-[240px] min-h-[48px] rounded-xl bg-gradient-to-b from-blue-600 via-blue-600 to-indigo-700 px-6 py-3.5 text-sm font-bold text-white hover:from-blue-500 hover:via-blue-500 hover:to-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 transition-all duration-300 shadow-xl shadow-blue-900/25 hover:shadow-2xl hover:shadow-blue-900/30 hover:-translate-y-1 [&_svg]:text-white [&_svg]:shrink-0"
          >
            <CalendarIcon />
            Add to Google Calendar
          </a>
          {calendarOpened && (
            <p className="text-sm text-slate-600" role="status">
              Event opened in Google Calendar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
