"use client";

import type { OverlapSlotResult } from "@/lib/timezone";
import { Card } from "@/components/ui/Card";

interface OverlapResultsProps {
  allSlots: OverlapSlotResult[];
  suggestedSlots: OverlapSlotResult[];
  selectedSlot: OverlapSlotResult | null;
  onSelectSlot: (slot: OverlapSlotResult | null) => void;
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
  hasValidInputNoOverlap = false,
  showInputPrompt = true,
}: OverlapResultsProps) {
  if (showInputPrompt && allSlots.length === 0 && !hasValidInputNoOverlap) {
    return (
      <Card title="Available times">
        <p className="text-sm text-slate-500 leading-relaxed">
          Enter both time zones and at least one availability window for each
          person to see overlapping times.
        </p>
      </Card>
    );
  }

  if (hasValidInputNoOverlap && allSlots.length === 0) {
    return (
      <Card title="Available times">
        <p className="text-sm text-amber-700 leading-relaxed">
          No overlapping times found for the given availability and duration.
          Try different windows or a shorter meeting duration.
        </p>
      </Card>
    );
  }

  return (
    <Card title="Available times">
      <p className="text-sm text-slate-600 mb-4">
        {allSlots.length} slot{allSlots.length !== 1 ? "s" : ""} found. Select one:
      </p>
      <ul className="space-y-2.5">
        {suggestedSlots.map((slot) => {
          const isSelected = selectedSlot?.startISO === slot.startISO;
          return (
            <li key={slot.startISO}>
              <button
                type="button"
                onClick={() => onSelectSlot(isSelected ? null : slot)}
                className={`w-full text-left rounded-xl border-2 px-4 py-3.5 text-sm font-medium transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 text-blue-900 shadow-sm ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 text-slate-800"
                }`}
              >
                <span className="tabular-nums">{slot.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
