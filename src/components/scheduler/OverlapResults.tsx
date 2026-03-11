"use client";

import type { OverlapSlotResult } from "@/lib/timezone";
import { Card } from "@/components/ui/Card";

export function OverlapResults({
  allSlots,
  suggestedSlots,
  selectedSlot,
  onSelectSlot,
}: {
  allSlots: OverlapSlotResult[];
  suggestedSlots: OverlapSlotResult[];
  selectedSlot: OverlapSlotResult | null;
  onSelectSlot: (slot: OverlapSlotResult | null) => void;
}) {
  if (allSlots.length === 0) {
    return (
      <Card title="Available times">
        <p className="text-sm text-gray-500">Enter time zones and availability windows, then we&apos;ll show overlapping times.</p>
      </Card>
    );
  }

  return (
    <Card title="Available times">
      <p className="text-sm text-gray-600 mb-3">
        {allSlots.length} overlapping slot{allSlots.length !== 1 ? "s" : ""}. Top suggestions:
      </p>
      <ul className="space-y-2">
        {suggestedSlots.map((slot) => {
          const isSelected = selectedSlot?.startISO === slot.startISO;
          return (
            <li key={slot.startISO}>
              <button
                type="button"
                onClick={() => onSelectSlot(isSelected ? null : slot)}
                className={`w-full text-left rounded-lg border px-3 py-2.5 text-sm transition ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {slot.label}
              </button>
            </li>
          );
        })}
      </ul>
      {allSlots.length > suggestedSlots.length && (
        <p className="mt-2 text-xs text-gray-500">
          Showing top {suggestedSlots.length} of {allSlots.length} slots.
        </p>
      )}
    </Card>
  );
}
