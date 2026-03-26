"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { AppNav } from "@/components/nav/AppNav";
import { AppFooter } from "@/components/nav/AppFooter";
import { ScheduleBackground } from "@/components/ui/ScheduleBackground";
import { ScheduleSetupSection } from "@/components/scheduler/ScheduleSetupSection";
import { OtherAvailabilitySection } from "@/components/scheduler/OtherAvailabilitySection";
import { TimePickerSection } from "@/components/scheduler/TimePickerSection";
import { MeetingSummaryRail } from "@/components/scheduler/MeetingSummaryRail";

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
      const draftMeta =
        w.draftMeta && typeof w.draftMeta === "object"
          ? (w.draftMeta as OtherPersonWindow["draftMeta"])
          : undefined;
      return { id, date, start, end, draftMeta };
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

  /* Scroll-based parallax: background and glow lag slightly for depth */
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        el.style.setProperty("--parallax-neural", `${-y * 0.025}px`);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // init
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="page-dark min-h-screen flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
        <ScheduleBackground />
      </div>
      <div className="page-grid" aria-hidden />
      <div className="page-content relative z-10 flex flex-col flex-1">
      <AppNav />

      <main className="flex-1 w-full max-w-6xl mx-auto px-5 py-10 sm:px-6 sm:py-12 relative">
        <div className="mb-10 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
            Schedule & prepare
          </h1>
          <p className="mt-2 text-[var(--foreground-muted)] leading-relaxed">
            Set your availability, find overlap, and prepare for your meeting.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] lg:items-start">
          <div className="space-y-8">
            <ScheduleSetupSection
              zoneA={zoneA}
              workingHoursA={workingHoursA}
              duration={duration}
              calendarConnected={calendarConnected}
              calendarEvents={calendarEvents}
              derivedAvailabilityToday={derivedAvailabilityToday}
              errorZoneA={validation.errorZoneA}
              selectedSlot={selectedSlot}
              onZoneAChange={setZoneA}
              onDurationChange={setDuration}
              onWorkingHoursAChange={setWorkingHoursA}
              onCalendarChange={onCalendarChange}
            />

            <OtherAvailabilitySection
              scheduleDays={scheduleDays}
              zoneB={zoneB}
              windows={otherPersonWindows}
              weeklyPattern={weeklyPattern}
              onZoneBChange={setZoneB}
              onWindowsChange={setOtherPersonWindows}
              onWeeklyPatternChange={setWeeklyPattern}
            />

            <TimePickerSection
              useTwoPersonOverlap={useTwoPersonOverlap}
              validationCanCompute={validation.canCompute}
              availabilityByDay={availabilityByDay}
              selectedDay={selectedDay}
              selectedDaySlots={selectedDaySlots}
              allSlots={allSlots}
              suggestedSlots={suggestedSlots}
              rankedSlotsForSelectedDay={rankedSlotsForSelectedDay}
              selectedSlot={selectedSlot}
              zoneA={zoneA}
              zoneB={zoneB}
              hasValidInputNoOverlap={hasValidInputNoOverlap}
              showInputPrompt={showInputPrompt}
              calendarEvents={calendarEvents}
              calendarConnected={calendarConnected}
              workingHoursA={workingHoursA}
              onSelectDay={setSelectedDay}
              onSelectSlot={setSelectedSlot}
              mobileSummary={
                <MeetingSummaryRail
                  zoneA={zoneA}
                  zoneB={zoneB}
                  duration={duration}
                  useTwoPersonOverlap={useTwoPersonOverlap}
                  calendarConnected={calendarConnected}
                  availabilityByDay={availabilityByDay}
                  allSlots={allSlots}
                  selectedSlot={selectedSlot}
                  prepNotes={prepNotes}
                  prepLoading={prepLoading}
                  prepError={prepError}
                  meetingType={meetingType}
                  context={context}
                  resume={resume}
                  jobDescription={jobDescription}
                  onMeetingTypeChange={setMeetingType}
                  onContextChange={setContext}
                  onResumeChange={setResume}
                  onJobDescriptionChange={setJobDescription}
                  onGeneratePrep={generatePrep}
                />
              }
            />
          </div>

          <div className="hidden lg:block lg:sticky lg:top-24">
            <MeetingSummaryRail
              zoneA={zoneA}
              zoneB={zoneB}
              duration={duration}
              useTwoPersonOverlap={useTwoPersonOverlap}
              calendarConnected={calendarConnected}
              availabilityByDay={availabilityByDay}
              allSlots={allSlots}
              selectedSlot={selectedSlot}
              prepNotes={prepNotes}
              prepLoading={prepLoading}
              prepError={prepError}
              meetingType={meetingType}
              context={context}
              resume={resume}
              jobDescription={jobDescription}
              onMeetingTypeChange={setMeetingType}
              onContextChange={setContext}
              onResumeChange={setResume}
              onJobDescriptionChange={setJobDescription}
              onGeneratePrep={generatePrep}
            />
          </div>
        </div>
      </main>
      <AppFooter />
      </div>
    </div>
  );
}
