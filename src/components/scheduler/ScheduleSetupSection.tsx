"use client";

import { ReactNode } from "react";
import type { CalendarEventItem } from "@/types/calendar";
import type { MeetingDurationMinutes, OverlapSlotResult } from "@/lib/timezone";
import type { TimeWindow } from "@/types";
import { GoogleCalendarSection } from "@/components/calendar/GoogleCalendarSection";
import { WeeklyScheduleSection } from "@/components/calendar/WeeklyScheduleSection";
import { TimezoneFields } from "@/components/scheduler/TimezoneFields";
import { DurationSelect } from "@/components/scheduler/DurationSelect";
import { WorkingHoursInput } from "@/components/scheduler/WorkingHoursInput";
import { CalendarIcon } from "@/components/ui/Icons";

interface ScheduleSetupSectionProps {
  zoneA: string;
  workingHoursA: TimeWindow;
  duration: MeetingDurationMinutes;
  calendarConnected: boolean;
  calendarEvents: CalendarEventItem[];
  derivedAvailabilityToday: string[];
  errorZoneA?: string;
  selectedSlot: OverlapSlotResult | null;
  onZoneAChange: (value: string) => void;
  onDurationChange: (value: MeetingDurationMinutes) => void;
  onWorkingHoursAChange: (value: TimeWindow) => void;
  onCalendarChange: (connected: boolean, events: CalendarEventItem[]) => void;
}

function StepHeader({
  step,
  title,
  description,
  status,
}: {
  step: string;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200/80 px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
          {step}
        </span>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {status}
        </span>
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
    </div>
  );
}

function MobilePreviewAccordion({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="lg:hidden rounded-2xl border border-slate-200 bg-slate-50/90">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-700">
        {title}
      </summary>
      <div className="border-t border-slate-200 px-4 py-4">{children}</div>
    </details>
  );
}

export function ScheduleSetupSection({
  zoneA,
  workingHoursA,
  duration,
  calendarConnected,
  calendarEvents,
  derivedAvailabilityToday,
  errorZoneA,
  selectedSlot,
  onZoneAChange,
  onDurationChange,
  onWorkingHoursAChange,
  onCalendarChange,
}: ScheduleSetupSectionProps) {
  return (
    <section className="schedule-medium-panel overflow-hidden rounded-[28px] border border-slate-700 bg-slate-900/70 shadow-sm">
      <StepHeader
        step="Step 1 of 4"
        title="Your availability"
        description="Connect your calendar, set your time zone, and define the hours you want SyncPrep to search."
        status={calendarConnected ? "Calendar connected" : "Setup in progress"}
      />
      <div className="px-6 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)] lg:items-start">
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-5 shadow-[0_14px_28px_-18px_rgba(15,23,42,0.85)]">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Calendar sync
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {calendarConnected
                      ? "Busy blocks are shaping your available times."
                      : "Connect Google Calendar for a more accurate schedule."}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    calendarConnected
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {calendarConnected ? "Live" : "Optional"}
                </span>
              </div>
              <GoogleCalendarSection
                userTimeZone={zoneA}
                onCalendarChange={onCalendarChange}
                derivedAvailabilityToday={derivedAvailabilityToday}
              />
            </div>

            <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-5 shadow-[0_14px_28px_-18px_rgba(15,23,42,0.85)]">
              <div className="mb-5">
                <p className="text-sm font-semibold text-slate-900">
                  Search settings
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  These settings define the time range used in slot matching.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <TimezoneFields
                    zoneA={zoneA}
                    zoneB=""
                    onZoneAChange={onZoneAChange}
                    onZoneBChange={() => undefined}
                    errorZoneA={errorZoneA}
                    errorZoneB={undefined}
                    singleUser
                  />
                </div>
                <DurationSelect value={duration} onChange={onDurationChange} />
                <WorkingHoursInput
                  value={workingHoursA}
                  onChange={onWorkingHoursAChange}
                  label="Your working hours"
                  helperText={
                    calendarConnected
                      ? "Used with your calendar to find free slots."
                      : "Your general availability if no calendar events are connected."
                  }
                />
              </div>
            </div>

            <MobilePreviewAccordion title="Show weekly context">
              <WeeklyScheduleSection
                userTimeZone={zoneA}
                workingHours={workingHoursA}
                events={calendarEvents}
                connected={calendarConnected}
                selectedSlot={selectedSlot}
                compact
              />
            </MobilePreviewAccordion>
          </div>

          <aside className="schedule-support-panel hidden rounded-3xl border border-slate-700 bg-slate-900/50 p-4 lg:block">
            <div className="mb-4 flex items-start gap-3">
              <span className="rounded-2xl bg-white p-2 text-slate-500 shadow-sm">
                <CalendarIcon />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Weekly context
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Supporting view only. Use it to verify the week you are searching.
                </p>
              </div>
            </div>
            <WeeklyScheduleSection
              userTimeZone={zoneA}
              workingHours={workingHoursA}
              events={calendarEvents}
              connected={calendarConnected}
              selectedSlot={selectedSlot}
              compact
            />
          </aside>
        </div>
      </div>
    </section>
  );
}
