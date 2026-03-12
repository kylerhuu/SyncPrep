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
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        Meeting duration
      </label>
      <select
        value={value}
        onChange={(e) =>
          onChange(Number(e.target.value) as MeetingDurationMinutes)
        }
        className={`w-full min-h-[40px] rounded-xl border-2 px-3.5 py-2.5 text-sm text-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 ${
          error ? "border-red-400 focus:border-red-500 focus:ring-red-500/25" : "border-slate-200 hover:border-slate-300"
        }`}
        aria-invalid={!!error}
        aria-describedby={error ? "duration-error" : undefined}
      >
        <option value={30}>{LABELS[30]}</option>
        <option value={60}>{LABELS[60]}</option>
        <option value={90}>{LABELS[90]}</option>
      </select>
      {error && (
        <p id="duration-error" className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
