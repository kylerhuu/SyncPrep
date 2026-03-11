"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import { WeekViewTimeline, type WeekViewBlock } from "@/components/calendar/WeekViewTimeline";
import { workingHoursMinusBusy, resolveTimezone } from "@/lib/timezone";
import type { TimeWindow } from "@/types";
import type { CalendarEventItem } from "@/types/calendar";
import type { OverlapSlotResult } from "@/lib/timezone";
import { AppNav } from "@/components/nav/AppNav";
import { AppFooter } from "@/components/nav/AppFooter";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const STORAGE_KEYS = {
  zoneA: "syncprep_zoneA",
  workingHoursA: "syncprep_workingHoursA",
  selectedSlot: "syncprep_selectedSlot",
};

const defaultWindow: TimeWindow = { start: "09:00", end: "17:00" };
const START_HOUR = 6;
const END_HOUR = 22;
const WEEKDAYS = 5;

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const s = sessionStorage.getItem(key);
    if (s == null) return fallback;
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

interface EventsResponse {
  connected: boolean;
  events: CalendarEventItem[];
}

function getWeekStart(refDate: DateTime, iana: string): DateTime {
  const inZone = refDate.setZone(iana);
  return inZone.minus({ days: inZone.weekday - 1 }).startOf("day");
}

export default function CalendarPage() {
  const [zone, setZone] = useState("");
  const [workingHours, setWorkingHours] = useState<TimeWindow>(defaultWindow);
  const [selectedSlot, setSelectedSlot] = useState<OverlapSlotResult | null>(null);
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/events", { credentials: "include" });
      const json = (await res.json()) as EventsResponse | { error?: string };
      if (!res.ok) throw new Error((json as { error?: string }).error ?? "Failed to load");
      const result = json as EventsResponse;
      setEvents(result.events ?? []);
      setConnected(result.connected);
    } catch {
      setEvents([]);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setZone(loadJson(STORAGE_KEYS.zoneA, ""));
    const loaded = loadJson<TimeWindow>(STORAGE_KEYS.workingHoursA, defaultWindow);
    setWorkingHours(
      loaded && typeof loaded === "object" && "start" in loaded && "end" in loaded
        ? loaded
        : defaultWindow
    );
    const saved = loadJson<unknown>(STORAGE_KEYS.selectedSlot, null);
    if (
      saved &&
      typeof saved === "object" &&
      "startISO" in saved &&
      typeof (saved as OverlapSlotResult).startISO === "string"
    ) {
      setSelectedSlot(saved as OverlapSlotResult);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const refDate = useMemo(() => DateTime.now(), []);
  const iana = useMemo(
    () =>
      zone.trim()
        ? resolveTimezone(zone)
        : Intl.DateTimeFormat().resolvedOptions().timeZone,
    [zone]
  );
  const weekStart = useMemo(() => getWeekStart(refDate, iana), [refDate, iana]);

  const dayLabels = useMemo(
    () =>
      Array.from({ length: WEEKDAYS }, (_, i) => {
        const d = weekStart.plus({ days: i });
        const today = refDate.setZone(iana).startOf("day");
        if (d.equals(today)) return "Today";
        return d.toFormat("EEE");
      }),
    [weekStart, refDate, iana]
  );

  const weekLabel = useMemo(
    () =>
      `${weekStart.toFormat("MMM d")} – ${weekStart.plus({ days: 4 }).toFormat("MMM d")}`,
    [weekStart]
  );

  const daySublabels = useMemo(
    () => Array.from({ length: WEEKDAYS }, (_, i) => weekStart.plus({ days: i }).toFormat("d")),
    [weekStart]
  );

  const blocks = useMemo((): WeekViewBlock[] => {
    const list: WeekViewBlock[] = [];

    for (let dayIndex = 0; dayIndex < WEEKDAYS; dayIndex++) {
      const dayStart = weekStart.plus({ days: dayIndex });
      const dayEnd = dayStart.plus({ days: 1 });

      events.forEach((ev) => {
        const evStart = DateTime.fromISO(ev.start, { setZone: true }).setZone(iana);
        const evEnd = DateTime.fromISO(ev.end, { setZone: true }).setZone(iana);
        if (evEnd <= dayStart || evStart >= dayEnd) return;
        const clipStart = DateTime.max(evStart, dayStart);
        const clipEnd = DateTime.min(evEnd, dayEnd);
        list.push({
          dayIndex,
          startISO: clipStart.toISO()!,
          endISO: clipEnd.toISO()!,
          type: "busy",
          label: ev.summary,
        });
      });

      const freeGaps = workingHoursMinusBusy(
        iana,
        [workingHours],
        events.map((e) => ({ start: e.start, end: e.end })),
        dayStart
      );
      freeGaps.forEach((g) => {
        list.push({
          dayIndex,
          startISO: g.startISO,
          endISO: g.endISO,
          type: "free",
          label: "Available",
        });
      });
    }

    if (selectedSlot) {
      const start = DateTime.fromISO(selectedSlot.startISO, { setZone: true }).setZone(iana);
      const dayStart = start.startOf("day");
      const diff = dayStart.diff(weekStart, "days").days;
      if (diff >= 0 && diff < WEEKDAYS) {
        list.push({
          dayIndex: Math.floor(diff),
          startISO: selectedSlot.startISO,
          endISO: selectedSlot.endISO,
          type: "selected",
          label: "Selected meeting",
        });
      }
    }

    return list;
  }, [events, workingHours, iana, weekStart, selectedSlot]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--background)]">
        <AppNav />
        <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-8">
          <div className="py-12">
            <LoadingSpinner label="Loading calendar…" size="md" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AppNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Weekly schedule
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Your week at a glance—busy blocks and open gaps.
          </p>
        </div>

        {!connected ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-5 py-8 text-center">
            <p className="text-sm text-slate-600 mb-4">
              Connect Google Calendar on the Schedule page to see your week here.
            </p>
            <Link
              href="/schedule"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2.5 hover:bg-slate-800"
            >
              Go to Schedule
            </Link>
          </div>
        ) : !zone.trim() ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-8 text-center">
            <p className="text-sm text-slate-600">
              Set your time zone on Schedule to see your week.
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
            />
            <div className="mt-6 flex flex-wrap gap-5 text-xs text-slate-600 bg-slate-50/80 rounded-xl px-4 py-3 border border-slate-200/80 max-w-md">
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-md border border-amber-600 bg-amber-300 shrink-0" />
                <span className="font-medium text-slate-700">Busy</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-md border border-emerald-600 bg-emerald-300 shrink-0" />
                <span className="font-medium text-slate-700">Available</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-md border-2 border-blue-700 bg-blue-500 shrink-0" />
                <span className="font-medium text-slate-700">Selected meeting</span>
              </span>
            </div>
          </>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
