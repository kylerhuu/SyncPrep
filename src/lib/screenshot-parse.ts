export interface ScheduleDayOption {
  date: string;
  label: string;
}

export type ScreenshotLayoutKind =
  | "week_calendar"
  | "single_day_calendar"
  | "availability_list"
  | "unknown";

export type DayCoverage = "confirmed" | "partial" | "unknown";

export interface ConfidenceBreakdown {
  header_confidence: number;
  time_axis_confidence: number;
  block_detection_confidence: number;
  overall_parse_confidence: number;
}

export interface ParsedHeader {
  text: string;
  columnIndex?: number;
  startX?: number;
  endX?: number;
  confidence: number;
  resolvedDate?: string | null;
  resolvedDateConfidence?: number;
}

export interface ParsedTimeLabel {
  text: string;
  time?: string | null;
  y?: number;
  confidence: number;
}

export interface ParsedBusyBlock {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  dayColumnIndex?: number | null;
  headerText?: string | null;
  start?: string | null;
  end?: string | null;
  date?: string | null;
  dateConfidence?: number;
  timeConfidence?: number;
  blockConfidence?: number;
  source?: "busy" | "unknown";
  warnings?: string[];
}

export interface ParsedBusyInterval {
  date: string;
  start: string;
  end: string;
  dateConfidence?: number;
  timeConfidence?: number;
  blockConfidence?: number;
  overallConfidence?: number;
  warnings?: string[];
}

export interface ScreenshotVisionAnalysis {
  layout?: {
    kind?: ScreenshotLayoutKind;
    confidence?: number;
    cropped?: boolean;
  };
  headers?: ParsedHeader[];
  timeAxis?: {
    detected?: boolean;
    confidence?: number;
    labels?: ParsedTimeLabel[];
  };
  busyBlocks?: ParsedBusyBlock[];
  busyIntervals?: ParsedBusyInterval[];
  warnings?: string[];
}

export interface ScreenshotParseDebug {
  detectedHeaders: ParsedHeader[];
  detectedColumnBoundaries: Array<{
    columnIndex: number;
    startX?: number;
    endX?: number;
    headerText: string;
    confidence: number;
    resolvedDate?: string | null;
  }>;
  detectedTimeLabels: ParsedTimeLabel[];
  detectedBusyBlocks: ParsedBusyBlock[];
  parseWarnings: string[];
}

export interface ScreenshotBusyParseResult {
  busyByDate: Record<string, ParsedBusyInterval[]>;
  dayCoverage: Record<string, DayCoverage>;
  partial: boolean;
  warnings: string[];
  confidence: ConfidenceBreakdown;
  parseType: "full-week draft" | "single-day partial parse" | "partial draft";
  debug: ScreenshotParseDebug;
}

interface ResolvedColumn {
  columnIndex: number;
  startX: number;
  endX: number;
  date: string | null;
  headerText: string;
  confidence: number;
}

function clamp01(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isIsoDate(value: string | null | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTime(value: string | null | undefined): value is string {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function minutesToTime(totalMinutes: number): string {
  const bounded = Math.max(0, Math.min(24 * 60, Math.round(totalMinutes)));
  const hours = Math.floor(bounded / 60);
  const minutes = bounded % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function snapMinutes(totalMinutes: number, step = 5): number {
  return Math.round(totalMinutes / step) * step;
}

function mergeIntervals(intervals: ParsedBusyInterval[]): ParsedBusyInterval[] {
  const sorted = [...intervals].sort((a, b) => a.start.localeCompare(b.start));
  const merged: ParsedBusyInterval[] = [];
  for (const interval of sorted) {
    if (merged.length === 0) {
      merged.push(interval);
      continue;
    }
    const prev = merged[merged.length - 1];
    if (timeToMinutes(interval.start) <= timeToMinutes(prev.end)) {
      prev.end =
        timeToMinutes(interval.end) > timeToMinutes(prev.end) ? interval.end : prev.end;
      prev.overallConfidence = average([
        clamp01(prev.overallConfidence),
        clamp01(interval.overallConfidence),
      ]);
      prev.warnings = Array.from(new Set([...(prev.warnings ?? []), ...(interval.warnings ?? [])]));
    } else {
      merged.push(interval);
    }
  }
  return merged;
}

function mergeIntervalSources(
  explicitIntervals: ParsedBusyInterval[],
  geometryIntervals: ParsedBusyInterval[]
): ParsedBusyInterval[] {
  const merged = new Map<string, ParsedBusyInterval>();
  for (const interval of [...explicitIntervals, ...geometryIntervals]) {
    const key = `${interval.date}:${interval.start}:${interval.end}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...interval, warnings: interval.warnings ?? [] });
      continue;
    }
    merged.set(key, {
      ...existing,
      dateConfidence: Math.max(existing.dateConfidence ?? 0, interval.dateConfidence ?? 0),
      timeConfidence: Math.max(existing.timeConfidence ?? 0, interval.timeConfidence ?? 0),
      blockConfidence: Math.max(existing.blockConfidence ?? 0, interval.blockConfidence ?? 0),
      overallConfidence: Math.max(existing.overallConfidence ?? 0, interval.overallConfidence ?? 0),
      warnings: Array.from(new Set([...(existing.warnings ?? []), ...(interval.warnings ?? [])])),
    });
  }
  return Array.from(merged.values());
}

function parseYAxisLabels(labels: ParsedTimeLabel[]): Array<{ y: number; minutes: number; confidence: number }> {
  return labels
    .filter((label) => typeof label.y === "number" && isTime(label.time))
    .map((label) => ({
      y: Math.max(0, Math.min(1, label.y!)),
      minutes: timeToMinutes(label.time!),
      confidence: clamp01(label.confidence),
    }))
    .sort((a, b) => a.y - b.y);
}

function mapYToMinutes(
  y: number,
  labels: Array<{ y: number; minutes: number; confidence: number }>
): { minutes: number | null; confidence: number } {
  if (labels.length < 2) return { minutes: null, confidence: 0 };
  const normalizedY = Math.max(0, Math.min(1, y));
  for (let i = 0; i < labels.length - 1; i++) {
    const current = labels[i];
    const next = labels[i + 1];
    if (normalizedY < current.y || normalizedY > next.y) continue;
    const ySpan = next.y - current.y;
    const minuteSpan = next.minutes - current.minutes;
    if (ySpan <= 0 || minuteSpan <= 0) continue;
    const ratio = (normalizedY - current.y) / ySpan;
    return {
      minutes: current.minutes + minuteSpan * ratio,
      confidence: average([current.confidence, next.confidence]),
    };
  }
  return { minutes: null, confidence: 0 };
}

function resolveColumns(headers: ParsedHeader[]): ResolvedColumn[] {
  return headers
    .filter(
      (header) =>
        typeof header.startX === "number" &&
        typeof header.endX === "number" &&
        header.endX > header.startX
    )
    .map((header, index) => ({
      columnIndex: header.columnIndex ?? index,
      startX: Math.max(0, Math.min(1, header.startX!)),
      endX: Math.max(0, Math.min(1, header.endX!)),
      date: isIsoDate(header.resolvedDate) ? header.resolvedDate : null,
      headerText: header.text,
      confidence: average([clamp01(header.confidence), clamp01(header.resolvedDateConfidence)]),
    }))
    .sort((a, b) => a.startX - b.startX);
}

function findColumnForBlock(block: ParsedBusyBlock, columns: ResolvedColumn[]): ResolvedColumn | null {
  if (typeof block.dayColumnIndex === "number") {
    const byIndex = columns.find((column) => column.columnIndex === block.dayColumnIndex);
    if (byIndex) return byIndex;
  }
  if (typeof block.x !== "number" || typeof block.width !== "number") return null;
  const centerX = block.x + block.width / 2;
  return (
    columns.find((column) => centerX >= column.startX && centerX <= column.endX) ?? null
  );
}

function normalizeExplicitBusyIntervals(intervals: ParsedBusyInterval[]): ParsedBusyInterval[] {
  return intervals
    .filter(
      (interval) =>
        isIsoDate(interval.date) &&
        isTime(interval.start) &&
        isTime(interval.end) &&
        interval.start < interval.end
    )
    .map((interval) => ({
      ...interval,
      start: minutesToTime(snapMinutes(timeToMinutes(interval.start))),
      end: minutesToTime(snapMinutes(timeToMinutes(interval.end))),
      overallConfidence: clamp01(
        interval.overallConfidence ??
          average([
            clamp01(interval.dateConfidence),
            clamp01(interval.timeConfidence),
            clamp01(interval.blockConfidence),
          ])
      ),
      warnings: interval.warnings ?? [],
    }));
}

function deriveBusyIntervalsFromGeometry(
  columns: ResolvedColumn[],
  axisLabels: Array<{ y: number; minutes: number; confidence: number }>,
  busyBlocks: ParsedBusyBlock[],
  warnings: string[]
): ParsedBusyInterval[] {
  const derived: ParsedBusyInterval[] = [];

  for (const block of busyBlocks) {
    const column = findColumnForBlock(block, columns);
    if (!column?.date) continue;

    let startMinutes = isTime(block.start) ? timeToMinutes(block.start) : null;
    let endMinutes = isTime(block.end) ? timeToMinutes(block.end) : null;
    let timeConfidence = clamp01(block.timeConfidence);

    if ((startMinutes == null || endMinutes == null) && typeof block.y === "number" && typeof block.height === "number") {
      const startMapped = mapYToMinutes(block.y, axisLabels);
      const endMapped = mapYToMinutes(block.y + block.height, axisLabels);
      startMinutes = startMapped.minutes;
      endMinutes = endMapped.minutes;
      timeConfidence = average([timeConfidence, startMapped.confidence, endMapped.confidence]);
    }

    if (startMinutes == null || endMinutes == null || endMinutes <= startMinutes) {
      warnings.push("Skipped a busy block with ambiguous time bounds.");
      continue;
    }

    const overallConfidence = average([
      column.confidence,
      timeConfidence,
      clamp01(block.blockConfidence),
    ]);
    if (overallConfidence < 0.58) continue;

    derived.push({
      date: column.date,
      start: minutesToTime(snapMinutes(startMinutes)),
      end: minutesToTime(snapMinutes(endMinutes)),
      dateConfidence: column.confidence,
      timeConfidence,
      blockConfidence: clamp01(block.blockConfidence),
      overallConfidence,
      warnings: block.warnings ?? [],
    });
  }

  return derived;
}

function buildBusyByDate(intervals: ParsedBusyInterval[]): Record<string, ParsedBusyInterval[]> {
  const grouped = new Map<string, ParsedBusyInterval[]>();
  for (const interval of intervals) {
    grouped.set(interval.date, [...(grouped.get(interval.date) ?? []), interval]);
  }
  return Object.fromEntries(
    Array.from(grouped.entries()).map(([date, items]) => [date, mergeIntervals(items)])
  );
}

function buildDayCoverage(
  columns: ResolvedColumn[],
  layoutKind: ScreenshotLayoutKind | undefined,
  cropped: boolean | undefined
): Record<string, DayCoverage> {
  const coverage: Record<string, DayCoverage> = {};
  for (const column of columns) {
    if (!column.date) continue;
    coverage[column.date] =
      layoutKind === "single_day_calendar" || cropped || column.confidence < 0.8
        ? "partial"
        : "confirmed";
  }
  return coverage;
}

export function validateScreenshotBusyAnalysis(
  analysis: ScreenshotVisionAnalysis,
  _scheduleDays: ScheduleDayOption[]
): ScreenshotBusyParseResult {
  const warnings = [...(analysis.warnings ?? [])];
  const headers = Array.isArray(analysis.headers) ? analysis.headers : [];
  const timeLabels = Array.isArray(analysis.timeAxis?.labels) ? analysis.timeAxis.labels : [];
  const busyBlocks = Array.isArray(analysis.busyBlocks) ? analysis.busyBlocks : [];
  const modelIntervals = Array.isArray(analysis.busyIntervals) ? analysis.busyIntervals : [];

  const columns = resolveColumns(headers);
  const confidentColumns = columns.filter((column) => column.date && column.confidence >= 0.72);
  const axisLabels = parseYAxisLabels(timeLabels);
  const explicitIntervals = normalizeExplicitBusyIntervals(modelIntervals);
  const geometryIntervals =
    confidentColumns.length >= 3 && axisLabels.length >= 2
      ? deriveBusyIntervalsFromGeometry(confidentColumns, axisLabels, busyBlocks, warnings)
      : [];
  const intervals = mergeIntervalSources(explicitIntervals, geometryIntervals);

  if (confidentColumns.length < 3) {
    warnings.push("Fewer than 3 day columns were confidently detected.");
  }
  if (axisLabels.length < 2) {
    warnings.push("Time labels were missing or ambiguous.");
  }
  if (analysis.layout?.cropped) {
    warnings.push("The screenshot appears cropped or partial.");
  }

  const headerConfidence = average(confidentColumns.map((column) => column.confidence));
  const timeAxisConfidence = average([
    clamp01(analysis.timeAxis?.confidence),
    average(axisLabels.map((label) => label.confidence)),
  ]);
  const blockDetectionConfidence = average(
    intervals.map((interval) => clamp01(interval.overallConfidence))
  );
  const overallParseConfidence = average([
    clamp01(analysis.layout?.confidence),
    headerConfidence,
    timeAxisConfidence,
    blockDetectionConfidence,
  ]);

  const parseType: ScreenshotBusyParseResult["parseType"] =
    columns.length <= 1 || analysis.layout?.kind === "single_day_calendar"
      ? "single-day partial parse"
      : confidentColumns.length >= 3 && axisLabels.length >= 2 && overallParseConfidence >= 0.7
        ? "full-week draft"
        : "partial draft";

  const busyByDate = buildBusyByDate(intervals);
  const dayCoverage = buildDayCoverage(columns, analysis.layout?.kind, analysis.layout?.cropped);

  return {
    busyByDate,
    dayCoverage,
    partial: parseType !== "full-week draft" || warnings.length > 0,
    warnings: Array.from(new Set(warnings)),
    confidence: {
      header_confidence: Number(headerConfidence.toFixed(3)),
      time_axis_confidence: Number(timeAxisConfidence.toFixed(3)),
      block_detection_confidence: Number(blockDetectionConfidence.toFixed(3)),
      overall_parse_confidence: Number(overallParseConfidence.toFixed(3)),
    },
    parseType,
    debug: {
      detectedHeaders: headers,
      detectedColumnBoundaries: columns.map((column) => ({
        columnIndex: column.columnIndex,
        startX: column.startX,
        endX: column.endX,
        headerText: column.headerText,
        confidence: column.confidence,
        resolvedDate: column.date,
      })),
      detectedTimeLabels: timeLabels,
      detectedBusyBlocks: busyBlocks,
      parseWarnings: Array.from(new Set(warnings)),
    },
  };
}
