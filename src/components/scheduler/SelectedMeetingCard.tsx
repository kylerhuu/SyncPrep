"use client";

import { DateTime } from "luxon";
import { buildGoogleCalendarUrl } from "@/lib/calendar";
import { resolveTimezone } from "@/lib/timezone";
import type { OverlapSlotResult } from "@/lib/timezone";

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
  return `${start.toFormat("h:mm a")} to ${end.toFormat("h:mm a")}`;
}

function formatZoneAbbr(ianaZone: string): string {
  const dt = DateTime.now().setZone(ianaZone);
  return dt.isValid ? dt.toFormat("ZZZ") : ianaZone;
}

export function SelectedMeetingCard({
  slot,
  zoneA,
  zoneB,
  title = "Meeting",
}: SelectedMeetingCardProps) {
  const tzA = resolveTimezone(zoneA);
  const tzB = resolveTimezone(zoneB);
  const timeRangeA = formatTimeRangeInZone(slot.startISO, slot.endISO, tzA);
  const timeRangeB = formatTimeRangeInZone(slot.startISO, slot.endISO, tzB);
  const abbrA = formatZoneAbbr(tzA);
  const abbrB = formatZoneAbbr(tzB);
  const url = buildGoogleCalendarUrl(slot.startISO, slot.endISO, title);

  return (
    <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-b from-blue-50/80 to-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-200/80 bg-slate-50/90 px-5 py-3.5">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">
          Selected meeting
        </h2>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <p className="text-lg font-semibold text-slate-900 tabular-nums">
            {timeRangeA}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            <span>Your time: {abbrA}</span>
            <span>Their time: {abbrB}</span>
          </div>
          {timeRangeB !== timeRangeA && (
            <p className="mt-1 text-sm text-slate-500">
              ({timeRangeB} in their timezone)
            </p>
          )}
        </div>
        <div className="pt-1">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full sm:w-auto min-h-[44px] rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors shadow-sm"
          >
            Add to Google Calendar
          </a>
        </div>
      </div>
    </div>
  );
}
