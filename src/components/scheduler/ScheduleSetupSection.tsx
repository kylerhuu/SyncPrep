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
import { Calendar, Settings, ChevronDown } from "lucide-react";

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
    <div className="flex flex-col gap-4 border-b border-[var(--border)] px-6 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="step-badge step-badge-small">1</span>
        <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
          {step}
        </span>
        <span className={`ml-auto inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          status.includes("connected") 
            ? "bg-green-500/15 text-green-400" 
            : "bg-[var(--accent-soft)] text-[var(--accent)]"
        }`}>
          {status}
        </span>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[var(--foreground-muted)] leading-relaxed">
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
    <details className="lg:hidden rounded-xl border border-[var(--border)] bg-[var(--background)]">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-[var(--foreground)] flex items-center justify-between">
        {title}
        <ChevronDown className="w-4 h-4 text-[var(--foreground-muted)]" />
      </summary>
      <div className="border-t border-[var(--border)] px-4 py-4">{children}</div>
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
    <section className="section-card">
      <StepHeader
        step="Step 1 of 4"
        title="Your availability"
        description="Connect your calendar, set your time zone, and define your working hours."
        status={calendarConnected ? "Calendar connected" : "Setup in progress"}
      />
      <div className="px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)] lg:items-start">
          <div className="space-y-5">
            {/* Calendar Sync Card */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="section-icon">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      Calendar sync
                    </p>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                      {calendarConnected
                        ? "Busy blocks are shaping your available times."
                        : "Connect Google Calendar for accurate availability."}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    calendarConnected
                      ? "bg-green-500/15 text-green-400"
                      : "bg-[var(--foreground-subtle)]/20 text-[var(--foreground-muted)]"
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

            {/* Search Settings Card */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
              <div className="mb-5 flex items-start gap-3">
                <div className="section-icon">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    Search settings
                  </p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    Define the time range for slot matching.
                  </p>
                </div>
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
                      : "Your general availability window."
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

          {/* Weekly Context Sidebar */}
          <aside className="hidden rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-4 lg:block">
            <div className="mb-4 flex items-start gap-3">
              <div className="section-icon">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  Weekly context
                </p>
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                  Preview of your week ahead
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
