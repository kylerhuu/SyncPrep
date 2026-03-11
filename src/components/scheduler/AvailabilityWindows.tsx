"use client";

import type { TimeWindow } from "@/types";

function TimeInput({
  value,
  onChange,
  placeholder = "09:00",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-gray-300 px-2 py-1.5 text-sm"
    />
  );
}

export function AvailabilityWindows({
  windows,
  onChange,
  label,
}: {
  windows: TimeWindow[];
  onChange: (w: TimeWindow[]) => void;
  label: string;
}) {
  const add = () => onChange([...windows, { start: "09:00", end: "17:00" }]);
  const remove = (i: number) => onChange(windows.filter((_, idx) => idx !== i));
  const update = (i: number, field: "start" | "end", value: string) => {
    const next = [...windows];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <button
          type="button"
          onClick={add}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          + Add window
        </button>
      </div>
      {windows.length === 0 && (
        <button
          type="button"
          onClick={add}
          className="w-full rounded-md border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700"
        >
          Add availability window
        </button>
      )}
      <ul className="space-y-2">
        {windows.map((w, i) => (
          <li key={i} className="flex items-center gap-2 flex-wrap">
            <TimeInput value={w.start} onChange={(v) => update(i, "start", v)} />
            <span className="text-gray-500">–</span>
            <TimeInput value={w.end} onChange={(v) => update(i, "end", v)} />
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
