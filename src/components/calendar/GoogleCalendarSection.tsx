"use client";

import { useCallback, useEffect, useState } from "react";
import { DateTime } from "luxon";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CalendarIcon } from "@/components/ui/Icons";
import type { CalendarEventItem } from "@/types/calendar";
import { resolveTimezone } from "@/lib/timezone";

interface EventsResponse {
  connected: boolean;
  events: CalendarEventItem[];
  error?: string;
}

function formatEventTime(startISO: string, endISO: string, ianaZone: string): string {
  const start = DateTime.fromISO(startISO, { setZone: true }).setZone(ianaZone);
  const end = DateTime.fromISO(endISO, { setZone: true }).setZone(ianaZone);
  if (!start.isValid || !end.isValid) return "";
  return `${start.toFormat("h:mm a")} – ${end.toFormat("h:mm a")}`;
}

function formatDayHeader(iso: string, ianaZone: string): string {
  const dt = DateTime.fromISO(iso, { setZone: true }).setZone(ianaZone);
  if (!dt.isValid) return iso;
  const today = DateTime.now().setZone(ianaZone).startOf("day");
  const dayStart = dt.startOf("day");
  if (dayStart.equals(today)) return "Today";
  if (dayStart.equals(today.plus({ days: 1 }))) return "Tomorrow";
  return dayStart.toFormat("EEE, MMM d");
}

export function GoogleCalendarSection({
  userTimeZone,
  onCalendarChange,
  derivedAvailabilityToday,
}: {
  userTimeZone: string;
  onCalendarChange?: (connected: boolean, events: CalendarEventItem[]) => void;
  /** Formatted "9:00 AM – 5:00 PM" strings for today's free gaps (user TZ). */
  derivedAvailabilityToday?: string[];
}) {
  const [data, setData] = useState<EventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/calendar/events", { credentials: "include" });
      const json = (await res.json()) as EventsResponse | { error?: string };
      if (!res.ok) {
        const msg = (json as { error?: string }).error ?? "Couldn't load calendar";
        setFetchError(msg);
        setData({ connected: false, events: [] });
        onCalendarChange?.(false, []);
        return;
      }
      const result = json as EventsResponse;
      setData(result);
      setFetchError(null);
      onCalendarChange?.(result.connected, result.events ?? []);
    } catch {
      setFetchError("Couldn't connect. Please try again.");
      setData({ connected: false, events: [] });
      onCalendarChange?.(false, []);
    } finally {
      setLoading(false);
    }
  }, [onCalendarChange]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleConnect = () => {
    window.location.href = "/api/auth/google";
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/auth/google/disconnect", {
        method: "POST",
        credentials: "include",
      });
      setData({ connected: false, events: [] });
      onCalendarChange?.(false, []);
    } finally {
      setDisconnecting(false);
    }
  };

  const zone = userTimeZone.trim() ? resolveTimezone(userTimeZone) : Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (loading) {
    return (
      <Card title="Your calendar" icon={<CalendarIcon />}>
        <div className="py-4">
          <LoadingSpinner label="Loading calendar…" />
        </div>
      </Card>
    );
  }

  if (!data?.connected) {
    return (
      <Card title="Your calendar" icon={<CalendarIcon />}>
        {fetchError && (
          <p className="text-sm text-amber-700 mb-4">{fetchError}</p>
        )}
        <p className="text-sm text-slate-600 mb-3">
          Connect your calendar to see your events and calculate availability
          for meeting scheduling.
        </p>
        <p className="text-xs text-slate-500 mb-4">
          Read-only access. SyncPrep does not edit your calendar. Used only to
          show busy times and find open slots.{" "}
          <a
            href="/privacy"
            className="text-slate-600 hover:text-slate-800 underline"
          >
            Privacy
          </a>
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleConnect} className="w-full sm:w-auto">
            Connect Google Calendar
          </Button>
          {fetchError && (
            <Button
              variant="secondary"
              onClick={fetchEvents}
              className="w-full sm:w-auto"
            >
              Retry
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const eventsByDay = data.events.reduce<Record<string, CalendarEventItem[]>>((acc, ev) => {
    const dt = DateTime.fromISO(ev.start, { setZone: true }).setZone(zone);
    const key = dt.toISODate() ?? ev.start.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});
  const sortedDays = Object.keys(eventsByDay).sort();

  return (
    <Card title="Your calendar" icon={<CalendarIcon />}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Your events are read-only. Availability is calculated from your
          calendar and working hours.
        </p>
        {sortedDays.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">
            No events in the next 14 days. Your schedule is clear.
          </p>
        ) : (
          <ul className="space-y-4">
            {sortedDays.map((dayKey) => (
              <li key={dayKey}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  {formatDayHeader(eventsByDay[dayKey][0].start, zone)}
                </p>
                <ul className="space-y-1.5">
                  {eventsByDay[dayKey].map((ev) => (
                    <li
                      key={ev.id}
                      className="flex items-start gap-2 rounded-xl border border-amber-400/60 bg-gradient-to-r from-amber-100 to-amber-200/90 px-3 py-2.5 text-sm shadow-sm"
                    >
                      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-600" aria-hidden title="Busy" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-amber-950 truncate">{ev.summary}</p>
                        <p className="text-xs text-amber-900/90 tabular-nums">
                          <span className="font-semibold">Busy</span>
                          {" · "}
                          {formatEventTime(ev.start, ev.end, zone)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
        {derivedAvailabilityToday && derivedAvailabilityToday.length > 0 && (
          <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-teal-50/80 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Available today
            </p>
            <p className="text-sm text-slate-700">
              {derivedAvailabilityToday.join(", ")}
            </p>
          </div>
        )}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-4 flex-wrap">
          <a
            href="/privacy"
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Privacy
          </a>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            {disconnecting ? "Disconnecting…" : "Disconnect calendar"}
          </button>
        </div>
      </div>
    </Card>
  );
}
