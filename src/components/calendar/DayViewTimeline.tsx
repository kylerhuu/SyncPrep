"use client";

import { DateTime } from "luxon";
import { resolveTimezone } from "@/lib/timezone";

const HEIGHT_PER_HOUR = 48;

export type TimelineBlockType = "busy" | "free" | "selected";

export interface TimelineBlock {
  startISO: string;
  endISO: string;
  type: TimelineBlockType;
  label?: string;
}

interface DayViewTimelineProps {
  dayLabel: string;
  startHour: number;
  endHour: number;
  blocks: TimelineBlock[];
  zone: string;
}

function blockToStyle(
  block: TimelineBlock,
  zone: string,
  startHour: number,
  endHour: number
): { top: number; height: number } | null {
  const start = DateTime.fromISO(block.startISO, { setZone: true }).setZone(zone);
  const end = DateTime.fromISO(block.endISO, { setZone: true }).setZone(zone);
  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;
  const rangeStart = startHour * 60;
  const rangeEnd = endHour * 60;
  const clipStart = Math.max(startMinutes, rangeStart);
  const clipEnd = Math.min(endMinutes, rangeEnd);
  if (clipEnd <= clipStart) return null;
  const top = ((clipStart - rangeStart) / 60) * HEIGHT_PER_HOUR;
  const height = ((clipEnd - clipStart) / 60) * HEIGHT_PER_HOUR;
  return { top, height };
}

export function DayViewTimeline({
  dayLabel,
  startHour,
  endHour,
  blocks,
  zone,
}: DayViewTimelineProps) {
  const iana = resolveTimezone(zone);
  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i
  );
  const totalHeight = (endHour - startHour) * HEIGHT_PER_HOUR;

  const positioned = blocks
    .map((block) => {
      const style = blockToStyle(block, iana, startHour, endHour);
      if (!style) return null;
      return { block, ...style };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">{dayLabel}</h2>
      </div>
      <div className="flex">
        <div
          className="shrink-0 w-14 py-1 pr-2 text-right"
          style={{ height: totalHeight }}
          aria-hidden
        >
          {hours.map((h) => (
            <div
              key={h}
              className="text-xs text-slate-500 tabular-nums leading-none"
              style={{ height: HEIGHT_PER_HOUR }}
            >
              {h % 12 === 0 ? "12" : h % 12}
              {h < 12 ? " AM" : " PM"}
            </div>
          ))}
        </div>
        <div
          className="flex-1 relative border-l border-slate-200 min-h-[200px]"
          style={{ height: totalHeight }}
        >
          {hours.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-slate-100 first:border-t-0"
              style={{
                top: (h - startHour) * HEIGHT_PER_HOUR,
                height: HEIGHT_PER_HOUR,
              }}
            />
          ))}
          {positioned.map(({ block, top, height }, i) => (
            <div
              key={i}
              className="absolute left-1 right-1 rounded-md overflow-hidden flex flex-col justify-center"
              style={{ top, height: Math.max(height - 2, 4) }}
              title={block.label}
            >
              {block.type === "busy" && (
                <div className="h-full w-full bg-amber-100 border border-amber-200 rounded px-2 py-1">
                  <p className="text-xs font-medium text-amber-900 truncate">
                    {block.label ?? "Busy"}
                  </p>
                </div>
              )}
              {block.type === "free" && (
                <div className="h-full w-full bg-emerald-50/80 border border-emerald-200/80 rounded px-2 py-1">
                  <p className="text-xs text-emerald-700/90 truncate">
                    {block.label ?? "Available"}
                  </p>
                </div>
              )}
              {block.type === "selected" && (
                <div className="h-full w-full bg-blue-50 border border-blue-200 rounded px-2 py-1">
                  <p className="text-xs font-medium text-blue-800 truncate">
                    {block.label ?? "Selected meeting"}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
