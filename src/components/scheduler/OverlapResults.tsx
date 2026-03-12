"use client";

import { DateTime } from "luxon";
import type { OverlapSlotResult } from "@/lib/timezone";
import { resolveTimezone } from "@/lib/timezone";
import { Card } from "@/components/ui/Card";
import { ClockIcon, CheckCircleIcon } from "@/components/ui/Icons";

const ZONE_FRIENDLY_NAMES: Record<string, string> = {
  "America/New_York": "Eastern",
  "America/Los_Angeles": "Pacific",
  "America/Chicago": "Central",
  "America/Denver": "Mountain",
  "Europe/London": "GMT/BST",
  "Europe/Paris": "Central European",
  "Asia/Tokyo": "Japan",
  "Asia/Kolkata": "India",
  "Australia/Sydney": "Australia Eastern",
};

function formatZoneLabel(ianaZone: string): string {
  return ZONE_FRIENDLY_NAMES[ianaZone] ?? ianaZone.split("/").pop()?.replace(/_/g, " ") ?? ianaZone;
}

function formatSlotInZone(startISO: string, endISO: string, ianaZone: string): string {
  const start = DateTime.fromISO(startISO, { setZone: true }).setZone(ianaZone);
  const end = DateTime.fromISO(endISO, { setZone: true }).setZone(ianaZone);
  if (!start.isValid || !end.isValid) return "";
  return `${start.toFormat("h:mm a")} – ${end.toFormat("h:mm a")}`;
}

interface OverlapResultsProps {
  allSlots: OverlapSlotResult[];
  suggestedSlots: OverlapSlotResult[];
  selectedSlot: OverlapSlotResult | null;
  onSelectSlot: (slot: OverlapSlotResult | null) => void;
  zoneA: string;
  zoneB: string;
  /** When true, user has filled zones and windows but no overlap was found. */
  hasValidInputNoOverlap?: boolean;
  /** When true, show message that zones/availability are required. */
  showInputPrompt?: boolean;
}

export function OverlapResults({
  allSlots,
  suggestedSlots,
  selectedSlot,
  onSelectSlot,
  zoneA,
  zoneB,
  hasValidInputNoOverlap = false,
  showInputPrompt = true,
}: OverlapResultsProps) {
  if (showInputPrompt && allSlots.length === 0 && !hasValidInputNoOverlap) {
    return (
      <Card title="Best overlapping times" icon={<ClockIcon />}>
        <div className="py-2">
          <p className="text-sm text-slate-600 leading-relaxed">
            Enter both time zones and working hours to see overlapping times.
          </p>
        </div>
      </Card>
    );
  }

  if (hasValidInputNoOverlap && allSlots.length === 0) {
    return (
      <Card title="Best overlapping times" icon={<ClockIcon />}>
        <div className="py-2">
          <p className="text-sm text-amber-700 leading-relaxed mb-1">
            No overlap found for this week.
          </p>
          <p className="text-xs text-slate-500">
            Try different working hours, a shorter meeting, or adjust time zones.
          </p>
        </div>
      </Card>
    );
  }

  const tzA = resolveTimezone(zoneA);
  const tzB = resolveTimezone(zoneB);
  const labelA = formatZoneLabel(tzA);
  const labelB = formatZoneLabel(tzB);
  const sortedSlots = [...suggestedSlots].sort((a, b) =>
    a.startISO.localeCompare(b.startISO)
  );

  return (
    <Card title="Best overlapping times" icon={<ClockIcon />}>
      <p className="text-sm text-slate-600 mb-4">Select one:</p>
      <ul className="space-y-3">
        {sortedSlots.map((slot, idx) => {
          const isSelected = selectedSlot?.startISO === slot.startISO;
          const isRecommended = idx === 0;
          const lineA = formatSlotInZone(slot.startISO, slot.endISO, tzA);
          const lineB = formatSlotInZone(slot.startISO, slot.endISO, tzB);
          return (
            <li key={slot.startISO}>
              <button
                type="button"
                onClick={() => onSelectSlot(isSelected ? null : slot)}
                className={`w-full text-left rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all duration-300 flex items-start justify-between gap-3 relative overflow-hidden ${
                  isSelected
                    ? "border-blue-500 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 text-slate-900 shadow-[0_8px_24px_-6px_rgba(37,99,235,0.35)] ring-2 ring-blue-400/50"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/95 text-slate-800 hover:shadow-lg hover:-translate-y-0.5"
                } ${isRecommended && !isSelected ? "border-l-4 border-l-cyan-500" : ""}`}
              >
                {isRecommended && (
                  <span className="absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wider text-cyan-600/80">Best</span>
                )}
                <div className="tabular-nums min-w-0">
                  <div className="font-semibold text-slate-900">{lineA}</div>
                  <div className="text-slate-500 font-normal text-xs mt-0.5">{labelA} Time</div>
                  <div className="font-semibold text-slate-900 mt-2">{lineB}</div>
                  <div className="text-slate-500 font-normal text-xs mt-0.5">{labelB} Time</div>
                </div>
                {isSelected && (
                  <span className="shrink-0 mt-0.5 [&_svg]:text-[var(--accent-blue)]" aria-hidden>
                    <CheckCircleIcon />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
