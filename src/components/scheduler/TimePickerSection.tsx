"use client";

import { ReactNode } from "react";
import type { DayAvailability, OverlapSlotResult } from "@/lib/timezone";
import type { RankedSlot } from "@/lib/slot-ranking";
import type { CalendarEventItem } from "@/types/calendar";
import type { TimeWindow } from "@/types";
import { OverlapResults } from "@/components/scheduler/OverlapResults";
import { WeeklyScheduleSection } from "@/components/calendar/WeeklyScheduleSection";
import { CalendarIcon, ClockIcon } from "@/components/ui/Icons";

interface TimePickerSectionProps {
  useTwoPersonOverlap: boolean;
  validationCanCompute: boolean;
  availabilityByDay: DayAvailability[];
  selectedDay: string | null;
  selectedDaySlots: OverlapSlotResult[];
  allSlots: OverlapSlotResult[];
  suggestedSlots: OverlapSlotResult[];
  rankedSlotsForSelectedDay?: RankedSlot[];
  selectedSlot: OverlapSlotResult | null;
  zoneA: string;
  zoneB?: string;
  hasValidInputNoOverlap: boolean;
  showInputPrompt: boolean;
  calendarEvents: CalendarEventItem[];
  calendarConnected: boolean;
  workingHoursA: TimeWindow;
  mobileSummary?: ReactNode;
  onSelectDay: (day: string) => void;
  onSelectSlot: (slot: OverlapSlotResult | null) => void;
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

function getStatusText(
  validationCanCompute: boolean,
  availabilityByDay: DayAvailability[],
  selectedSlot: OverlapSlotResult | null
) {
  if (selectedSlot) return "Slot selected";
  if (!validationCanCompute) return "Waiting for setup";
  if (availabilityByDay.length === 0) return "No slots yet";
  return "Choose a recommended time";
}

export function TimePickerSection({
  useTwoPersonOverlap,
  validationCanCompute,
  availabilityByDay,
  selectedDay,
  selectedDaySlots,
  allSlots,
  suggestedSlots,
  rankedSlotsForSelectedDay,
  selectedSlot,
  zoneA,
  zoneB,
  hasValidInputNoOverlap,
  showInputPrompt,
  calendarEvents,
  calendarConnected,
  workingHoursA,
  mobileSummary,
  onSelectDay,
  onSelectSlot,
}: TimePickerSectionProps) {
  return (
    <section className="schedule-medium-panel overflow-hidden rounded-[28px] border border-slate-700 bg-slate-900/70 shadow-sm">
      <StepHeader
        step="Step 3 of 4"
        title="Pick a time"
        description="Start with the recommended options, then check the full day list if you need alternatives."
        status={getStatusText(validationCanCompute, availabilityByDay, selectedSlot)}
      />
      <div className="px-6 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)] lg:items-start">
          <div className="space-y-5">
            {validationCanCompute && availabilityByDay.length > 0 && (
              <div className="rounded-3xl border border-slate-700 bg-slate-900/65 p-4 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.9)]">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Choose a day first
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Day pills narrow the list so recommended times stay easy to scan.
                    </p>
                  </div>
                  <span className="hidden rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700 shadow-sm sm:inline-flex">
                    {availabilityByDay.length} active day{availabilityByDay.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Choose day">
                  {availabilityByDay.map((day) => {
                    const isSelected = selectedDay === day.date;
                    return (
                      <button
                        key={day.date}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => onSelectDay(day.date)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                          isSelected
                            ? "border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                            : "border-white bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span className="block">{day.label}</span>
                        <span
                          className={`mt-1 block text-xs tabular-nums ${
                            isSelected ? "text-blue-100" : "text-slate-500"
                          }`}
                        >
                          {day.slots.length} slot{day.slots.length === 1 ? "" : "s"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="schedule-primary-panel rounded-3xl border border-blue-500/50 bg-slate-900/85 p-1 shadow-[0_24px_48px_-22px_rgba(37,99,235,0.6)]">
              <OverlapResults
                allSlots={allSlots}
                slotsForSelectedDay={selectedDaySlots}
                suggestedSlots={suggestedSlots}
                rankedSlotsForSelectedDay={rankedSlotsForSelectedDay}
                selectedSlot={selectedSlot}
                onSelectSlot={onSelectSlot}
                zoneA={zoneA}
                zoneB={useTwoPersonOverlap ? zoneB : undefined}
                singleUser={!useTwoPersonOverlap}
                hasValidInputNoOverlap={hasValidInputNoOverlap}
                showInputPrompt={showInputPrompt}
              />
            </div>

            {mobileSummary ? <div className="lg:hidden">{mobileSummary}</div> : null}

            <MobilePreviewAccordion title="Show weekly schedule context">
              <WeeklyScheduleSection
                userTimeZone={zoneA}
                workingHours={workingHoursA}
                events={calendarEvents}
                connected={calendarConnected}
                selectedSlot={selectedSlot}
              />
            </MobilePreviewAccordion>
          </div>

          <aside className="schedule-support-panel hidden rounded-3xl border border-slate-700 bg-slate-900/45 p-4 lg:block">
            <div className="mb-4 flex items-start gap-3">
              <span className="rounded-2xl bg-white p-2 text-slate-500 shadow-sm">
                <CalendarIcon />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Weekly schedule context
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Supporting context only. Keep the slot list as the main decision surface.
                </p>
              </div>
            </div>
            <WeeklyScheduleSection
              userTimeZone={zoneA}
              workingHours={workingHoursA}
              events={calendarEvents}
              connected={calendarConnected}
              selectedSlot={selectedSlot}
            />
            {!selectedSlot && (
              <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-slate-100 p-2 text-slate-500">
                    <ClockIcon />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Decision rule
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Pick a recommended time first. Use the weekly view only to sanity-check conflicts.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
