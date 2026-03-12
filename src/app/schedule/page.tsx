"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import {
  findOverlappingSlotsFromRanges,
  getBestSuggestions,
  isValidZone,
  resolveTimezone,
  validateTimeWindow,
  windowsToUtcRanges,
  workingHoursMinusBusy,
  MEETING_DURATIONS,
  type MeetingDurationMinutes,
  type OverlapSlotResult,
} from "@/lib/timezone";
import type { MeetingType, PrepNotes, TimeWindow } from "@/types";
import type { CalendarEventItem } from "@/types/calendar";
import { TimezoneFields } from "@/components/scheduler/TimezoneFields";
import { WorkingHoursInput } from "@/components/scheduler/WorkingHoursInput";
import { DurationSelect } from "@/components/scheduler/DurationSelect";
import { OverlapResults } from "@/components/scheduler/OverlapResults";
import { SelectedMeetingCard } from "@/components/scheduler/SelectedMeetingCard";
import { PrepNotesPanel } from "@/components/prep/PrepNotesPanel";
import { GoogleCalendarSection } from "@/components/calendar/GoogleCalendarSection";
import { WeeklyScheduleSection } from "@/components/calendar/WeeklyScheduleSection";
import { AppNav } from "@/components/nav/AppNav";
import { AppFooter } from "@/components/nav/AppFooter";

const STORAGE_KEYS = {
  zoneA: "syncprep_zoneA",
  zoneB: "syncprep_zoneB",
  workingHoursA: "syncprep_workingHoursA",
  workingHoursB: "syncprep_workingHoursB",
  duration: "syncprep_duration",
  meetingType: "syncprep_meetingType",
  context: "syncprep_context",
  resume: "syncprep_resume",
  jobDescription: "syncprep_jobDescription",
  selectedSlot: "syncprep_selectedSlot",
};

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

function saveJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

const defaultWindow: TimeWindow = { start: "09:00", end: "17:00" };

function isValidDuration(n: number): n is MeetingDurationMinutes {
  return MEETING_DURATIONS.includes(n as MeetingDurationMinutes);
}

export default function SchedulePage() {
  const [zoneA, setZoneA] = useState("");
  const [zoneB, setZoneB] = useState("");
  const [workingHoursA, setWorkingHoursA] = useState<TimeWindow>(defaultWindow);
  const [workingHoursB, setWorkingHoursB] = useState<TimeWindow>(defaultWindow);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [duration, setDuration] = useState<MeetingDurationMinutes>(60);
  const [selectedSlot, setSelectedSlot] = useState<OverlapSlotResult | null>(
    null
  );
  const [meetingType, setMeetingType] = useState<MeetingType>("interview");
  const [context, setContext] = useState("");
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [prepNotes, setPrepNotes] = useState<PrepNotes | null>(null);
  const [prepLoading, setPrepLoading] = useState(false);
  const [prepError, setPrepError] = useState<string | null>(null);

  useEffect(() => {
    const storedA = loadJson(STORAGE_KEYS.zoneA, "");
    const detected = typeof Intl !== "undefined" && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "";
    setZoneA(storedA || detected);
    setZoneB(loadJson(STORAGE_KEYS.zoneB, ""));
    const loadedA = loadJson<TimeWindow>(STORAGE_KEYS.workingHoursA, defaultWindow);
    const loadedB = loadJson<TimeWindow>(STORAGE_KEYS.workingHoursB, defaultWindow);
    setWorkingHoursA(
      loadedA && typeof loadedA === "object" && "start" in loadedA && "end" in loadedA
        ? loadedA
        : defaultWindow
    );
    setWorkingHoursB(
      loadedB && typeof loadedB === "object" && "start" in loadedB && "end" in loadedB
        ? loadedB
        : defaultWindow
    );
    const d = loadJson<number>(STORAGE_KEYS.duration, 60);
    setDuration(isValidDuration(d) ? d : 60);
    setMeetingType(
      loadJson<MeetingType>(STORAGE_KEYS.meetingType, "interview")
    );
    setContext(loadJson(STORAGE_KEYS.context, ""));
    setResume(loadJson(STORAGE_KEYS.resume, ""));
    setJobDescription(loadJson(STORAGE_KEYS.jobDescription, ""));
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

  const onCalendarChange = useCallback((connected: boolean, events: CalendarEventItem[]) => {
    setCalendarConnected(connected);
    setCalendarEvents(events);
  }, []);

  useEffect(() => {
    saveJson(STORAGE_KEYS.zoneA, zoneA);
    saveJson(STORAGE_KEYS.zoneB, zoneB);
    saveJson(STORAGE_KEYS.workingHoursA, workingHoursA);
    saveJson(STORAGE_KEYS.workingHoursB, workingHoursB);
    saveJson(STORAGE_KEYS.duration, duration);
    saveJson(STORAGE_KEYS.meetingType, meetingType);
    saveJson(STORAGE_KEYS.context, context);
    saveJson(STORAGE_KEYS.resume, resume);
    saveJson(STORAGE_KEYS.jobDescription, jobDescription);
    saveJson(STORAGE_KEYS.selectedSlot, selectedSlot);
  }, [
    zoneA,
    zoneB,
    workingHoursA,
    workingHoursB,
    duration,
    meetingType,
    context,
    resume,
    jobDescription,
    selectedSlot,
  ]);

  const refDate = useMemo(() => DateTime.now(), []);

  const validation = useMemo(() => {
    const zoneAValid = !zoneA.trim() || isValidZone(zoneA);
    const zoneBValid = !zoneB.trim() || isValidZone(zoneB);
    const validWorkingHoursA = validateTimeWindow(workingHoursA).valid;
    const validWorkingHoursB = validateTimeWindow(workingHoursB).valid;
    const hasZones = zoneA.trim() !== "" && zoneB.trim() !== "";
    const canCompute: boolean =
      hasZones &&
      zoneAValid &&
      zoneBValid &&
      validWorkingHoursA &&
      validWorkingHoursB;
    return {
      zoneAValid,
      zoneBValid,
      validWorkingHoursA,
      validWorkingHoursB,
      canCompute,
      errorZoneA:
        zoneA.trim() && !zoneAValid
          ? "Couldn't find that time zone. Try a city like Bangkok, an abbreviation like PST, or a full zone like America/Los_Angeles."
          : undefined,
      errorZoneB:
        zoneB.trim() && !zoneBValid
          ? "Couldn't find that time zone. Try a city like Bangkok, an abbreviation like PST, or a full zone like America/Los_Angeles."
          : undefined,
    };
  }, [zoneA, zoneB, workingHoursA, workingHoursB]);

  const allSlots = useMemo(() => {
    if (!validation.canCompute) return [];
    const rangesB = windowsToUtcRanges(zoneB, [workingHoursB], refDate);
    let rangesA: { startISO: string; endISO: string }[];
    if (calendarConnected) {
      rangesA = workingHoursMinusBusy(
        zoneA,
        [workingHoursA],
        calendarEvents.map((e) => ({ start: e.start, end: e.end })),
        refDate
      );
    } else {
      rangesA = windowsToUtcRanges(zoneA, [workingHoursA], refDate);
    }
    return findOverlappingSlotsFromRanges(
      rangesA,
      rangesB,
      zoneA,
      zoneB,
      duration
    );
  }, [
    validation.canCompute,
    zoneA,
    zoneB,
    workingHoursA,
    workingHoursB,
    calendarConnected,
    calendarEvents,
    refDate,
    duration,
  ]);
  const suggestedSlots = useMemo(() => getBestSuggestions(allSlots), [allSlots]);

  /** Today's availability in user's timezone (for calendar section). */
  const derivedAvailabilityToday = useMemo(() => {
    if (!zoneA.trim() || !validation.validWorkingHoursA) return [];
    let ranges: { startISO: string; endISO: string }[];
    if (calendarConnected) {
      ranges = workingHoursMinusBusy(
        zoneA,
        [workingHoursA],
        calendarEvents.map((e) => ({ start: e.start, end: e.end })),
        refDate
      );
    } else {
      ranges = windowsToUtcRanges(zoneA, [workingHoursA], refDate);
    }
    const tz = resolveTimezone(zoneA);
    return ranges.map((r) => {
      const start = DateTime.fromISO(r.startISO, { setZone: true }).setZone(tz);
      const end = DateTime.fromISO(r.endISO, { setZone: true }).setZone(tz);
      return `${start.toFormat("h:mm a")} – ${end.toFormat("h:mm a")}`;
    });
  }, [
    zoneA,
    validation.validWorkingHoursA,
    workingHoursA,
    calendarConnected,
    calendarEvents,
    refDate,
  ]);

  // Clear selection when we have computed slots and the selected slot is not in the list
  // (e.g. user changed duration/zones/windows, or slot was from a previous day)
  useEffect(() => {
    if (!selectedSlot || !validation.canCompute) return;
    const stillValid = allSlots.some(
      (s) => s.startISO === selectedSlot.startISO
    );
    if (!stillValid) setSelectedSlot(null);
  }, [validation.canCompute, allSlots, selectedSlot]);

  const hasValidInputNoOverlap: boolean =
    validation.canCompute && allSlots.length === 0;
  const showInputPrompt: boolean =
    !validation.canCompute || (zoneA.trim() === "" && zoneB.trim() === "");

  const generatePrep = useCallback(async () => {
    setPrepError(null);
    setPrepLoading(true);
    setPrepNotes(null);
    try {
      const res = await fetch("/api/prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingType,
          context: context || undefined,
          resume: resume || undefined,
          jobDescription: jobDescription || undefined,
        }),
      });
      let data: { error?: string } & PrepNotes;
      try {
        data = await res.json();
      } catch {
        setPrepError("Something went wrong. Please try again.");
        return;
      }
      if (!res.ok) {
        setPrepError(
          typeof data?.error === "string" ? data.error : "We couldn't generate your meeting brief. Please try again."
        );
        return;
      }
      setPrepNotes(data);
      try {
        sessionStorage.setItem("syncprep_prepNotes", JSON.stringify(data));
      } catch {
        // ignore
      }
    } catch (e) {
      setPrepError(
        e instanceof Error && e.message ? e.message : "Connection error. Please check your internet and try again."
      );
    } finally {
      setPrepLoading(false);
    }
  }, [meetingType, context, resume, jobDescription]);

  return (
    <div className="min-h-screen flex flex-col bg-app-canvas">
      <AppNav />

      <main className="flex-1 max-w-6xl w-full mx-auto px-5 py-8 sm:px-6 relative">
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Schedule & prepare
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Schedule across time zones and prepare better meetings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          <div className="space-y-8">
            {/* Step 1 — Connect calendar (first, prominent) */}
            <section aria-label="Connect your calendar" className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Step 1 — Connect your Google Calendar
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Connect your calendar to automatically detect busy times and open gaps.
              </p>
              <div className="rounded-2xl border-2 border-blue-200/70 bg-gradient-to-br from-blue-50/50 to-white shadow-md overflow-hidden">
                <GoogleCalendarSection
                  userTimeZone={zoneA}
                  onCalendarChange={onCalendarChange}
                  derivedAvailabilityToday={derivedAvailabilityToday}
                />
              </div>
            </section>

            {/* Step 2 — Find meeting time */}
            <section aria-label="Find the best meeting time" className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Step 2 — Find the best meeting time
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Enter time zones and working hours to find the best overlap.
              </p>
              <div className="rounded-2xl border border-slate-200/80 bg-surface-elevated overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 card-hover">
                <div className="border-b border-slate-200/80 px-5 py-4 bg-gradient-to-r from-slate-50 to-white">
                  <h3 className="text-sm font-semibold tracking-tight text-slate-800">
                    Time zones & working hours
                  </h3>
                </div>
                <div className="p-5 space-y-6">
                  <TimezoneFields
                    zoneA={zoneA}
                    zoneB={zoneB}
                    onZoneAChange={setZoneA}
                    onZoneBChange={setZoneB}
                    errorZoneA={validation.errorZoneA}
                    errorZoneB={validation.errorZoneB}
                  />
                  <DurationSelect
                    value={duration}
                    onChange={setDuration}
                  />
                  <WorkingHoursInput
                    value={workingHoursA}
                    onChange={setWorkingHoursA}
                    label="Your working hours"
                    helperText={
                      calendarConnected
                        ? "Used with your calendar to find your free slots. Busy times come from your calendar."
                        : "When you're generally available. Connect your calendar above to use your real busy and free times."
                    }
                  />
                  <WorkingHoursInput
                    value={workingHoursB}
                    onChange={setWorkingHoursB}
                    label="Other person's working hours"
                  />
                </div>
              </div>
            </section>

            <WeeklyScheduleSection
              userTimeZone={zoneA}
              workingHours={workingHoursA}
              events={calendarEvents}
              connected={calendarConnected}
              selectedSlot={selectedSlot}
            />
          </div>

          <div className="space-y-7 lg:min-w-0">
            <section className="space-y-1" aria-label="Available times">
              <OverlapResults
                allSlots={allSlots}
                suggestedSlots={suggestedSlots}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
                zoneA={zoneA}
                zoneB={zoneB}
                hasValidInputNoOverlap={hasValidInputNoOverlap}
                showInputPrompt={showInputPrompt}
              />
            </section>
            <section className="space-y-1" aria-label="Selected meeting">
              {selectedSlot ? (
                <SelectedMeetingCard
                  slot={selectedSlot}
                  zoneA={zoneA}
                  zoneB={zoneB}
                  title="Meeting"
                />
              ) : allSlots.length > 0 ? (
                <p className="text-sm text-slate-500 text-center py-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/90">
                  Select a time to see your meeting summary and add to calendar.
                </p>
              ) : null}
            </section>
            <section className="space-y-3" aria-label="Generate meeting prep">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Step 3 — Generate quick meeting prep
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Generate a quick meeting brief, interview prep, or talking points.
              </p>
              <PrepNotesPanel
                notes={prepNotes}
                loading={prepLoading}
                error={prepError}
                onRetry={generatePrep}
                meetingType={meetingType}
                context={context}
                resume={resume}
                jobDescription={jobDescription}
                onMeetingTypeChange={setMeetingType}
                onContextChange={setContext}
                onResumeChange={setResume}
                onJobDescriptionChange={setJobDescription}
                onGenerate={generatePrep}
              />
            </section>
            {prepNotes && (
              <p className="text-sm text-slate-600">
                <Link
                  href="/prep"
                  className="font-semibold text-[var(--accent-blue)] hover:text-blue-700 hover:underline transition-colors"
                >
                  View full brief →
                </Link>
              </p>
            )}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
