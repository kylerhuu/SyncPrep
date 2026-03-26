"use client";

import type { OtherPersonWindow, WeeklyPattern } from "@/types";
import type { ScheduleDayOption } from "@/lib/availability-draft";
import { OtherPersonAvailabilitySection as OtherPersonAvailabilityEditor } from "@/components/scheduler/OtherPersonAvailabilitySection";
import { Users } from "lucide-react";

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
    <div className="flex flex-col gap-4 border-b border-[var(--border)] px-6 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="step-badge step-badge-small">2</span>
        <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
          {step}
        </span>
        <span className={`ml-auto inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          status.includes("added") 
            ? "bg-green-500/15 text-green-400" 
            : "bg-[var(--accent-soft)] text-[var(--accent)]"
        }`}>
          {status}
        </span>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--foreground-muted)] leading-relaxed">
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
    <section className="section-card">
      <StepHeader
        step="Step 2 of 4"
        title="Their availability"
        description="Add the other person&apos;s time zone and availability using a weekly pattern or specific dates."
        status={getStatusText(zoneB, windows, weeklyPattern)}
      />
      <div className="px-6 py-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]">
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
