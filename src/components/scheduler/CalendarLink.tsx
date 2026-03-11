"use client";

import { buildGoogleCalendarUrl } from "@/lib/calendar";
import type { OverlapSlotResult } from "@/lib/timezone";
import { Card } from "@/components/ui/Card";

export function CalendarLink({
  slot,
  title = "Meeting",
}: {
  slot: OverlapSlotResult | null;
  title?: string;
}) {
  if (!slot) return null;

  const url = buildGoogleCalendarUrl(slot.startISO, slot.endISO, title);

  return (
    <Card title="Add to calendar">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
      >
        Add to Google Calendar
      </a>
      <p className="mt-2 text-xs text-gray-500">{slot.label}</p>
    </Card>
  );
}
