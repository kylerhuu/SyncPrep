"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import {
  findOverlappingSlots,
  getBestSuggestions,
  isValidZone,
  validateTimeWindow,
  MEETING_DURATIONS,
  type MeetingDurationMinutes,
  type OverlapSlotResult,
} from "@/lib/timezone";
import type { MeetingType, PrepNotes, TimeWindow } from "@/types";
import { TimezoneFields } from "@/components/scheduler/TimezoneFields";
import { AvailabilityWindows } from "@/components/scheduler/AvailabilityWindows";
import { DurationSelect } from "@/components/scheduler/DurationSelect";
import { OverlapResults } from "@/components/scheduler/OverlapResults";
import { SelectedMeetingCard } from "@/components/scheduler/SelectedMeetingCard";
import { PrepNotesPanel } from "@/components/prep/PrepNotesPanel";

const STORAGE_KEYS = {
  zoneA: "syncprep_zoneA",
  zoneB: "syncprep_zoneB",
  windowsA: "syncprep_windowsA",
  windowsB: "syncprep_windowsB",
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
  const [windowsA, setWindowsA] = useState<TimeWindow[]>([]);
  const [windowsB, setWindowsB] = useState<TimeWindow[]>([]);
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
    setZoneA(loadJson(STORAGE_KEYS.zoneA, ""));
    setZoneB(loadJson(STORAGE_KEYS.zoneB, ""));
    const loadedA = loadJson<TimeWindow[]>(STORAGE_KEYS.windowsA, [defaultWindow]);
    const loadedB = loadJson<TimeWindow[]>(STORAGE_KEYS.windowsB, [defaultWindow]);
    setWindowsA(Array.isArray(loadedA) && loadedA.length > 0 ? loadedA : [defaultWindow]);
    setWindowsB(Array.isArray(loadedB) && loadedB.length > 0 ? loadedB : [defaultWindow]);
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

  useEffect(() => {
    saveJson(STORAGE_KEYS.zoneA, zoneA);
    saveJson(STORAGE_KEYS.zoneB, zoneB);
    saveJson(STORAGE_KEYS.windowsA, windowsA);
    saveJson(STORAGE_KEYS.windowsB, windowsB);
    saveJson(STORAGE_KEYS.duration, duration);
    saveJson(STORAGE_KEYS.meetingType, meetingType);
    saveJson(STORAGE_KEYS.context, context);
    saveJson(STORAGE_KEYS.resume, resume);
    saveJson(STORAGE_KEYS.jobDescription, jobDescription);
    saveJson(STORAGE_KEYS.selectedSlot, selectedSlot);
  }, [
    zoneA,
    zoneB,
    windowsA,
    windowsB,
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
    const hasValidWindowA = windowsA.some((w) => validateTimeWindow(w).valid);
    const hasValidWindowB = windowsB.some((w) => validateTimeWindow(w).valid);
    const hasZonesAndWindows =
      zoneA.trim() !== "" &&
      zoneB.trim() !== "" &&
      windowsA.length > 0 &&
      windowsB.length > 0;
    const canCompute: boolean =
      hasZonesAndWindows &&
      zoneAValid &&
      zoneBValid &&
      hasValidWindowA &&
      hasValidWindowB;
    return {
      zoneAValid,
      zoneBValid,
      allWindowsA: hasValidWindowA,
      allWindowsB: hasValidWindowB,
      canCompute,
      errorZoneA:
        zoneA.trim() && !zoneAValid
          ? "Unknown time zone or city. Try e.g. New York or America/New_York"
          : undefined,
      errorZoneB:
        zoneB.trim() && !zoneBValid
          ? "Unknown time zone or city. Try e.g. London or Europe/London"
          : undefined,
    };
  }, [zoneA, zoneB, windowsA, windowsB]);

  const allSlots = useMemo(() => {
    if (!validation.canCompute) return [];
    return findOverlappingSlots(
      zoneA,
      windowsA,
      zoneB,
      windowsB,
      refDate,
      duration
    );
  }, [
    validation.canCompute,
    zoneA,
    zoneB,
    windowsA,
    windowsB,
    refDate,
    duration,
  ]);
  const suggestedSlots = useMemo(() => getBestSuggestions(allSlots), [allSlots]);

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
        setPrepError("Invalid response from server. Please try again.");
        return;
      }
      if (!res.ok) {
        setPrepError(
          typeof data?.error === "string" ? data.error : "Failed to generate prep notes"
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
        e instanceof Error ? e.message : "Request failed"
      );
    } finally {
      setPrepLoading(false);
    }
  }, [meetingType, context, resume, jobDescription]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-4 sm:px-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-slate-900 hover:text-slate-700"
          >
            SyncPrep
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-5 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Schedule & prepare
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
            Schedule across time zones and generate AI-powered meeting prep in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          <div className="space-y-8">
            <section aria-label="Find a meeting time">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                Step 1 — Find a meeting time
              </p>
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-200/80 px-5 py-4 bg-slate-50/95">
                  <h2 className="text-sm font-semibold tracking-tight text-slate-800">
                    Time zones & availability
                  </h2>
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
                <AvailabilityWindows
                  windows={windowsA}
                  onChange={setWindowsA}
                  label="Your availability (local time)"
                />
                <AvailabilityWindows
                  windows={windowsB}
                  onChange={setWindowsB}
                  label="Other person's availability (their local time)"
                />
              </div>
              </div>
            </section>
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
                <p className="text-sm text-slate-500 text-center py-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                  Select a time above to see your meeting summary and add to
                  calendar.
                </p>
              ) : null}
            </section>
            <section className="space-y-1" aria-label="Preparation notes">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                Step 2 — Generate prep notes
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
                  className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  View prep results page →
                </Link>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
