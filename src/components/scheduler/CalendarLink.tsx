"use client";

import { buildGoogleCalendarUrl } from "@/lib/calendar";
import type { OverlapSlotResult } from "@/lib/timezone";
import { Card } from "@/components/ui/Card";

interface CalendarLinkProps {
  slot: OverlapSlotResult | null;
  title?: string;
}

export function CalendarLink({ slot, title = "Meeting" }: CalendarLinkProps) {
  if (!slot) return null;

  const url = buildGoogleCalendarUrl(slot.startISO, slot.endISO, title);

  return (
    <Card title="Add to calendar">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center min-h-[40px] rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
      >
        Add to Google Calendar
      </a>
      <p className="mt-3 text-xs text-slate-500">{slot.label}</p>
    </Card>
  );
}
