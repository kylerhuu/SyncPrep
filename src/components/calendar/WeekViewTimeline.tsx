"use client";

import { DateTime } from "luxon";
import { resolveTimezone } from "@/lib/timezone";

const HEIGHT_PER_HOUR = 44;

export type TimelineBlockType = "busy" | "free" | "selected" | "suggestion";

export interface WeekViewBlock {
  dayIndex: number;
  startISO: string;
  endISO: string;
  type: TimelineBlockType;
  label?: string;
}

interface WeekViewTimelineProps {
  weekLabel: string;
  dayLabels: string[];
  daySublabels?: string[];
  startHour: number;
  endHour: number;
  blocks: WeekViewBlock[];
  zone: string;
  compact?: boolean;
}

function blockToStyle(
  block: WeekViewBlock,
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

const blockStyles = {
  busy:
    "bg-gradient-to-br from-amber-300 via-amber-200 to-orange-200 border border-amber-500/60 text-amber-950 shadow-[0_2px_8px_-1px_rgba(245,158,11,0.4)] transition-all duration-300",
  free:
    "bg-gradient-to-br from-emerald-300/95 via-teal-200 to-cyan-200/90 border border-emerald-500/50 text-emerald-950 shadow-[0_2px_8px_-1px_rgba(16,185,129,0.25)] transition-all duration-300",
  selected:
    "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white border-0 shadow-[0_6px_20px_-4px_rgba(37,99,235,0.55),0_0_0_1px_rgba(255,255,255,0.2)_inset] ring-2 ring-blue-400/60 selected-glow transition-all duration-300",
  suggestion:
    "bg-gradient-to-br from-cyan-200/90 to-blue-200/80 border border-cyan-400/60 text-cyan-950 shadow-[0_2px_8px_-1px_rgba(6,182,212,0.25)] transition-all duration-300",
} as const;

const DAY_HEADER_HEIGHT = 36;

export function WeekViewTimeline({
  weekLabel,
  dayLabels,
  daySublabels,
  startHour,
  endHour,
  blocks,
  zone,
  compact = false,
}: WeekViewTimelineProps) {
  const iana = resolveTimezone(zone);
  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i
  );
  const totalHeight = (endHour - startHour) * HEIGHT_PER_HOUR;

  const positionedByDay = dayLabels.map((_, dayIndex) => {
    const dayBlocks = blocks.filter((b) => b.dayIndex === dayIndex);
    return dayBlocks
      .map((block) => {
        const style = blockToStyle(block, iana, startHour, endHour);
        if (!style) return null;
        return { block, ...style };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  });

  const hourLabelClass = compact ? "text-[10px]" : "text-xs";

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-surface-elevated overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 card-hover">
      <div className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 py-3.5">
        <p className="text-sm font-semibold text-slate-800 tracking-tight">
          {weekLabel}
        </p>
      </div>
      <div className="flex overflow-x-auto">
        <div
          className="shrink-0 flex flex-col"
          style={{ height: totalHeight + (compact ? 0 : DAY_HEADER_HEIGHT) }}
        >
          <div style={{ height: DAY_HEADER_HEIGHT }} className="shrink-0" />
          <div
            className="w-14 py-1 pr-2 text-right border-r border-slate-200"
            style={{ height: totalHeight }}
            aria-hidden
          >
            {hours.map((h) => (
              <div
                key={h}
                className={`${hourLabelClass} text-slate-600 tabular-nums font-medium leading-none`}
                style={{ height: HEIGHT_PER_HOUR }}
              >
                {h % 12 === 0 ? "12" : h % 12}
                {h < 12 ? "am" : "pm"}
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-0 flex">
          {dayLabels.map((label, dayIndex) => (
            <div
              key={dayIndex}
              className="flex-1 min-w-[72px] max-w-[140px] flex flex-col border-l border-slate-200 first:border-l-0"
            >
              <div
                className="shrink-0 flex flex-col items-center justify-center border-b border-slate-200 bg-slate-50/50 px-1 py-2"
                style={{ height: DAY_HEADER_HEIGHT }}
              >
                <span className="text-xs font-semibold text-slate-800 truncate w-full text-center">
                  {label}
                </span>
                {daySublabels?.[dayIndex] && (
                  <span className="text-[10px] text-slate-500 tabular-nums mt-0.5">
                    {daySublabels[dayIndex]}
                  </span>
                )}
              </div>
              <div
                className="relative flex-1 bg-gradient-to-b from-slate-50 to-slate-100/50"
                style={{ height: totalHeight, minHeight: totalHeight }}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-slate-200/80 first:border-t-0"
                    style={{
                      top: (h - startHour) * HEIGHT_PER_HOUR,
                      height: HEIGHT_PER_HOUR,
                    }}
                  />
                ))}
                {positionedByDay[dayIndex]?.map(({ block, top, height }, i) => (
                  <div
                    key={i}
                    className={`absolute left-1.5 right-1.5 rounded-xl flex flex-col justify-center overflow-hidden ${blockStyles[block.type]}`}
                    style={{ top: top + 2, height: Math.max(height - 4, 8) }}
                    title={block.label}
                  >
                    {!compact && block.label && (
                      <p className="text-[11px] font-medium truncate px-1.5 py-0.5 leading-tight">
                        {block.label}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
