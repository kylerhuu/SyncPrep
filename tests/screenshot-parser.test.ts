import test from "node:test";
import assert from "node:assert/strict";
import fixtureMarch2026Week from "./fixtures/google-calendar-march-2026-week.json";
import {
  validateScreenshotBusyAnalysis,
  type ScreenshotVisionAnalysis,
  type ScheduleDayOption,
} from "../src/lib/screenshot-parse";
import {
  createDefaultScreenshotWorkingHours,
  deriveAvailabilityFromBusyMap,
} from "../src/lib/screenshot-availability";

const scheduleDays: ScheduleDayOption[] = [
  { date: "2025-03-10", label: "Mon Mar 10" },
  { date: "2025-03-11", label: "Tue Mar 11" },
  { date: "2025-03-12", label: "Wed Mar 12" },
  { date: "2025-03-13", label: "Thu Mar 13" },
  { date: "2025-03-14", label: "Fri Mar 14" },
  { date: "2025-03-15", label: "Sat Mar 15" },
  { date: "2025-03-16", label: "Sun Mar 16" },
];

test("accepts a confident structured weekly calendar busy parse", () => {
  const analysis: ScreenshotVisionAnalysis = {
    layout: { kind: "week_calendar", confidence: 0.92, cropped: false },
    headers: [
      { text: "Mon", startX: 0.12, endX: 0.24, confidence: 0.95, resolvedDate: "2025-03-10", resolvedDateConfidence: 0.94 },
      { text: "Tue", startX: 0.25, endX: 0.37, confidence: 0.93, resolvedDate: "2025-03-11", resolvedDateConfidence: 0.91 },
      { text: "Wed", startX: 0.38, endX: 0.5, confidence: 0.9, resolvedDate: "2025-03-12", resolvedDateConfidence: 0.9 },
    ],
    timeAxis: {
      detected: true,
      confidence: 0.88,
      labels: [
        { text: "9 AM", time: "09:00", y: 0.2, confidence: 0.9 },
        { text: "1 PM", time: "13:00", y: 0.6, confidence: 0.86 },
      ],
    },
    busyBlocks: [
      {
        x: 0.15,
        y: 0.3,
        width: 0.08,
        height: 0.1,
        dayColumnIndex: 0,
        dateConfidence: 0.9,
        timeConfidence: 0.88,
        blockConfidence: 0.84,
        source: "busy",
      },
    ],
    warnings: [],
  };

  const result = validateScreenshotBusyAnalysis(analysis, scheduleDays);
  assert.equal(result.partial, false);
  assert.equal(result.parseType, "full-week draft");
  assert.equal(Object.keys(result.busyByDate).length >= 1, true);
  assert.equal(Array.isArray(result.busyByDate["2025-03-10"]), true);
});

test("marks a cropped one-day screenshot as single-day partial parse", () => {
  const analysis: ScreenshotVisionAnalysis = {
    layout: { kind: "single_day_calendar", confidence: 0.84, cropped: true },
    headers: [
      { text: "Mon", startX: 0.2, endX: 0.42, confidence: 0.82, resolvedDate: "2025-03-10", resolvedDateConfidence: 0.8 },
    ],
    timeAxis: {
      detected: true,
      confidence: 0.8,
      labels: [
        { text: "9 AM", time: "09:00", y: 0.2, confidence: 0.84 },
        { text: "1 PM", time: "13:00", y: 0.6, confidence: 0.8 },
      ],
    },
    busyBlocks: [
      {
        x: 0.24,
        y: 0.35,
        width: 0.1,
        height: 0.08,
        source: "busy",
        dateConfidence: 0.82,
        timeConfidence: 0.81,
        blockConfidence: 0.76,
      },
    ],
  };

  const result = validateScreenshotBusyAnalysis(analysis, scheduleDays);
  assert.equal(result.partial, true);
  assert.equal(result.parseType, "single-day partial parse");
  assert.match(result.warnings.join(" "), /single-day partial parse|cropped/i);
});

test("returns a partial result when weekday headers are blurry", () => {
  const analysis: ScreenshotVisionAnalysis = {
    layout: { kind: "week_calendar", confidence: 0.73, cropped: false },
    headers: [
      { text: "M?", startX: 0.12, endX: 0.24, confidence: 0.42, resolvedDate: "2025-03-10", resolvedDateConfidence: 0.44 },
      { text: "T?", startX: 0.25, endX: 0.37, confidence: 0.4, resolvedDate: "2025-03-11", resolvedDateConfidence: 0.43 },
    ],
    timeAxis: {
      detected: true,
      confidence: 0.82,
      labels: [
        { text: "9 AM", time: "09:00", y: 0.2, confidence: 0.85 },
        { text: "1 PM", time: "13:00", y: 0.6, confidence: 0.85 },
      ],
    },
    busyBlocks: [
      {
        x: 0.15,
        y: 0.28,
        width: 0.08,
        height: 0.08,
        source: "busy",
        dateConfidence: 0.45,
        timeConfidence: 0.82,
        blockConfidence: 0.7,
      },
    ],
  };

  const result = validateScreenshotBusyAnalysis(analysis, scheduleDays);
  assert.equal(result.partial, true);
  assert.match(result.warnings.join(" "), /Fewer than 3 day columns/i);
});

test("does not produce a confident week parse when the time axis is missing", () => {
  const analysis: ScreenshotVisionAnalysis = {
    layout: { kind: "week_calendar", confidence: 0.8, cropped: false },
    headers: [
      { text: "Mon", startX: 0.12, endX: 0.24, confidence: 0.9, resolvedDate: "2025-03-10", resolvedDateConfidence: 0.88 },
      { text: "Tue", startX: 0.25, endX: 0.37, confidence: 0.89, resolvedDate: "2025-03-11", resolvedDateConfidence: 0.87 },
      { text: "Wed", startX: 0.38, endX: 0.5, confidence: 0.88, resolvedDate: "2025-03-12", resolvedDateConfidence: 0.86 },
    ],
    timeAxis: { detected: false, confidence: 0.2, labels: [] },
    busyBlocks: [
      {
        x: 0.16,
        y: 0.35,
        width: 0.09,
        height: 0.1,
        source: "busy",
        dateConfidence: 0.88,
        timeConfidence: 0.4,
        blockConfidence: 0.73,
      },
    ],
  };

  const result = validateScreenshotBusyAnalysis(analysis, scheduleDays);
  assert.equal(result.partial, true);
  assert.match(result.warnings.join(" "), /Time labels were missing or ambiguous/i);
});

test("flags overlapping ambiguous blocks as partial", () => {
  const analysis: ScreenshotVisionAnalysis = {
    layout: { kind: "week_calendar", confidence: 0.88, cropped: false },
    headers: [
      { text: "Mon", startX: 0.12, endX: 0.24, confidence: 0.94, resolvedDate: "2025-03-10", resolvedDateConfidence: 0.92 },
      { text: "Tue", startX: 0.25, endX: 0.37, confidence: 0.91, resolvedDate: "2025-03-11", resolvedDateConfidence: 0.9 },
      { text: "Wed", startX: 0.38, endX: 0.5, confidence: 0.9, resolvedDate: "2025-03-12", resolvedDateConfidence: 0.88 },
    ],
    timeAxis: {
      detected: true,
      confidence: 0.87,
      labels: [
        { text: "9 AM", time: "09:00", y: 0.2, confidence: 0.9 },
        { text: "1 PM", time: "13:00", y: 0.6, confidence: 0.88 },
      ],
    },
    busyIntervals: [
      {
        date: "2025-03-10",
        start: "12:00",
        end: "11:00",
        dateConfidence: 0.9,
        timeConfidence: 0.9,
        blockConfidence: 0.8,
      },
    ],
  };

  const result = validateScreenshotBusyAnalysis(analysis, scheduleDays);
  assert.equal(result.partial, true);
  assert.equal(Object.keys(result.busyByDate).length, 0);
});

test("merges geometry-derived and explicit busy intervals instead of dropping later blocks", () => {
  const analysis: ScreenshotVisionAnalysis = {
    layout: { kind: "week_calendar", confidence: 0.94, cropped: false },
    headers: [
      { text: "Mon", startX: 0.12, endX: 0.24, confidence: 0.95, resolvedDate: "2025-03-10", resolvedDateConfidence: 0.95 },
      { text: "Tue", startX: 0.25, endX: 0.37, confidence: 0.95, resolvedDate: "2025-03-11", resolvedDateConfidence: 0.95 },
      { text: "Wed", startX: 0.38, endX: 0.5, confidence: 0.95, resolvedDate: "2025-03-12", resolvedDateConfidence: 0.95 },
    ],
    timeAxis: {
      detected: true,
      confidence: 0.9,
      labels: [
        { text: "11 AM", time: "11:00", y: 0.2, confidence: 0.9 },
        { text: "1 PM", time: "13:00", y: 0.4, confidence: 0.9 },
        { text: "4 PM", time: "16:00", y: 0.7, confidence: 0.9 },
        { text: "6 PM", time: "18:00", y: 0.9, confidence: 0.9 },
      ],
    },
    busyBlocks: [
      {
        x: 0.27,
        y: 0.2,
        width: 0.08,
        height: 0.12,
        dayColumnIndex: 1,
        dateConfidence: 0.9,
        timeConfidence: 0.86,
        blockConfidence: 0.84,
        source: "busy",
      },
    ],
    busyIntervals: [
      {
        date: "2025-03-11",
        start: "12:30",
        end: "13:50",
        dateConfidence: 0.92,
        timeConfidence: 0.92,
        blockConfidence: 0.8,
        overallConfidence: 0.88,
      },
      {
        date: "2025-03-11",
        start: "16:00",
        end: "17:20",
        dateConfidence: 0.92,
        timeConfidence: 0.92,
        blockConfidence: 0.8,
        overallConfidence: 0.88,
      },
    ],
  };

  const result = validateScreenshotBusyAnalysis(analysis, scheduleDays);
  assert.deepEqual(
    result.busyByDate["2025-03-11"]?.map((interval) => [interval.start, interval.end]),
    [
      ["11:00", "12:10"],
      ["12:30", "13:50"],
      ["16:00", "17:20"],
    ]
  );
});

test("derives availability from confirmed busy times and working hours", () => {
  const busyParse = validateScreenshotBusyAnalysis(fixtureMarch2026Week as ScreenshotVisionAnalysis, scheduleDays);
  const derived = deriveAvailabilityFromBusyMap({
    busyByDate: busyParse.busyByDate,
    dayCoverage: busyParse.dayCoverage,
    workingHours: createDefaultScreenshotWorkingHours(),
  });

  assert.equal(busyParse.partial, false);
  assert.equal(Object.keys(busyParse.busyByDate).includes("2026-03-17"), true);
  assert.equal(derived.draft.some((entry) => entry.date === "2026-03-17"), true);
  assert.equal(derived.draft.every((entry) => /^2026-03-/.test(entry.date)), true);
});
