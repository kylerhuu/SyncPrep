"use client";

import { useCallback, useRef, useState } from "react";
import type { OtherPersonWindow, WeeklyPattern, Weekday, TimeWindow } from "@/types";
import { validateTimeWindow } from "@/lib/timezone";
import { isValidZone } from "@/lib/timezone";
import { normalizeDraftToWindows, type NormalizeDraftStats } from "@/lib/availability-draft";
import type { ScheduleDayOption } from "@/lib/availability-draft";
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

type InputTab = "manual" | "screenshot";
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

  const [inputTab, setInputTab] = useState<InputTabExtended>("manual");
  const [screenshotState, setScreenshotState] = useState<ScreenshotState>("idle");
  const [draftWindows, setDraftWindows] = useState<OtherPersonWindow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsePartial, setParsePartial] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lastSelectedFile, setLastSelectedFile] = useState<File | null>(null);
  const [apiStats, setApiStats] = useState<{ totalParsed: number; normalized: number; skipped: number } | null>(null);
  const [draftStats, setDraftStats] = useState<NormalizeDraftStats | null>(null);
  const [apiFailed, setApiFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    (id: string, patch: Partial<Omit<OtherPersonWindow, "id">>) => {
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
      { id: nextId(), date: firstDate, start: "09:00", end: "17:00" },
    ]);
  }, [scheduleDays]);

  const confirmDraft = useCallback(() => {
    onWindowsChange([...windows, ...draftWindows]);
    setDraftWindows([]);
    setScreenshotState("idle");
    setParseError(null);
    setParsePartial(false);
    setUploadedFile(null);
    setDraftStats(null);
    setApiStats(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setInputTab("manual");
  }, [windows, draftWindows, onWindowsChange, previewUrl]);

  const discardDraft = useCallback(() => {
    setDraftWindows([]);
    setScreenshotState("idle");
    setParseError(null);
    setParsePartial(false);
    setUploadedFile(null);
    setDraftStats(null);
    setApiStats(null);
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
        const data = await res.json().catch(() => ({}));
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
          return;
        }
        const rawDraft = Array.isArray(data.draft) ? data.draft : [];
        const { windows: normalizedWindows, stats: normStats } = normalizeDraftToWindows(rawDraft, scheduleDays);
        setDraftWindows(normalizedWindows);
        setDraftStats(normStats);
        setApiStats(data.stats ?? null);
        setParsePartial(Boolean(data.partial));
        setParseError(typeof data.message === "string" ? data.message : null);
        setScreenshotState("review");
      } catch {
        setParseError(
          "Something went wrong. Please check your connection and try again, or enter availability manually."
        );
        setScreenshotState("error");
        setApiFailed(true);
        setApiStats(null);
        setDraftStats(null);
      }
    },
    [scheduleDays, previewUrl]
  );

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

  const windowsToShow =
    inputTab === "screenshot" && screenshotState === "review"
      ? draftWindows
      : windows;
  const setWindowsToShow =
    inputTab === "screenshot" && screenshotState === "review"
      ? setDraftWindows
      : onWindowsChange;
  const updateWindowToShow =
    inputTab === "screenshot" && screenshotState === "review"
      ? updateDraftWindow
      : updateWindow;
  const removeWindowToShow =
    inputTab === "screenshot" && screenshotState === "review"
      ? removeDraftWindow
      : removeWindow;
  const addWindowToShow =
    inputTab === "screenshot" && screenshotState === "review"
      ? addDraftWindow
      : addWindow;

  const renderWindowList = (list: OtherPersonWindow[]) => (
    <ul className="space-y-3">
      {list.map((w) => {
        const error = validateWindow(w, scheduleDates);
        return (
          <li
            key={w.id}
            className="rounded-xl border-2 border-slate-200 bg-white p-3 shadow-sm"
          >
            <div className="flex flex-wrap items-end gap-2 sm:gap-3">
              <div className="flex-1 min-w-[100px]">
                <label className="sr-only">Day</label>
                <select
                  value={w.date}
                  onChange={(e) => updateWindowToShow(w.id, { date: e.target.value })}
                  className={inputClass}
                  aria-invalid={!!error}
                >
                  {scheduleDays.map((d) => (
                    <option key={d.date} value={d.date}>
                      {d.label}
                    </option>
                  ))}
                </select>
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
            {error && (
              <p className="text-xs text-red-600 mt-1.5" role="alert">
                {error}
              </p>
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
      <p className="text-sm text-slate-600 mb-4">
        Add when the other person is available. We&apos;ll find times that work
        for both of you.
      </p>

      <div className="space-y-4">
        <TimezoneInput
          label="Their time zone (or city)"
          value={zoneB}
          onChange={onZoneBChange}
          placeholder="e.g. Bangkok, EST, or Europe/London"
          error={errorZoneB}
        />

        <div>
          <div className="flex border-b border-slate-200 mb-4">
            <button
              type="button"
              onClick={() => setInputTab("manual")}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                inputTab === "manual"
                  ? "bg-white border border-slate-200 border-b-0 -mb-px text-emerald-800"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Manual entry
            </button>
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
              Screenshot upload
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
            <div className="space-y-3">
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
              {screenshotState === "idle" && (
                <div
                  className={`rounded-xl border-2 border-dashed py-10 px-4 text-center transition-colors ${
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
                  <UploadIcon />
                  <p className="text-sm font-medium text-slate-700 mt-2">
                    Upload a screenshot to generate draft availability
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    We&apos;ll detect time windows for you to review and edit before using.
                  </p>
                  <div className="mt-4 mx-auto max-w-sm text-left rounded-lg border border-slate-200 bg-white/60 px-3 py-2.5">
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
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
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
                    Review detected times before using them.
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
                  <p className="text-sm font-medium text-slate-700">
                    {draftWindows.length > 0
                      ? "We detected these time windows from the screenshot"
                      : "Parsing complete"}
                  </p>
                  {draftStats && (draftStats.outOfRange > 0 || draftStats.skipped > 0) && (
                    <p className="text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
                      {draftStats.outOfRange > 0 && (
                        <span>
                          {draftStats.outOfRange} detected window{draftStats.outOfRange !== 1 ? "s were" : " was"} outside the current 7-day range and {draftStats.outOfRange !== 1 ? "were" : "was"} not included.
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
                      We couldn&apos;t confidently extract everything from this screenshot. Please review and edit the entries below, or add missing times manually.
                    </p>
                  )}
                  {parseError && (
                    <p className="text-xs text-slate-600">{parseError}</p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-600">
                      Edit any entry, then confirm to use in scheduling.
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
                          ? "No availability was detected in this image."
                          : draftStats && draftStats.outOfRange > 0
                            ? "No detected windows fell within the next 7 days."
                            : "No time windows were detected for the next 7 days."}
                      </p>
                      <p className="text-xs text-amber-800">
                        Try another screenshot, or add times manually above. You can also use the Manual entry tab.
                      </p>
                      <button
                        type="button"
                        onClick={addDraftWindow}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-xl border-2 border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50"
                      >
                        <PlusIcon />
                        Add window manually
                      </button>
                    </div>
                  ) : (
                    renderWindowList(draftWindows)
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={confirmDraft}
                      disabled={draftWindows.length === 0}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none"
                      title={draftWindows.length === 0 ? "Add at least one time window to use" : "Save these times and use them for scheduling"}
                    >
                      Use these times
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
