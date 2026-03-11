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
        <p className="text-sm text-slate-500 leading-relaxed">
          Enter both time zones and at least one availability window for each
          person to see overlapping times.
        </p>
      </Card>
    );
  }

  if (hasValidInputNoOverlap && allSlots.length === 0) {
    return (
      <Card title="Best overlapping times" icon={<ClockIcon />}>
        <p className="text-sm text-amber-700 leading-relaxed">
          No overlapping times found for the given availability and duration.
          Try different windows or a shorter meeting duration.
        </p>
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
      <ul className="space-y-2.5">
        {sortedSlots.map((slot) => {
          const isSelected = selectedSlot?.startISO === slot.startISO;
          const lineA = formatSlotInZone(slot.startISO, slot.endISO, tzA);
          const lineB = formatSlotInZone(slot.startISO, slot.endISO, tzB);
          return (
            <li key={slot.startISO}>
              <button
                type="button"
                onClick={() => onSelectSlot(isSelected ? null : slot)}
                className={`w-full text-left rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? "border-blue-600 bg-blue-50 text-blue-900 shadow-md shadow-blue-200/50 ring-2 ring-blue-500/30"
                    : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 text-slate-800"
                }`}
              >
                <div className="tabular-nums min-w-0">
                  <div className="font-semibold text-slate-900">{lineA}</div>
                  <div className="text-slate-500 font-normal text-xs mt-0.5">{labelA} Time</div>
                  <div className="font-semibold text-slate-900 mt-2">{lineB}</div>
                  <div className="text-slate-500 font-normal text-xs mt-0.5">{labelB} Time</div>
                </div>
                {isSelected && (
                  <span className="shrink-0 mt-0.5 [&_svg]:text-blue-600" aria-hidden>
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
