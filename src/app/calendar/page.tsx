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
import { ArrowRight } from "lucide-react";

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
      <div className="page-dark min-h-screen flex flex-col">
        <div className="page-grid" aria-hidden />
        <div className="page-content flex flex-col flex-1">
          <AppNav />
          <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-8">
            <div className="py-12">
              <LoadingSpinner label="Loading calendar..." size="md" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="page-dark min-h-screen flex flex-col">
      <div className="page-grid" aria-hidden />
      <div className="page-content flex flex-col flex-1">
        <AppNav />

        <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">
              Weekly schedule
            </h1>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              Your week at a glance—busy blocks and open availability.
            </p>
          </div>

          {!connected ? (
            <div className="section-card px-6 py-10 text-center">
              <p className="text-sm text-[var(--foreground-muted)] mb-5">
                Connect Google Calendar on the Schedule page to see your week here.
              </p>
              <Link
                href="/schedule"
                className="btn-primary inline-flex items-center gap-2"
              >
                Go to Schedule
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : !zone.trim() ? (
            <div className="section-card px-6 py-10 text-center">
              <p className="text-sm text-[var(--foreground-muted)]">
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
              <div className="mt-6 flex flex-wrap gap-6 text-xs text-[var(--foreground-muted)] rounded-xl px-5 py-3.5 border border-[var(--border)] bg-[var(--background-card)] max-w-md">
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-amber-500/60 border border-amber-500/80 shrink-0" />
                  <span className="font-medium text-[var(--foreground)]">Busy</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-green-500/60 border border-green-500/80 shrink-0" />
                  <span className="font-medium text-[var(--foreground)]">Available</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-[var(--accent)] shrink-0" />
                  <span className="font-medium text-[var(--foreground)]">Selected</span>
                </span>
              </div>
            </>
          )}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
