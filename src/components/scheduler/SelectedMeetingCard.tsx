"use client";

import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { buildGoogleCalendarUrl } from "@/lib/calendar";
import { resolveTimezone, getZoneDisplayName } from "@/lib/timezone";
import type { OverlapSlotResult } from "@/lib/timezone";
import { CheckCircleIcon, CalendarIcon } from "@/components/ui/Icons";

interface SelectedMeetingCardProps {
  slot: OverlapSlotResult;
  zoneA: string;
  zoneB?: string;
  title?: string;
  /** When true, show only user's time (single-user scheduling). */
  singleUser?: boolean;
}

function formatTimeRangeInZone(
  startISO: string,
  endISO: string,
  ianaZone: string
): string {
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
  singleUser = false,
}: SelectedMeetingCardProps) {
  const tzA = resolveTimezone(zoneA);
  const tzB = zoneB ? resolveTimezone(zoneB) : tzA;
  const timeRangeA = formatTimeRangeInZone(slot.startISO, slot.endISO, tzA);
  const timeRangeB = formatTimeRangeInZone(slot.startISO, slot.endISO, tzB);
  const zoneLabelA = getZoneDisplayName(tzA);
  const zoneLabelB = getZoneDisplayName(tzB);
  const calendarUrl = buildGoogleCalendarUrl(slot.startISO, slot.endISO, title);

  const slotDurationMinutes = useMemo(() => {
    const start = DateTime.fromISO(slot.startISO, { setZone: true });
    const end = DateTime.fromISO(slot.endISO, { setZone: true });
    if (!start.isValid || !end.isValid) return 30;
    return end.diff(start, "minutes").minutes;
  }, [slot.startISO, slot.endISO]);

  const durationOptions = useMemo(() => {
    const base = [30, 45, 60];
    return base.filter((m) => m <= slotDurationMinutes + 0.5);
  }, [slotDurationMinutes]);

  const [meetingTitle, setMeetingTitle] = useState(title);
  const [description, setDescription] = useState("");
  const [attendeesText, setAttendeesText] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(
    durationOptions[0] ?? 30
  );
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [eventLink, setEventLink] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const meetingDateLabel = useMemo(() => {
    const start = DateTime.fromISO(slot.startISO, { setZone: true }).setZone(tzA);
    if (!start.isValid) return "";
    return start.toFormat("EEE, MMM d");
  }, [slot.startISO, tzA]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setEventLink(null);

    const rawEmails = attendeesText
      .split(/[,\\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (rawEmails.some((email) => !emailRegex.test(email))) {
      setErrorMessage("One or more attendee emails look invalid.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/calendar/create-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotStartISO: slot.startISO,
          slotEndISO: slot.endISO,
          zoneA,
          title: meetingTitle || "Meeting",
          description: description || undefined,
          attendees: rawEmails.length > 0 ? rawEmails : undefined,
          durationMinutes,
        }),
      });

      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        event?: { htmlLink?: string; start?: string };
      };

      if (!res.ok || !json.success) {
        setErrorMessage(
          json.error ||
            "We couldn't create the event. Please try again or open Google Calendar directly."
        );
        return;
      }

      const start = json.event?.start
        ? DateTime.fromISO(json.event.start, { setZone: true }).setZone(tzA)
        : DateTime.fromISO(slot.startISO, { setZone: true }).setZone(tzA);

      const timeLabel = start.isValid
        ? start.toFormat("EEE, MMM d 'at' h:mm a")
        : "your selected time";

      setSuccessMessage(`Meeting scheduled for ${timeLabel}.`);
      setEventLink(json.event?.htmlLink ?? null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error && err.message
          ? err.message
          : "Connection error. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative rounded-2xl border-2 border-blue-400/70 bg-white overflow-hidden shadow-[0_12px_40px_-8px_rgba(37,99,235,0.35),0_0_0_1px_rgba(37,99,235,0.12)] ring-2 ring-blue-400/40 transition-all duration-300 hover:shadow-[0_20px_50px_-10px_rgba(37,99,235,0.4)] hover:-translate-y-1">
      <div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"
        aria-hidden
      />
      <div className="border-b border-slate-200/80 bg-gradient-to-r from-blue-50 via-indigo-50/90 to-slate-50 px-5 py-4 flex items-center gap-2.5">
        <span className="[&_svg]:text-[var(--accent-blue)]" aria-hidden>
          <CheckCircleIcon />
        </span>
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">
          {singleUser ? "Selected time" : "Selected meeting"}
        </h2>
      </div>
      <div className="p-5 space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Date
          </p>
          <p className="text-sm font-medium text-slate-900">{meetingDateLabel}</p>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mt-3">
            Time
          </p>
          <p className="text-sm font-medium text-slate-900">{timeRangeA}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {singleUser ? zoneLabelA : `Your time (${zoneLabelA})`}
          </p>
          {!singleUser && (
            <>
              <p className="text-sm font-medium text-slate-900 mt-3">
                {timeRangeB}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Their time ({zoneLabelB})
              </p>
            </>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 border-t border-slate-200 pt-4 animate-[fadeIn_180ms_ease-out]"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Meeting title
            </label>
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 bg-white"
              placeholder="e.g. Prep call"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Description / context{" "}
              <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 bg-white resize-none"
              placeholder="Notes, agenda, or prep context"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Attendees <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={attendeesText}
              onChange={(e) => setAttendeesText(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 bg-white"
              placeholder="Email addresses, separated by commas"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Meeting duration
            </label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 bg-white"
            >
              {durationOptions.map((m) => (
                <option key={m} value={m}>
                  {m} minutes
                </option>
              ))}
            </select>
            {slotDurationMinutes < 60 && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Longer durations are disabled if they do not fit in this slot.
              </p>
            )}
          </div>

          {errorMessage && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {successMessage}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto min-w-[200px] min-h-[44px] rounded-xl bg-gradient-to-b from-blue-600 via-blue-600 to-indigo-700 px-5 py-2.5 text-sm font-bold text-white hover:from-blue-500 hover:via-blue-500 hover:to-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 transition-all duration-300 shadow-xl shadow-blue-900/25 hover:shadow-2xl hover:shadow-blue-900/30 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <CalendarIcon />
              {submitting ? "Creating event..." : "Create event"}
            </button>
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto min-w-[200px] min-h-[44px] rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 focus-visible:ring-offset-2 transition-all duration-200"
            >
              Open in Google Calendar
            </a>
          </div>
          {eventLink && (
            <div className="pt-1">
              <a
                href={eventLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-[var(--accent-blue)] hover:text-blue-700 hover:underline"
              >
                View event in Google Calendar
              </a>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

