"use client";

import { useState } from "react";
import { DateTime } from "luxon";
import { buildGoogleCalendarUrl } from "@/lib/calendar";
import { resolveTimezone } from "@/lib/timezone";
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

/** IANA zone to human-readable name when Luxon returns an offset like +0000. */
const ZONE_FRIENDLY_NAMES: Record<string, string> = {
  UTC: "UTC",
  "America/New_York": "Eastern",
  "America/Los_Angeles": "Pacific",
  "America/Chicago": "Central",
  "America/Denver": "Mountain",
  "Europe/London": "GMT/BST",
  "Europe/Paris": "Central European",
  "Asia/Tokyo": "Japan",
  "Asia/Kolkata": "India",
  "Australia/Sydney": "Australia Eastern",
};

function formatZoneDisplayName(ianaZone: string): string {
  const friendly = ZONE_FRIENDLY_NAMES[ianaZone];
  if (friendly) return friendly;
  const dt = DateTime.now().setZone(ianaZone);
  if (!dt.isValid) return ianaZone;
  const abbr = dt.toFormat("ZZZ");
  if (/[+-]\d{2}:?\d{2}/.test(abbr) || /^UTC/.test(abbr)) {
    const region = ianaZone.split("/").pop()?.replace(/_/g, " ") ?? ianaZone;
    return region;
  }
  return abbr;
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
  const zoneLabelA = formatZoneDisplayName(tzA);
  const zoneLabelB = formatZoneDisplayName(tzB);
  const url = buildGoogleCalendarUrl(slot.startISO, slot.endISO, title);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden ring-1 ring-blue-100/80 border-blue-200/60">
      <div className="border-b border-slate-200/80 bg-slate-50/95 px-5 py-4 flex items-center gap-2.5">
        <span className="[&_svg]:text-blue-600" aria-hidden>
          <CheckCircleIcon />
        </span>
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">
          Selected meeting
        </h2>
      </div>
      <div className="p-5 space-y-5">
        <div className="space-y-3">
          <div>
            <p className="text-lg font-semibold text-slate-900 tabular-nums tracking-tight">
              {timeRangeA}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">{zoneLabelA} Time</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900 tabular-nums tracking-tight">
              {timeRangeB}
            </p>
            <p className="text-sm text-slate-500 mt-0.5">{zoneLabelB} Time</p>
          </div>
        </div>
        <div className="border-t border-slate-200 pt-5 space-y-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setCalendarOpened(true)}
            className="inline-flex items-center justify-center gap-2.5 w-full min-w-[240px] min-h-[44px] rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all shadow-sm hover:shadow [&_svg]:text-white [&_svg]:shrink-0"
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
