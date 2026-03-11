"use client";

import type { TimeWindow } from "@/types";
import { validateTimeWindow } from "@/lib/timezone";
import { Button } from "@/components/ui/Button";

interface AvailabilityWindowsProps {
  windows: TimeWindow[];
  onChange: (windows: TimeWindow[]) => void;
  label: string;
}

export function AvailabilityWindows({
  windows,
  onChange,
  label,
}: AvailabilityWindowsProps) {
  const add = () => onChange([...windows, { start: "09:00", end: "17:00" }]);
  const remove = (i: number) => onChange(windows.filter((_, j) => j !== i));
  const update = (i: number, field: "start" | "end", value: string) => {
    const next = [...windows];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <Button
          type="button"
          variant="ghost"
          onClick={add}
          className="text-xs py-1 min-h-0"
        >
          + Add window
        </Button>
      </div>
      {windows.length === 0 ? (
        <Button
          type="button"
          variant="secondary"
          onClick={add}
          className="w-full"
        >
          Add availability window
        </Button>
      ) : (
        <ul className="space-y-3">
          {windows.map((w, i) => {
            const { valid, error } = validateTimeWindow(w);
            return (
              <li key={i} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="time"
                    value={w.start}
                    onChange={(e) => update(i, "start", e.target.value)}
                    className={`min-h-[40px] rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/25 ${
                      valid ? "border-slate-200" : "border-red-400 focus:ring-red-500/20"
                    }`}
                    aria-invalid={!valid}
                  />
                  <span className="text-slate-400 text-sm">–</span>
                  <input
                    type="time"
                    value={w.end}
                    onChange={(e) => update(i, "end", e.target.value)}
                    className={`min-h-[40px] rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/25 ${
                      valid ? "border-slate-200" : "border-red-400 focus:ring-red-500/20"
                    }`}
                    aria-invalid={!valid}
                  />
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none focus-visible:underline min-h-[40px] flex items-center"
                  >
                    Remove
                  </button>
                </div>
                {!valid && error && (
                  <p className="text-xs text-red-600" role="alert">
                    {error}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
