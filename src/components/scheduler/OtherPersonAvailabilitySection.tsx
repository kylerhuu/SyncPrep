"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OtherPersonWindow, WeeklyPattern, Weekday, TimeWindow } from "@/types";
import { validateTimeWindow } from "@/lib/timezone";
import { isValidZone } from "@/lib/timezone";
import {
  normalizeDraftToWindows,
  type NormalizeDraftStats,
  type DraftReviewWindow,
  type ParsedDraftWindow,
} from "@/lib/availability-draft";
import type { ScheduleDayOption } from "@/lib/availability-draft";
import type { ConfidenceBreakdown, ScreenshotParseDebug, ParsedBusyInterval, DayCoverage } from "@/lib/screenshot-parse";
import {
  createDefaultScreenshotWorkingHours,
  deriveAvailabilityFromBusyMap,
} from "@/lib/screenshot-availability";
import { TimezoneInput } from "@/components/scheduler/TimezoneInput";
import { Card } from "@/components/ui/Card";
import { UserIcon, PlusIcon, TrashIcon, UploadIcon } from "@/components/ui/Icons";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const inputClass =
  "min-h-[40px] rounded-xl border-2 px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 border-slate-200 hover:border-slate-300 w-full min-w-0";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SCREENSHOT_FILE_MB = 10;

export type { ScheduleDayOption };

interface OtherPersonAvailabilitySectionProps {
  scheduleDays: ScheduleDayOption[];
  zoneB: string;
  onZoneBChange: (value: string) => void;
  windows: OtherPersonWindow[];
  onWindowsChange: (windows: OtherPersonWindow[]) => void;
  weeklyPattern: WeeklyPattern;
  onWeeklyPatternChange: (pattern: WeeklyPattern) => void;
}

interface ParseScreenshotResponse {
  busyByDate?: Record<string, ParsedBusyInterval[]>;
  dayCoverage?: Record<string, DayCoverage>;
  partial?: boolean;
  message?: string;
  warnings?: string[];
  parseType?: string;
  confidence?: ConfidenceBreakdown;
  debug?: ScreenshotParseDebug;
  rawDebug?: {
    primaryParsed: Record<string, unknown> | null;
    fallbackParsed: Record<string, unknown> | null;
    columnParses?: Array<{
      date: string | null;
      startX?: number;
      endX?: number;
      parsed: Record<string, unknown> | null;
    }>;
  };
  stats?: { totalParsed: number; normalized: number; skipped: number };
  error?: string;
}

function nextId(): string {
  return `win-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function validateWindow(
  w: OtherPersonWindow,
  scheduleDates: Set<string>
): string | null {
  if (!w.date?.trim()) return "Select a day.";
  if (!scheduleDates.has(w.date)) return "Day must be one of the next 7 days.";
  const tw = { start: w.start, end: w.end };
  const { valid, error } = validateTimeWindow(tw);
  if (!valid && error) return error;
  return null;
}

function rangesOverlap(
  a: { start: string; end: string },
  b: { start: string; end: string }
): boolean {
  const toMins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  return toMins(a.start) < toMins(b.end) && toMins(b.start) < toMins(a.end);
}

/** Get weekday name from a date string (yyyy-MM-dd). */
function getWeekdayFromDate(dateStr: string): Weekday {
  const d = new Date(dateStr + "T12:00:00");
  const idx = d.getDay();
  const keys: Weekday[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return keys[idx];
}

function getCoverageTone(coverage: DayCoverage): string {
  if (coverage === "confirmed") return "bg-emerald-100 text-emerald-700";
  if (coverage === "partial") return "bg-amber-100 text-amber-700";
  return "bg-slate-200 text-slate-600";
}

const WEEKDAYS: { key: Weekday; label: string; short: string }[] = [
  { key: "Sunday", label: "Sunday", short: "Sun" },
  { key: "Monday", label: "Monday", short: "Mon" },
  { key: "Tuesday", label: "Tuesday", short: "Tue" },
  { key: "Wednesday", label: "Wednesday", short: "Wed" },
  { key: "Thursday", label: "Thursday", short: "Thu" },
  { key: "Friday", label: "Friday", short: "Fri" },
  { key: "Saturday", label: "Saturday", short: "Sat" },
];

type InputTabExtended = "manual" | "weekly" | "screenshot";
type ScreenshotState = "idle" | "uploading" | "review" | "error";
export function OtherPersonAvailabilitySection({
  scheduleDays,
  zoneB,
  onZoneBChange,
  windows,
  onWindowsChange,
  weeklyPattern,
  onWeeklyPatternChange,
}: OtherPersonAvailabilitySectionProps) {
  const scheduleDates = new Set(scheduleDays.map((d) => d.date));
  const zoneBValid = !zoneB.trim() || isValidZone(zoneB);
  const errorZoneB =
    zoneB.trim() && !zoneBValid ? "Couldn't find that time zone." : undefined;

  const [inputTab, setInputTab] = useState<InputTabExtended>("weekly");
  const [screenshotState, setScreenshotState] = useState<ScreenshotState>("idle");
  const [draftWindows, setDraftWindows] = useState<DraftReviewWindow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsePartial, setParsePartial] = useState(false);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [parseType, setParseType] = useState<string | null>(null);
  const [parseConfidence, setParseConfidence] = useState<ConfidenceBreakdown | null>(null);
  const [parseDebug, setParseDebug] = useState<ScreenshotParseDebug | null>(null);
  const [parseRawDebug, setParseRawDebug] = useState<{
    primaryParsed: Record<string, unknown> | null;
    fallbackParsed: Record<string, unknown> | null;
    columnParses?: Array<{
      date: string | null;
      startX?: number;
      endX?: number;
      parsed: Record<string, unknown> | null;
    }>;
  } | null>(null);
  const [parsedBusyByDate, setParsedBusyByDate] = useState<Record<string, ParsedBusyInterval[]>>({});
  const [parsedDayCoverage, setParsedDayCoverage] = useState<Record<string, DayCoverage>>({});
  const [screenshotWorkingHours, setScreenshotWorkingHours] = useState<WeeklyPattern>(
    createDefaultScreenshotWorkingHours()
  );
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lastSelectedFile, setLastSelectedFile] = useState<File | null>(null);
  const [apiStats, setApiStats] = useState<{ totalParsed: number; normalized: number; skipped: number } | null>(null);
  const [draftStats, setDraftStats] = useState<NormalizeDraftStats | null>(null);
  const [apiFailed, setApiFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recomputeDraftFromParsed = useCallback(
    (
      busyByDate: Record<string, ParsedBusyInterval[]>,
      dayCoverage: Record<string, DayCoverage>,
      workingHours: WeeklyPattern
    ) => {
      const derived = deriveAvailabilityFromBusyMap({
        busyByDate,
        dayCoverage,
        workingHours,
      });
      const rawDraft: ParsedDraftWindow[] = derived.draft.map((window) => ({
        ...window,
        warnings: [...(window.warnings ?? []), ...derived.warnings],
      }));
      const { windows: normalizedWindows, stats: normStats } = normalizeDraftToWindows(
        rawDraft,
        scheduleDays
      );
      setDraftWindows(normalizedWindows);
      setDraftStats(normStats);
    },
    [scheduleDays]
  );

  const addWindow = useCallback(() => {
    const firstDate = scheduleDays[0]?.date ?? "";
    onWindowsChange([
      ...windows,
      { id: nextId(), date: firstDate, start: "09:00", end: "17:00" },
    ]);
  }, [windows, scheduleDays, onWindowsChange]);

  const updateWindow = useCallback(
    (id: string, patch: Partial<Omit<OtherPersonWindow, "id">>) => {
      onWindowsChange(
        windows.map((w) => (w.id === id ? { ...w, ...patch } : w))
      );
    },
    [windows, onWindowsChange]
  );

  const removeWindow = useCallback(
    (id: string) => {
      onWindowsChange(windows.filter((w) => w.id !== id));
    },
    [windows, onWindowsChange]
  );

  const updateDraftWindow = useCallback(
    (id: string, patch: Partial<Omit<DraftReviewWindow, "id">>) => {
      setDraftWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, ...patch } : w))
      );
    },
    []
  );

  const removeDraftWindow = useCallback((id: string) => {
    setDraftWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const addDraftWindow = useCallback(() => {
    const firstDate = scheduleDays[0]?.date ?? "";
    setDraftWindows((prev) => [
      ...prev,
      {
        id: nextId(),
        date: firstDate,
        mappedDate: firstDate,
        mappedMode: "exact",
        start: "09:00",
        end: "17:00",
      },
    ]);
  }, [scheduleDays]);

  const confirmDraft = useCallback(() => {
    const inRangeDraftWindows: OtherPersonWindow[] = draftWindows
      .filter((w) => w.mappedMode === "exact" && w.mappedDate != null)
      .map(({ id, mappedDate, start, end, draftMeta }) => ({
        id,
        date: mappedDate!,
        start,
        end,
        draftMeta,
      }));
    onWindowsChange([...windows, ...inRangeDraftWindows]);
    const merged: WeeklyPattern = { ...weeklyPattern };
    for (const w of draftWindows) {
      if (!w.date?.trim() || !w.start || !w.end) continue;
      if (w.mappedMode === "exact") continue;
      const weekday = getWeekdayFromDate(w.date);
      const existing = merged[weekday] ?? [];
      merged[weekday] = [...existing, { start: w.start, end: w.end }];
    }
    onWeeklyPatternChange(merged);
    setDraftWindows([]);
    setScreenshotState("idle");
    setParseError(null);
    setParsePartial(false);
    setUploadedFile(null);
    setDraftStats(null);
    setApiStats(null);
    setParseWarnings([]);
    setParseType(null);
    setParseConfidence(null);
    setParseDebug(null);
    setParseRawDebug(null);
    setParsedBusyByDate({});
    setParsedDayCoverage({});
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setInputTab("weekly");
  }, [windows, draftWindows, weeklyPattern, onWindowsChange, onWeeklyPatternChange, previewUrl]);

  const discardDraft = useCallback(() => {
    setDraftWindows([]);
    setScreenshotState("idle");
    setParseError(null);
    setParsePartial(false);
    setUploadedFile(null);
    setDraftStats(null);
    setApiStats(null);
    setParseWarnings([]);
    setParseType(null);
    setParseConfidence(null);
    setParseDebug(null);
    setParsedBusyByDate({});
    setParsedDayCoverage({});
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      const type = (file.type ?? "").toLowerCase();
      if (!ALLOWED_IMAGE_TYPES.includes(type)) {
        setParseError("Please upload a JPEG, PNG, WebP, or GIF image.");
        setScreenshotState("error");
        setApiFailed(false);
        return;
      }
      if (file.size > MAX_SCREENSHOT_FILE_MB * 1024 * 1024) {
        setParseError(`Image must be under ${MAX_SCREENSHOT_FILE_MB} MB.`);
        setScreenshotState("error");
        setApiFailed(false);
        return;
      }
      setParseError(null);
      setApiFailed(false);
      setLastSelectedFile(file);
      setScreenshotState("uploading");
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      const formData = new FormData();
      formData.set("image", file);
      formData.set("scheduleDays", JSON.stringify(scheduleDays));
      try {
        const res = await fetch("/api/availability/parse-screenshot", {
          method: "POST",
          body: formData,
        });
        const data = await res.json().catch(() => ({} as ParseScreenshotResponse));
        if (!res.ok) {
          setParseError(
            typeof data.error === "string"
              ? data.error
              : "We couldn't read availability from this screenshot. Please try again or enter manually."
          );
          setScreenshotState("error");
          setApiFailed(true);
          setApiStats(null);
          setDraftStats(null);
          setParseWarnings([]);
          setParseType(null);
          setParseConfidence(null);
          setParseDebug(null);
          setParseRawDebug(null);
          setParsedBusyByDate({});
          setParsedDayCoverage({});
          return;
        }
        const busyByDate =
          data.busyByDate && typeof data.busyByDate === "object" ? data.busyByDate : {};
        const dayCoverage =
          data.dayCoverage && typeof data.dayCoverage === "object" ? data.dayCoverage : {};
        setParsedBusyByDate(busyByDate);
        setParsedDayCoverage(dayCoverage);
        recomputeDraftFromParsed(busyByDate, dayCoverage, screenshotWorkingHours);
        setApiStats(
          data.stats && typeof data.stats === "object"
            ? (data.stats as { totalParsed: number; normalized: number; skipped: number })
            : null
        );
        setParsePartial(Boolean(data.partial));
        setParseError(typeof data.message === "string" ? data.message : null);
        setParseWarnings(
          Array.isArray(data.warnings)
            ? data.warnings.filter((item: unknown): item is string => typeof item === "string")
            : []
        );
        setParseType(typeof data.parseType === "string" ? data.parseType : null);
        setParseConfidence(
          data.confidence && typeof data.confidence === "object"
            ? (data.confidence as ConfidenceBreakdown)
            : null
        );
        setParseDebug(
          data.debug && typeof data.debug === "object"
            ? (data.debug as ScreenshotParseDebug)
            : null
        );
        setParseRawDebug(
          data.rawDebug && typeof data.rawDebug === "object"
            ? (data.rawDebug as {
                primaryParsed: Record<string, unknown> | null;
                fallbackParsed: Record<string, unknown> | null;
                columnParses?: Array<{
                  date: string | null;
                  startX?: number;
                  endX?: number;
                  parsed: Record<string, unknown> | null;
                }>;
              })
            : null
        );
        setScreenshotState("review");
      } catch {
        setParseError(
          "Something went wrong. Please check your connection and try again, or enter availability manually."
        );
        setScreenshotState("error");
        setApiFailed(true);
        setApiStats(null);
        setDraftStats(null);
        setParseWarnings([]);
        setParseType(null);
        setParseConfidence(null);
        setParseDebug(null);
        setParseRawDebug(null);
        setParsedBusyByDate({});
        setParsedDayCoverage({});
      }
    },
    [previewUrl, recomputeDraftFromParsed, scheduleDays, screenshotWorkingHours]
  );

  useEffect(() => {
    if (screenshotState !== "review") return;
    if (Object.keys(parsedBusyByDate).length === 0 && Object.keys(parsedDayCoverage).length === 0) return;
    recomputeDraftFromParsed(parsedBusyByDate, parsedDayCoverage, screenshotWorkingHours);
  }, [
    parsedBusyByDate,
    parsedDayCoverage,
    recomputeDraftFromParsed,
    screenshotState,
    screenshotWorkingHours,
  ]);

  const hasOverlapWarning = (() => {
    const list = inputTab === "screenshot" && screenshotState === "review" ? draftWindows : windows;
    const byDate = new Map<string, OtherPersonWindow[]>();
    for (const w of list) {
      if (!w.date) continue;
      if (!byDate.has(w.date)) byDate.set(w.date, []);
      byDate.get(w.date)!.push(w);
    }
    for (const arr of Array.from(byDate.values())) {
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          if (rangesOverlap(arr[i], arr[j])) return true;
        }
      }
    }
    return false;
  })();

  const updateWindowToShow =
    inputTab === "screenshot" && screenshotState === "review"
      ? updateDraftWindow
      : updateWindow;
  const removeWindowToShow =
    inputTab === "screenshot" && screenshotState === "review"
      ? removeDraftWindow
      : removeWindow;
  const renderWindowList = (list: Array<OtherPersonWindow | DraftReviewWindow>) => (
    <ul className="space-y-3">
      {list.map((w) => {
        const validationTarget =
          "mappedDate" in w && w.mappedDate != null ? { ...w, date: w.mappedDate } : w;
        const error =
          "mappedDate" in w && w.mappedDate == null
            ? null
            : validateWindow(validationTarget, scheduleDates);
        const mappedDate = "mappedDate" in w ? w.mappedDate : w.date;
        const hasDraftWarning = Boolean(w.draftMeta?.uncertainDate || w.draftMeta?.uncertainTime || (w.draftMeta?.warnings?.length ?? 0) > 0);
        return (
          <li
            key={w.id}
            className={`rounded-xl border-2 bg-white p-3 shadow-sm ${
              hasDraftWarning ? "border-amber-300" : "border-slate-200"
            }`}
          >
            {w.draftMeta && (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {typeof w.draftMeta.overallConfidence === "number" && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    Confidence {(w.draftMeta.overallConfidence * 100).toFixed(0)}%
                  </span>
                )}
                {w.draftMeta.uncertainDate && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                    Uncertain day
                  </span>
                )}
                {w.draftMeta.uncertainTime && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                    Uncertain time
                  </span>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-end gap-2 sm:gap-3">
              <div className="flex-1 min-w-[100px]">
                <label className="sr-only">Day</label>
                {mappedDate ? (
                  <select
                    value={mappedDate}
                    onChange={(e) =>
                      updateWindowToShow(w.id, {
                        date: e.target.value,
                        mappedDate: e.target.value,
                      })
                    }
                    className={inputClass}
                    aria-invalid={!!error}
                  >
                    {scheduleDays.map((d) => (
                      <option key={d.date} value={d.date}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {w.date}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-[90px]">
                <label className="sr-only">Start time</label>
                <input
                  type="time"
                  value={w.start}
                  onChange={(e) => updateWindowToShow(w.id, { start: e.target.value })}
                  className={inputClass}
                  aria-invalid={!!error}
                />
              </div>
              <span className="text-slate-400 text-sm shrink-0">to</span>
              <div className="flex-1 min-w-[90px]">
                <label className="sr-only">End time</label>
                <input
                  type="time"
                  value={w.end}
                  onChange={(e) => updateWindowToShow(w.id, { end: e.target.value })}
                  className={inputClass}
                  aria-invalid={!!error}
                />
              </div>
              <button
                type="button"
                onClick={() => removeWindowToShow(w.id)}
                className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label="Remove this time window"
              >
                <TrashIcon />
              </button>
            </div>
            {error && mappedDate && (
              <p className="text-xs text-red-600 mt-1.5" role="alert">
                {error}
              </p>
            )}
            {!mappedDate && (
              <p className="mt-1.5 text-xs text-slate-500">
                Outside the current scheduling range. This row will be imported as a recurring weekly pattern.
              </p>
            )}
            {!error && w.draftMeta?.warnings && w.draftMeta.warnings.length > 0 && (
              <ul className="mt-2 space-y-1">
                {w.draftMeta.warnings.slice(0, 2).map((warning, index) => (
                  <li key={`${w.id}-warning-${index}`} className="text-xs text-amber-700">
                    {warning}
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <Card
      title="Other person's availability"
      icon={<UserIcon />}
      className="border-2 border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 to-white"
    >
      <p className="mb-6 text-sm text-slate-600">
        Add when the other person is available. We&apos;ll find times that work
        for both of you.
      </p>

      <div className="space-y-7">
        <TimezoneInput
          label="Their time zone (or city)"
          value={zoneB}
          onChange={onZoneBChange}
          placeholder="e.g. Bangkok, EST, or Europe/London"
          error={errorZoneB}
        />

        <div>
          <div className="mb-6 flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setInputTab("weekly")}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                inputTab === "weekly"
                  ? "bg-white border border-slate-200 border-b-0 -mb-px text-emerald-800"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Weekly pattern
            </button>
            <button
              type="button"
              onClick={() => setInputTab("manual")}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                inputTab === "manual"
                  ? "bg-white border border-slate-200 border-b-0 -mb-px text-emerald-800"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Specific dates
            </button>
            <button
              type="button"
              onClick={() => {
                setInputTab("screenshot");
                if (screenshotState === "error") setScreenshotState("idle");
              }}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                inputTab === "screenshot"
                  ? "bg-white border border-slate-200 border-b-0 -mb-px text-emerald-800"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Screenshot import
            </button>
          </div>

          {inputTab === "manual" && (
            <>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Available time windows
                </label>
                <button
                  type="button"
                  onClick={addWindow}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <PlusIcon />
                  Add time window
                </button>
              </div>
              {windows.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 py-8 text-center">
                  <p className="text-sm text-slate-600">
                    No time windows added yet.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Add when the other person is available to find mutual times.
                  </p>
                  <button
                    type="button"
                    onClick={addWindow}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <PlusIcon />
                    Add first window
                  </button>
                </div>
              ) : (
                renderWindowList(windows)
              )}
            </>
          )}

          {inputTab === "weekly" && (
            <div className="space-y-5">
              <p className="text-sm text-slate-600">
                Define recurring weekly availability by weekday. These windows apply to matching days
                in the current scheduling range.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WEEKDAYS.map(({ key, label, short }) => {
                  const dayWindows = weeklyPattern[key] ?? [];
                  return (
                    <div
                      key={key}
                      className="rounded-xl border-2 border-slate-200 bg-white/80 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">
                          {label}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            onWeeklyPatternChange({
                              ...weeklyPattern,
                              [key]: [
                                ...dayWindows,
                                { start: "09:00", end: "17:00" } as TimeWindow,
                              ],
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <PlusIcon />
                          Add window
                        </button>
                      </div>
                      {dayWindows.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          No recurring windows for {short}. Click &quot;Add window&quot; to define one.
                        </p>
                      ) : (
                        <ul className="space-y-1.5">
                          {dayWindows.map((w, idx) => (
                            <li
                              key={`${key}-${idx}`}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="time"
                                value={w.start}
                                onChange={(e) => {
                                  const next = [...dayWindows];
                                  next[idx] = { ...next[idx], start: e.target.value };
                                  onWeeklyPatternChange({
                                    ...weeklyPattern,
                                    [key]: next,
                                  });
                                }}
                                className={inputClass}
                              />
                              <span className="text-slate-400 text-xs shrink-0">
                                to
                              </span>
                              <input
                                type="time"
                                value={w.end}
                                onChange={(e) => {
                                  const next = [...dayWindows];
                                  next[idx] = { ...next[idx], end: e.target.value };
                                  onWeeklyPatternChange({
                                    ...weeklyPattern,
                                    [key]: next,
                                  });
                                }}
                                className={inputClass}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const next = dayWindows.filter((_, i) => i !== idx);
                                  onWeeklyPatternChange({
                                    ...weeklyPattern,
                                    [key]: next,
                                  });
                                }}
                                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                                aria-label={`Remove ${label} window`}
                              >
                                <TrashIcon />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {inputTab === "screenshot" && (
            <>
              <div className="mb-8 space-y-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Working hours baseline
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Screenshot import only detects confirmed busy times. Availability is derived from these weekly working hours.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreenshotWorkingHours(createDefaultScreenshotWorkingHours())}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Reset to 9-5
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {WEEKDAYS.map(({ key, short }) => {
                    const activeWindow = screenshotWorkingHours[key]?.[0] ?? null;
                    return (
                      <div key={`screenshot-hours-${key}`} className="rounded-xl border border-slate-200 bg-white p-3.5">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-800">{short}</p>
                          <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              checked={activeWindow != null}
                              onChange={(e) =>
                                setScreenshotWorkingHours((prev) => ({
                                  ...prev,
                                  [key]: e.target.checked ? [{ start: "09:00", end: "17:00" }] : [],
                                }))
                              }
                            />
                            Use day
                          </label>
                        </div>
                        {activeWindow ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={activeWindow.start}
                              onChange={(e) =>
                                setScreenshotWorkingHours((prev) => ({
                                  ...prev,
                                  [key]: [{ ...activeWindow, start: e.target.value }],
                                }))
                              }
                              className={inputClass}
                            />
                            <span className="text-slate-400 text-xs">to</span>
                            <input
                              type="time"
                              value={activeWindow.end}
                              onChange={(e) =>
                                setScreenshotWorkingHours((prev) => ({
                                  ...prev,
                                  [key]: [{ ...activeWindow, end: e.target.value }],
                                }))
                              }
                              className={inputClass}
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">Ignored when deriving availability.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {screenshotState === "idle" && (
                <div
                  className={`rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
                    isDragging
                      ? "border-emerald-400 bg-emerald-50/50"
                      : "border-slate-300 bg-slate-50/80"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer?.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-slate-300 bg-white/70 text-slate-500">
                    <span className="[&_svg]:h-8 [&_svg]:w-8">
                      <UploadIcon />
                    </span>
                  </div>
                  <p className="mt-5 text-base font-semibold text-slate-700">
                    Drag and drop a screenshot here
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Or choose an image file to detect busy blocks, then derive draft availability from your weekly working hours.
                  </p>
                  <div className="mt-6 mx-auto max-w-sm rounded-lg border border-slate-200 bg-white/60 px-3 py-2.5 text-left">
                    <p className="text-xs font-semibold text-slate-600 mb-1.5">
                      For best results, your screenshot should:
                    </p>
                    <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                      <li>Show a <strong>week view</strong> with day columns (e.g. Sun, Mon, Tue)</li>
                      <li>Include <strong>day headers</strong> at the top (dates or day names visible)</li>
                      <li>Have <strong>clear event blocks</strong> with visible start/end times</li>
                      <li>Be <strong>JPEG, PNG, or WebP</strong> under 10 MB</li>
                    </ul>
                    <p className="text-xs text-slate-500 mt-1.5">
                      Blurry or cropped screenshots may miss some days. You can always add or edit times after.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    <UploadIcon />
                    Choose image
                  </button>
                </div>
              )}

              {screenshotState === "uploading" && (
                <div className="rounded-xl border-2 border-slate-200 bg-slate-50/80 py-10 flex flex-col items-center justify-center gap-3">
                  <LoadingSpinner label="Reading screenshot…" />
                  <p className="text-xs text-slate-500">
                    Extracting confirmed busy times before deriving availability.
                  </p>
                </div>
              )}

              {screenshotState === "review" && (
                <div className="space-y-4">
                  {uploadedFile && (
                    <div className="rounded-xl border-2 border-slate-200 bg-slate-50/80 p-3 flex items-center gap-3">
                      {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- blob URL from user upload, not a static asset
                        <img
                          src={previewUrl}
                          alt="Uploaded screenshot"
                          className="h-14 w-14 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-slate-200 shrink-0 flex items-center justify-center">
                          <UploadIcon />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate" title={uploadedFile.name}>
                          {uploadedFile.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(uploadedFile.size / 1024).toFixed(1)} KB · Used for parsing
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800">
                      Busy times extracted from screenshot
                    </p>
                    <p className="text-xs text-slate-500">
                      Only confirmed busy blocks are used. The availability list below is derived from the working-hours baseline above.
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Confirmed busy intervals
                    </p>
                    {Object.keys(parsedBusyByDate).length > 0 ? (
                      <ul className="mt-2 space-y-2">
                        {Object.entries(parsedBusyByDate).map(([date, intervals]) => (
                          <li
                            key={`busy-${date}`}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{date}</span>
                              {parsedDayCoverage[date] && (
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getCoverageTone(parsedDayCoverage[date])}`}
                                >
                                  {parsedDayCoverage[date]}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-slate-600">
                              {intervals.map((interval) => `${interval.start}-${interval.end}`).join(", ")}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        No confirmed busy intervals were extracted.
                      </p>
                    )}
                  </div>
                  {Object.keys(parsedDayCoverage).length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Day coverage
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(parsedDayCoverage).map(([date, coverage]) => (
                          <li
                            key={`coverage-${date}`}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
                          >
                            <span className="font-medium">{date}</span>
                            <span
                              className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${getCoverageTone(coverage)}`}
                            >
                              {coverage}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {parseType && (
                    <p className="text-xs text-slate-500">
                      Parse mode: {parseType}
                    </p>
                  )}
                  {parseConfidence && (
                    <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-3 text-xs text-slate-600 sm:grid-cols-2">
                      <p>Headers: {(parseConfidence.header_confidence * 100).toFixed(0)}%</p>
                      <p>Time axis: {(parseConfidence.time_axis_confidence * 100).toFixed(0)}%</p>
                      <p>Blocks: {(parseConfidence.block_detection_confidence * 100).toFixed(0)}%</p>
                      <p>Overall: {(parseConfidence.overall_parse_confidence * 100).toFixed(0)}%</p>
                    </div>
                  )}
                  {draftStats && (draftStats.outOfRange > 0 || draftStats.skipped > 0) && (
                    <p className="text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
                      {draftStats.outOfRange > 0 && (
                        <span>
                          {draftStats.outOfRange} detected window{draftStats.outOfRange !== 1 ? "s are" : " is"} outside the current 7-day range and {draftStats.outOfRange !== 1 ? "will" : "will"} be imported as recurring weekly availability.
                        </span>
                      )}
                      {draftStats.outOfRange > 0 && draftStats.skipped > 0 && " "}
                      {draftStats.skipped > 0 && (
                        <span>
                          {draftStats.skipped} could not be parsed (invalid time or format).
                        </span>
                      )}
                    </p>
                  )}
                  {apiStats && apiStats.skipped > 0 && draftWindows.length > 0 && (
                    <p className="text-xs text-slate-500">
                      {apiStats.skipped} raw entr{apiStats.skipped === 1 ? "y" : "ies"} from the image could not be normalized and were skipped.
                    </p>
                  )}
                  {parsePartial && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      We couldn&apos;t confidently parse the entire screenshot. Uncertain days were left blank instead of guessed.
                    </p>
                  )}
                  {parseWarnings.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                        Warnings
                      </p>
                      <ul className="mt-2 space-y-1">
                        {parseWarnings.map((warning, index) => (
                          <li key={`parse-warning-${index}`} className="text-xs text-amber-800">
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {draftStats && draftStats.outOfRange > 0 && (
                    <p className="text-xs text-slate-600">
                      This screenshot appears to be for a different week than the current scheduling window. Confirming will preserve derived availability as recurring weekly pattern entries for those days.
                    </p>
                  )}
                  {parseError && (
                    <p className="text-xs text-slate-600">{parseError}</p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-600">
                      Review the derived availability below, edit anything needed, then confirm to apply exact-date matches and recurring weekday matches.
                    </span>
                    <button
                      type="button"
                      onClick={addDraftWindow}
                      className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <PlusIcon />
                      Add window
                    </button>
                  </div>
                  {draftWindows.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/80 py-6 px-4 text-center space-y-2">
                      <p className="text-sm font-medium text-amber-900">
                        {apiStats && apiStats.totalParsed === 0
                          ? "No confirmed busy times were detected in this image."
                          : draftStats && draftStats.outOfRange > 0
                            ? "Derived availability does not land in the current 7-day range."
                            : "No confirmed availability could be derived from this screenshot."}
                      </p>
                      <p className="text-xs text-amber-800">
                        The screenshot may be too partial or uncertain. You can adjust working hours, try another image, or add times manually.
                      </p>
                      <button
                        type="button"
                        onClick={addDraftWindow}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-xl border-2 border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50"
                      >
                        <PlusIcon />
                        Add availability manually
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                          Derived availability from screenshot + working hours
                        </p>
                      </div>
                      {renderWindowList(draftWindows)}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={confirmDraft}
                      disabled={draftWindows.length === 0}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none"
                      title={draftWindows.length === 0 ? "Add at least one time window to use" : "Save these times and use them for scheduling"}
                    >
                      Confirm draft
                    </button>
                    <button
                      type="button"
                      onClick={discardDraft}
                      className="rounded-xl border-2 border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}

              {screenshotState === "error" && (
                <div className="rounded-xl border-2 border-red-200 bg-red-50/80 py-6 px-4 text-center space-y-3">
                  <p className="text-sm text-red-800 font-medium">
                    {apiFailed
                      ? parseError ?? "We couldn't read this screenshot."
                      : parseError ?? "Something went wrong."}
                  </p>
                  <p className="text-xs text-slate-600">
                    {apiFailed
                      ? "The request failed or the image could not be parsed. Try another image or enter times manually."
                      : "Check the message above and try again or enter availability manually."}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {lastSelectedFile && (
                      <button
                        type="button"
                        onClick={() => handleFileSelect(lastSelectedFile)}
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                      >
                        Retry with same image
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setParseError(null);
                        setScreenshotState("idle");
                        setLastSelectedFile(null);
                        setParseWarnings([]);
                        setParseType(null);
                        setParseConfidence(null);
                        setParseDebug(null);
                        setParseRawDebug(null);
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl);
                          setPreviewUrl(null);
                        }
                        setUploadedFile(null);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Choose different image
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setParseError(null);
                        setScreenshotState("idle");
                        setLastSelectedFile(null);
                        setParseWarnings([]);
                        setParseType(null);
                        setParseConfidence(null);
                        setParseDebug(null);
                        setParseRawDebug(null);
                        setInputTab("manual");
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl);
                          setPreviewUrl(null);
                        }
                        setUploadedFile(null);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Enter availability manually
                    </button>
                  </div>
                </div>
              )}

              {screenshotState === "review" && (parseDebug || parseRawDebug) && (
                <details className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
                  <summary className="cursor-pointer text-xs font-medium text-slate-600">
                    Debug details
                  </summary>
                  {parseDebug && (
                    <pre className="mt-2 overflow-auto whitespace-pre-wrap text-[11px] text-slate-600">
                      {JSON.stringify(parseDebug, null, 2)}
                    </pre>
                  )}
                  {parseRawDebug && (
                    <pre className="mt-3 overflow-auto whitespace-pre-wrap text-[11px] text-slate-600">
                      {JSON.stringify(parseRawDebug, null, 2)}
                    </pre>
                  )}
                </details>
              )}
            </>
          )}

          {hasOverlapWarning &&
            (inputTab === "manual" ? windows : draftWindows).length > 1 && (
              <p className="text-xs text-amber-700 mt-1">
                Some windows on the same day overlap. We&apos;ll still use all of
                them to find slots.
              </p>
            )}
        </div>
      </div>
    </Card>
  );
}
