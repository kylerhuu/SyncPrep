"use client";

import type { MeetingDurationMinutes } from "@/lib/timezone";

const LABELS: Record<MeetingDurationMinutes, string> = {
  30: "30 minutes",
  60: "1 hour",
  90: "1.5 hours (90 min)",
};

interface DurationSelectProps {
  value: MeetingDurationMinutes;
  onChange: (v: MeetingDurationMinutes) => void;
  error?: string;
}

export function DurationSelect({
  value,
  onChange,
  error,
}: DurationSelectProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">
        Meeting duration
      </label>
      <select
        value={value}
        onChange={(e) =>
          onChange(Number(e.target.value) as MeetingDurationMinutes)
        }
        className={`w-full min-h-[40px] rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
          error ? "border-red-500" : "border-slate-300"
        }`}
        aria-invalid={!!error}
        aria-describedby={error ? "duration-error" : undefined}
      >
        <option value={30}>{LABELS[30]}</option>
        <option value={60}>{LABELS[60]}</option>
        <option value={90}>{LABELS[90]}</option>
      </select>
      {error && (
        <p id="duration-error" className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
