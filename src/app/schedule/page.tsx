"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import {
  getAvailabilityByDaySingleUser,
  getAvailabilityByDayWithManualOther,
  getBestSuggestions,
  isValidZone,
  resolveTimezone,
  toValidBusyBlocks,
  validateTimeWindow,
  windowsToUtcRanges,
  workingHoursMinusBusy,
  MEETING_DURATIONS,
  type DayAvailability,
  type MeetingDurationMinutes,
  type OverlapSlotResult,
} from "@/lib/timezone";
import { rankMutualSlots } from "@/lib/slot-ranking";
import type { MeetingType, PrepNotes, TimeWindow, WeeklyPattern } from "@/types";
import type { OtherPersonWindow } from "@/types";
import type { CalendarEventItem } from "@/types/calendar";
import { TimezoneFields } from "@/components/scheduler/TimezoneFields";
import { WorkingHoursInput } from "@/components/scheduler/WorkingHoursInput";
import { DurationSelect } from "@/components/scheduler/DurationSelect";
import { OverlapResults } from "@/components/scheduler/OverlapResults";
import { SelectedMeetingCard } from "@/components/scheduler/SelectedMeetingCard";
import { PrepNotesPanel } from "@/components/prep/PrepNotesPanel";
import { GoogleCalendarSection } from "@/components/calendar/GoogleCalendarSection";
import { WeeklyScheduleSection } from "@/components/calendar/WeeklyScheduleSection";
import { OtherPersonAvailabilitySection } from "@/components/scheduler/OtherPersonAvailabilitySection";
import { AppNav } from "@/components/nav/AppNav";
import { AppFooter } from "@/components/nav/AppFooter";

const STORAGE_KEYS = {
  zoneA: "syncprep_zoneA",
  zoneB: "syncprep_zoneB",
  workingHoursA: "syncprep_workingHoursA",
  workingHoursB: "syncprep_workingHoursB",
  otherPersonWindows: "syncprep_otherPersonWindows",
  duration: "syncprep_duration",
  meetingType: "syncprep_meetingType",
  context: "syncprep_context",
  resume: "syncprep_resume",
  jobDescription: "syncprep_jobDescription",
  selectedSlot: "syncprep_selectedSlot",
  weeklyPattern: "syncprep_weeklyPattern",
};

/** Ensure each window has an id (for React keys); add if missing. */
function normalizeOtherPersonWindows(
  raw: unknown
): OtherPersonWindow[] {
  if (!Array.isArray(raw)) return [];
  const scheduleDates = new Set<string>();
  return raw
    .filter((w): w is Record<string, unknown> => w && typeof w === "object")
    .map((w, i) => {
      const date = typeof w.date === "string" ? w.date : "";
      const start = typeof w.start === "string" ? w.start : "09:00";
      const end = typeof w.end === "string" ? w.end : "17:00";
      const id = typeof w.id === "string" ? w.id : `win-${i}-${Date.now()}`;
      return { id, date, start, end };
    })
    .filter((w) => w.date && w.start && w.end);
}

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

const emptyWeeklyPattern: WeeklyPattern = {
  Sunday: [],
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
};

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
  const [otherPersonWindows, setOtherPersonWindows] = useState<OtherPersonWindow[]>([]);
  const [weeklyPattern, setWeeklyPattern] = useState<WeeklyPattern>(emptyWeeklyPattern);

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
    const rawWindows = loadJson<unknown>(STORAGE_KEYS.otherPersonWindows, []);
    setOtherPersonWindows(normalizeOtherPersonWindows(rawWindows));
    const storedPattern = loadJson<Partial<WeeklyPattern> | null>(
      STORAGE_KEYS.weeklyPattern,
      null
    );
    if (storedPattern && typeof storedPattern === "object") {
      setWeeklyPattern((prev) => ({
        Sunday: Array.isArray(storedPattern.Sunday) ? storedPattern.Sunday : prev.Sunday,
        Monday: Array.isArray(storedPattern.Monday) ? storedPattern.Monday : prev.Monday,
        Tuesday: Array.isArray(storedPattern.Tuesday) ? storedPattern.Tuesday : prev.Tuesday,
        Wednesday: Array.isArray(storedPattern.Wednesday) ? storedPattern.Wednesday : prev.Wednesday,
        Thursday: Array.isArray(storedPattern.Thursday) ? storedPattern.Thursday : prev.Thursday,
        Friday: Array.isArray(storedPattern.Friday) ? storedPattern.Friday : prev.Friday,
        Saturday: Array.isArray(storedPattern.Saturday) ? storedPattern.Saturday : prev.Saturday,
      }));
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
    saveJson(
      STORAGE_KEYS.otherPersonWindows,
      otherPersonWindows.map(({ id: _id, ...rest }) => rest)
    );
    saveJson(STORAGE_KEYS.duration, duration);
    saveJson(STORAGE_KEYS.meetingType, meetingType);
    saveJson(STORAGE_KEYS.context, context);
    saveJson(STORAGE_KEYS.resume, resume);
    saveJson(STORAGE_KEYS.jobDescription, jobDescription);
    saveJson(STORAGE_KEYS.selectedSlot, selectedSlot);
    saveJson(STORAGE_KEYS.weeklyPattern, weeklyPattern);
  }, [
    zoneA,
    zoneB,
    workingHoursA,
    workingHoursB,
    otherPersonWindows,
    duration,
    meetingType,
    context,
    resume,
    jobDescription,
    selectedSlot,
    weeklyPattern,
  ]);

  const refDate = useMemo(() => DateTime.now(), []);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const validation = useMemo(() => {
    const zoneAValid = !zoneA.trim() || isValidZone(zoneA);
    const validWorkingHoursA = validateTimeWindow(workingHoursA).valid;
    const hasZoneAndHours = zoneA.trim() !== "" && validWorkingHoursA;
    const canCompute = hasZoneAndHours && zoneAValid;
    return {
      zoneAValid,
      validWorkingHoursA,
      canCompute,
      errorZoneA:
        zoneA.trim() && !zoneAValid
          ? "Couldn't find that time zone. Try a city like Bangkok, an abbreviation like PST, or a full zone like America/Los_Angeles."
          : undefined,
    };
  }, [zoneA, workingHoursA]);

  /** Next 7 days for the "other person" day dropdown (and overlap scheduling). */
  const scheduleDays = useMemo(() => {
    const tz =
      zoneA.trim() !== ""
        ? resolveTimezone(zoneA)
        : typeof Intl !== "undefined" && Intl.DateTimeFormat
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : "UTC";
    const today = refDate.setZone(tz).startOf("day");
    return Array.from({ length: 7 }, (_, i) => {
      const d = today.plus({ days: i });
      return {
        date: d.toFormat("yyyy-MM-dd"),
        label:
          i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toFormat("EEE MMM d"),
      };
    });
  }, [refDate, zoneA]);

  /** Calendar events as busy blocks (validated); empty when not connected or on API failure. */
  const busyBlocksFromCalendar = useMemo(
    () =>
      calendarConnected
        ? toValidBusyBlocks(
            calendarEvents.map((e) => ({ start: e.start, end: e.end }))
          )
        : [],
    [calendarConnected, calendarEvents]
  );

  const useTwoPersonOverlap =
    otherPersonWindows.length > 0 &&
    zoneB.trim() !== "" &&
    isValidZone(zoneB);

  const availabilityByDay = useMemo((): DayAvailability[] => {
    if (!validation.canCompute) return [];
    if (useTwoPersonOverlap) {
      return getAvailabilityByDayWithManualOther(
        zoneA,
        [workingHoursA],
        busyBlocksFromCalendar,
        duration,
        refDate,
        otherPersonWindows.map(({ id: _id, ...w }) => w),
        zoneB,
        weeklyPattern
      );
    }
    return getAvailabilityByDaySingleUser(
      zoneA,
      [workingHoursA],
      busyBlocksFromCalendar,
      duration,
      refDate
    );
  }, [
    validation.canCompute,
    zoneA,
    zoneB,
    workingHoursA,
    busyBlocksFromCalendar,
    refDate,
    duration,
    useTwoPersonOverlap,
    otherPersonWindows,
    weeklyPattern,
  ]);

  const allSlots = useMemo(
    () => availabilityByDay.flatMap((d) => d.slots),
    [availabilityByDay]
  );

  const selectedDaySlots = useMemo(() => {
    if (!selectedDay) return [];
    const day = availabilityByDay.find((d) => d.date === selectedDay);
    return day?.slots ?? [];
  }, [availabilityByDay, selectedDay]);

  const suggestedSlots = useMemo(
    () => getBestSuggestions(selectedDaySlots),
    [selectedDaySlots]
  );

  /** Ranked slots for the selected day (two-person mode only). Used for Recommended vs All UI. */
  const rankedSlotsForSelectedDay = useMemo(() => {
    if (!useTwoPersonOverlap || selectedDaySlots.length === 0) return undefined;
    return rankMutualSlots(selectedDaySlots, zoneA, refDate);
  }, [useTwoPersonOverlap, selectedDaySlots, zoneA, refDate]);

  useEffect(() => {
    if (availabilityByDay.length === 0) {
      setSelectedDay(null);
      return;
    }
    const dates = new Set(availabilityByDay.map((d) => d.date));
    if (selectedDay === null || !dates.has(selectedDay)) {
      setSelectedDay(availabilityByDay[0].date);
    }
  }, [availabilityByDay, selectedDay]);

  /** Migrate other-person windows with dates outside the current 7-day range to the first day. */
  useEffect(() => {
    if (scheduleDays.length === 0 || otherPersonWindows.length === 0) return;
    const validDates = new Set(scheduleDays.map((d) => d.date));
    const firstDate = scheduleDays[0].date;
    const needsMigration = otherPersonWindows.some((w) => !validDates.has(w.date));
    if (!needsMigration) return;
    setOtherPersonWindows((prev) =>
      prev.map((w) =>
        validDates.has(w.date) ? w : { ...w, date: firstDate }
      )
    );
  }, [scheduleDays, otherPersonWindows]);

  /** Today's availability in user's timezone (for calendar section). */
  const derivedAvailabilityToday = useMemo(() => {
    if (!zoneA.trim() || !validation.validWorkingHoursA) return [];
    const ranges = calendarConnected
      ? workingHoursMinusBusy(
          zoneA,
          [workingHoursA],
          busyBlocksFromCalendar,
          refDate
        )
      : windowsToUtcRanges(zoneA, [workingHoursA], refDate);
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
    busyBlocksFromCalendar,
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

  const hasValidInputNoOverlap =
    validation.canCompute && allSlots.length === 0;
  const showInputPrompt =
    !validation.canCompute || zoneA.trim() === "";

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

      <main className="flex-1 max-w-2xl w-full mx-auto px-5 py-12 sm:px-6 sm:py-14 relative">
        <div className="mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Schedule & prepare
          </h1>
          <p className="mt-2 text-slate-600 leading-relaxed">
            Schedule across time zones and prepare better meetings.
          </p>
        </div>

        <div className="flex flex-col gap-20 max-w-2xl">
          {/* Step 1 — Connect calendar */}
            <section aria-label="Connect your calendar" className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="px-8 pt-8 pb-6">
                <div className="flex items-center gap-3 mb-1">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white" aria-hidden>1</span>
                  <h2 className="text-base font-semibold text-slate-900 tracking-tight">Connect calendar</h2>
                </div>
                <p className="ml-11 text-sm text-slate-600">
                  Connect so we can use your busy times.
                </p>
              </div>
              <div className="px-8 pb-8 space-y-6">
                <div className="rounded-xl border-2 border-blue-200/70 bg-gradient-to-br from-blue-50/50 to-white overflow-hidden">
                  <GoogleCalendarSection
                    userTimeZone={zoneA}
                    onCalendarChange={onCalendarChange}
                    derivedAvailabilityToday={derivedAvailabilityToday}
                  />
                </div>
                <div className="space-y-6 rounded-xl border border-slate-200/80 bg-slate-50/40 p-6">
                <TimezoneFields
                  zoneA={zoneA}
                  zoneB={zoneB}
                  onZoneAChange={setZoneA}
                  onZoneBChange={setZoneB}
                  errorZoneA={validation.errorZoneA}
                  errorZoneB={undefined}
                  singleUser
                />
                <DurationSelect value={duration} onChange={setDuration} />
                <WorkingHoursInput
                  value={workingHoursA}
                  onChange={setWorkingHoursA}
                  label="Your working hours"
                  helperText={
                    calendarConnected
                      ? "Used with your calendar to find your free slots."
                      : "When you're generally available. Connect your calendar above for real busy times."
                  }
                />
                </div>
              </div>
            </section>

            {/* Step 2 — Other person's availability */}
            <section aria-label="Other person's availability" className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="px-8 pt-8 pb-6">
                <div className="flex items-center gap-3 mb-1">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white" aria-hidden>2</span>
                  <h2 className="text-base font-semibold text-slate-900 tracking-tight">Their availability</h2>
                </div>
                <p className="ml-11 text-sm text-slate-600">
                  Weekly pattern, screenshot, or specific dates.
                </p>
              </div>
              <div className="px-8 pb-8">
                <OtherPersonAvailabilitySection
                  scheduleDays={scheduleDays}
                  zoneB={zoneB}
                  onZoneBChange={setZoneB}
                  windows={otherPersonWindows}
                  onWindowsChange={setOtherPersonWindows}
                  weeklyPattern={weeklyPattern}
                  onWeeklyPatternChange={setWeeklyPattern}
                />
              </div>
            </section>

            {/* Step 3 — Find a meeting time */}
            <section aria-label={useTwoPersonOverlap ? "Mutual availability" : "Available times"} className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="px-8 pt-8 pb-6">
                <div className="flex items-center gap-3 mb-1">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white" aria-hidden>3</span>
                  <h2 className="text-base font-semibold text-slate-900 tracking-tight">Find a time</h2>
                </div>
                <p className="ml-11 text-sm text-slate-600">
                  {useTwoPersonOverlap ? "Pick a mutual slot." : "Pick an available slot."}
                </p>
              </div>
              <div className="px-8 pb-8 space-y-5">
                {validation.canCompute && availabilityByDay.length > 0 && (
                  <div className="flex flex-wrap gap-2" role="tablist" aria-label="Choose day">
                    {availabilityByDay.map((day) => {
                    const isSelected = selectedDay === day.date;
                    return (
                      <button
                        key={day.date}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setSelectedDay(day.date)}
                        className={`rounded-xl border-2 px-3.5 py-2.5 text-sm font-medium transition-all duration-200 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${isSelected ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-500/25" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
                      >
                        <span className="block truncate max-w-[7rem] sm:max-w-none">{day.label}</span>
                        {day.slots.length > 0 && (
                          <span className={`ml-1.5 font-normal tabular-nums ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                            ({day.slots.length})
                          </span>
                        )}
                      </button>
                    );
                    })}
                  </div>
                )}
                <OverlapResults
                  allSlots={allSlots}
                  slotsForSelectedDay={selectedDaySlots}
                  suggestedSlots={suggestedSlots}
                  rankedSlotsForSelectedDay={rankedSlotsForSelectedDay}
                  selectedSlot={selectedSlot}
                  onSelectSlot={setSelectedSlot}
                  zoneA={zoneA}
                  zoneB={useTwoPersonOverlap ? zoneB : undefined}
                  singleUser={!useTwoPersonOverlap}
                  hasValidInputNoOverlap={hasValidInputNoOverlap}
                  showInputPrompt={showInputPrompt}
                />
                <WeeklyScheduleSection
                  userTimeZone={zoneA}
                  workingHours={workingHoursA}
                  events={calendarEvents}
                  connected={calendarConnected}
                  selectedSlot={selectedSlot}
                />
              </div>
            </section>

            {/* Step 4 — Meeting context */}
            <section aria-label="Meeting context" className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="px-8 pt-8 pb-6">
                <div className="flex items-center gap-3 mb-1">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white" aria-hidden>4</span>
                  <h2 className="text-base font-semibold text-slate-900 tracking-tight">Meeting context</h2>
                </div>
                <p className="ml-11 text-sm text-slate-600">
                  Notes, resume, or job description for prep.
                </p>
              </div>
              <div className="px-8 pb-8">
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
              </div>
            </section>

            {/* Step 5 — Create calendar event */}
            <section aria-label="Create calendar event" className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="px-8 pt-8 pb-6">
                <div className="flex items-center gap-3 mb-1">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white" aria-hidden>5</span>
                  <h2 className="text-base font-semibold text-slate-900 tracking-tight">Add to calendar</h2>
                </div>
                <p className="ml-11 text-sm text-slate-600">
                  Create the event. Select a time in step 3 first.
                </p>
              </div>
              <div className="px-8 pb-8">
              {selectedSlot ? (
                <SelectedMeetingCard
                  slot={selectedSlot}
                  zoneA={zoneA}
                  zoneB={useTwoPersonOverlap ? zoneB : undefined}
                  title="Meeting"
                  singleUser={!useTwoPersonOverlap}
                />
              ) : allSlots.length > 0 ? (
                <p className="text-sm text-slate-500 text-center py-8 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/90">
                  Select a time above to create your event.
                </p>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/90">
                  Complete steps 1 and 2 to see available times.
                </p>
              )}
              </div>
            </section>

            {/* Step 6 — Generate AI meeting brief */}
            <section aria-label="Generate AI meeting brief" className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="px-8 pt-8 pb-6">
                <div className="flex items-center gap-3 mb-1">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white" aria-hidden>6</span>
                  <h2 className="text-base font-semibold text-slate-900 tracking-tight">AI meeting brief</h2>
                </div>
                <p className="ml-11 text-sm text-slate-600">
                  Talking points and prep. Add context in step 4, then generate.
                </p>
              </div>
              <div className="px-8 pb-8">
              {prepNotes ? (
                <p className="text-sm text-slate-600">
                  <Link
                    href="/prep"
                    className="font-semibold text-[var(--accent-blue)] hover:text-blue-700 hover:underline transition-colors"
                  >
                    View full brief →
                  </Link>
                </p>
              ) : (
                <p className="text-sm text-slate-600">
                  Add context in step 4, then click Generate.
                </p>
              )}
              </div>
            </section>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
