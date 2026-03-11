"use client";

import type { TimeWindow } from "@/types";
import { validateTimeWindow } from "@/lib/timezone";

interface WorkingHoursInputProps {
  value: TimeWindow;
  onChange: (w: TimeWindow) => void;
  label: string;
  helperText?: string;
}

const inputClass =
  "min-h-[40px] rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/25 border-slate-200";

export function WorkingHoursInput({
  value,
  onChange,
  label,
  helperText,
}: WorkingHoursInputProps) {
  const { valid, error } = validateTimeWindow(value);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="time"
          value={value.start}
          onChange={(e) => onChange({ ...value, start: e.target.value })}
          className={inputClass}
          aria-invalid={!valid}
        />
        <span className="text-slate-400 text-sm">to</span>
        <input
          type="time"
          value={value.end}
          onChange={(e) => onChange({ ...value, end: e.target.value })}
          className={`${inputClass} ${!valid ? "border-red-400 focus:ring-red-500/20" : ""}`}
          aria-invalid={!valid}
        />
      </div>
      {!valid && error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      {helperText && valid && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
}
