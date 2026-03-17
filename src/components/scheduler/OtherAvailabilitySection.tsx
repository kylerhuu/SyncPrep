"use client";

import type { OtherPersonWindow, WeeklyPattern } from "@/types";
import type { ScheduleDayOption } from "@/lib/availability-draft";
import { OtherPersonAvailabilitySection as OtherPersonAvailabilityEditor } from "@/components/scheduler/OtherPersonAvailabilitySection";

interface OtherAvailabilitySectionProps {
  scheduleDays: ScheduleDayOption[];
  zoneB: string;
  windows: OtherPersonWindow[];
  weeklyPattern: WeeklyPattern;
  onZoneBChange: (value: string) => void;
  onWindowsChange: (windows: OtherPersonWindow[]) => void;
  onWeeklyPatternChange: (pattern: WeeklyPattern) => void;
}

function StepHeader({
  step,
  title,
  description,
  status,
}: {
  step: string;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200/80 px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
          {step}
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {status}
        </span>
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
    </div>
  );
}

function getStatusText(zoneB: string, windows: OtherPersonWindow[], weeklyPattern: WeeklyPattern) {
  const recurringCount = Object.values(weeklyPattern).reduce(
    (count, dayWindows) => count + dayWindows.length,
    0
  );
  if (!zoneB.trim()) return "Waiting for time zone";
  if (windows.length > 0 || recurringCount > 0) return "Availability added";
  return "Choose an input mode";
}

export function OtherAvailabilitySection({
  scheduleDays,
  zoneB,
  windows,
  weeklyPattern,
  onZoneBChange,
  onWindowsChange,
  onWeeklyPatternChange,
}: OtherAvailabilitySectionProps) {
  return (
    <section className="schedule-medium-panel overflow-hidden rounded-[28px] border border-slate-700 bg-slate-900/70 shadow-sm">
      <StepHeader
        step="Step 2 of 4"
        title="Their availability"
        description="Collect the other person's time zone and availability using a weekly pattern, specific dates, or a screenshot import."
        status={getStatusText(zoneB, windows, weeklyPattern)}
      />
      <div className="px-6 py-6 sm:px-8 sm:py-8">
        <div className="rounded-3xl border border-slate-700 bg-slate-900/70 shadow-[0_14px_28px_-18px_rgba(15,23,42,0.85)]">
          <OtherPersonAvailabilityEditor
            scheduleDays={scheduleDays}
            zoneB={zoneB}
            onZoneBChange={onZoneBChange}
            windows={windows}
            onWindowsChange={onWindowsChange}
            weeklyPattern={weeklyPattern}
            onWeeklyPatternChange={onWeeklyPatternChange}
          />
        </div>
      </div>
    </section>
  );
}
