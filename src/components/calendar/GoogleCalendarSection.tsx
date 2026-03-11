"use client";

import { useCallback, useEffect, useState } from "react";
import { DateTime } from "luxon";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CalendarIcon } from "@/components/ui/Icons";
import type { CalendarEventItem } from "@/types/calendar";
import { resolveTimezone } from "@/lib/timezone";

interface EventsResponse {
  connected: boolean;
  events: CalendarEventItem[];
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
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/events", { credentials: "include" });
      const json = (await res.json()) as EventsResponse | { error?: string };
      if (!res.ok) throw new Error((json as { error?: string }).error ?? "Failed to load");
      const result = json as EventsResponse;
      setData(result);
      onCalendarChange?.(result.connected, result.events ?? []);
    } catch (e) {
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
        <div className="flex items-center gap-3 py-2">
          <span className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" aria-hidden />
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </Card>
    );
  }

  if (!data?.connected) {
    return (
      <Card title="Your calendar" icon={<CalendarIcon />}>
        <p className="text-sm text-slate-600 mb-4">
          Connect your Google Calendar to see upcoming events alongside your availability.
        </p>
        <Button onClick={handleConnect} className="w-full sm:w-auto">
          Connect Google Calendar
        </Button>
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
          Availability is automatically calculated from your calendar and working hours.
        </p>
        {sortedDays.length === 0 ? (
          <p className="text-sm text-slate-500">No events in the next 14 days.</p>
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
                      className="flex items-start gap-2 rounded-lg border border-amber-400 bg-amber-200 px-3 py-2 text-sm"
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
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Available today
            </p>
            <p className="text-sm text-slate-700">
              {derivedAvailabilityToday.join(", ")}
            </p>
          </div>
        )}
        <div className="pt-2 border-t border-slate-200">
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
