"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import {
  findOverlappingSlots,
  getBestSuggestions,
  type OverlapSlotResult,
} from "@/lib/timezone";
import type { MeetingType, PrepNotes, TimeWindow } from "@/types";
import { TimezoneFields } from "@/components/scheduler/TimezoneFields";
import { AvailabilityWindows } from "@/components/scheduler/AvailabilityWindows";
import { OverlapResults } from "@/components/scheduler/OverlapResults";
import { CalendarLink } from "@/components/scheduler/CalendarLink";
import { MeetingContextForm } from "@/components/prep/MeetingContextForm";
import { PrepNotesPanel } from "@/components/prep/PrepNotesPanel";

const STORAGE_KEYS = {
  zoneA: "syncprep_zoneA",
  zoneB: "syncprep_zoneB",
  windowsA: "syncprep_windowsA",
  windowsB: "syncprep_windowsB",
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

export default function SchedulePage() {
  const [zoneA, setZoneA] = useState("");
  const [zoneB, setZoneB] = useState("");
  const [windowsA, setWindowsA] = useState<TimeWindow[]>([]);
  const [windowsB, setWindowsB] = useState<TimeWindow[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<OverlapSlotResult | null>(null);
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
    setWindowsA(loadJson<TimeWindow[]>(STORAGE_KEYS.windowsA, [defaultWindow]));
    setWindowsB(loadJson<TimeWindow[]>(STORAGE_KEYS.windowsB, [defaultWindow]));
    setMeetingType(loadJson<MeetingType>(STORAGE_KEYS.meetingType, "interview"));
    setContext(loadJson(STORAGE_KEYS.context, ""));
    setResume(loadJson(STORAGE_KEYS.resume, ""));
    setJobDescription(loadJson(STORAGE_KEYS.jobDescription, ""));
    const saved = loadJson<OverlapSlotResult | null>(STORAGE_KEYS.selectedSlot, null);
    if (saved?.startISO) setSelectedSlot(saved);
  }, []);

  useEffect(() => {
    saveJson(STORAGE_KEYS.zoneA, zoneA);
    saveJson(STORAGE_KEYS.zoneB, zoneB);
    saveJson(STORAGE_KEYS.windowsA, windowsA);
    saveJson(STORAGE_KEYS.windowsB, windowsB);
    saveJson(STORAGE_KEYS.meetingType, meetingType);
    saveJson(STORAGE_KEYS.context, context);
    saveJson(STORAGE_KEYS.resume, resume);
    saveJson(STORAGE_KEYS.jobDescription, jobDescription);
    saveJson(STORAGE_KEYS.selectedSlot, selectedSlot);
  }, [zoneA, zoneB, windowsA, windowsB, meetingType, context, resume, jobDescription, selectedSlot]);

  const refDate = useMemo(() => DateTime.utc().startOf("day"), []);
  const allSlots = useMemo(() => {
    if (!zoneA.trim() || !zoneB.trim() || windowsA.length === 0 || windowsB.length === 0) return [];
    return findOverlappingSlots(zoneA, windowsA, zoneB, windowsB, refDate);
  }, [zoneA, zoneB, windowsA, windowsB, refDate]);
  const suggestedSlots = useMemo(() => getBestSuggestions(allSlots), [allSlots]);

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
      const data = await res.json();
      if (!res.ok) {
        setPrepError(data.error ?? "Failed to generate prep notes");
        return;
      }
      setPrepNotes(data);
    } catch (e) {
      setPrepError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setPrepLoading(false);
    }
  }, [meetingType, context, resume, jobDescription]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-gray-900 hover:text-gray-700">
            SyncPrep
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Schedule & prepare</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: forms */}
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 px-4 py-3 bg-gray-50/80">
                <h2 className="text-sm font-semibold text-gray-900">Time zones & availability</h2>
              </div>
              <div className="p-4 space-y-6">
                <TimezoneFields
                  zoneA={zoneA}
                  zoneB={zoneB}
                  onZoneAChange={setZoneA}
                  onZoneBChange={setZoneB}
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

            <MeetingContextForm
              meetingType={meetingType}
              context={context}
              resume={resume}
              jobDescription={jobDescription}
              onMeetingTypeChange={setMeetingType}
              onContextChange={setContext}
              onResumeChange={setResume}
              onJobDescriptionChange={setJobDescription}
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={generatePrep}
                disabled={prepLoading}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none transition"
              >
                {prepLoading ? "Generating…" : "Generate prep notes"}
              </button>
            </div>
          </div>

          {/* Right: results + prep */}
          <div className="space-y-6">
            <OverlapResults
              allSlots={allSlots}
              suggestedSlots={suggestedSlots}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
            />
            <CalendarLink slot={selectedSlot} title="Meeting" />
            <PrepNotesPanel notes={prepNotes} loading={prepLoading} error={prepError} />
          </div>
        </div>
      </main>
    </div>
  );
}
