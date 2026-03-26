"use client";

import { ReactNode } from "react";
import type { DayAvailability, OverlapSlotResult } from "@/lib/timezone";
import type { RankedSlot } from "@/lib/slot-ranking";
import type { CalendarEventItem } from "@/types/calendar";
import type { TimeWindow } from "@/types";
import { OverlapResults } from "@/components/scheduler/OverlapResults";
import { WeeklyScheduleSection } from "@/components/calendar/WeeklyScheduleSection";
import { Calendar, Clock, ChevronDown } from "lucide-react";

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
    <div className="flex flex-col gap-4 border-b border-[var(--border)] px-6 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="step-badge step-badge-small">3</span>
        <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
          {step}
        </span>
        <span className={`ml-auto inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          status.includes("selected") 
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

function getStatusText(
  validationCanCompute: boolean,
  availabilityByDay: DayAvailability[],
  selectedSlot: OverlapSlotResult | null
) {
  if (selectedSlot) return "Slot selected";
  if (!validationCanCompute) return "Waiting for setup";
  if (availabilityByDay.length === 0) return "No slots yet";
  return "Choose a time";
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
    <section className="section-card">
      <StepHeader
        step="Step 3 of 4"
        title="Pick a time"
        description="Select a recommended time slot, or browse alternatives by day."
        status={getStatusText(validationCanCompute, availabilityByDay, selectedSlot)}
      />
      <div className="px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)] lg:items-start">
          <div className="space-y-5">
            {/* Day Selector */}
            {validationCanCompute && availabilityByDay.length > 0 && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="section-icon">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        Select a day
                      </p>
                      <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                        Filter available times by day
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex items-center rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
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
                        className={`day-tab ${isSelected ? "day-tab-active" : ""}`}
                      >
                        <span className="block font-medium">{day.label}</span>
                        <span className={`mt-0.5 block text-xs tabular-nums ${
                          isSelected ? "text-[var(--accent)]" : "text-[var(--foreground-subtle)]"
                        }`}>
                          {day.slots.length} slot{day.slots.length === 1 ? "" : "s"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Time Slot Grid */}
            <div className="rounded-xl border border-[var(--border-accent)] bg-[var(--background-card)] p-4 shadow-lg shadow-[var(--accent-glow)]/10">
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
                  Verify your selection against the week
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
              <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="section-icon">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      Tip
                    </p>
                    <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                      Pick a recommended time first. Use the weekly view to sanity-check conflicts.
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
