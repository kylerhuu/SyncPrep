"use client";

import Link from "next/link";
import { DateTime } from "luxon";
import { resolveTimezone } from "@/lib/timezone";
import type { DayAvailability, OverlapSlotResult, MeetingDurationMinutes } from "@/lib/timezone";
import type { PrepNotes, MeetingType } from "@/types";
import { SelectedMeetingCard } from "@/components/scheduler/SelectedMeetingCard";
import { MeetingContextForm } from "@/components/prep/MeetingContextForm";
import { PrepBriefBody } from "@/components/prep/PrepBriefBody";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { CheckCircle, Clock, FileText, Sparkles, Calendar, ArrowRight } from "lucide-react";

interface MeetingSummaryRailProps {
  zoneA: string;
  zoneB: string;
  duration: MeetingDurationMinutes;
  useTwoPersonOverlap: boolean;
  calendarConnected: boolean;
  availabilityByDay: DayAvailability[];
  allSlots: OverlapSlotResult[];
  selectedSlot: OverlapSlotResult | null;
  prepNotes: PrepNotes | null;
  prepLoading: boolean;
  prepError: string | null;
  meetingType: MeetingType;
  context: string;
  resume: string;
  jobDescription: string;
  onMeetingTypeChange: (value: MeetingType) => void;
  onContextChange: (value: string) => void;
  onResumeChange: (value: string) => void;
  onJobDescriptionChange: (value: string) => void;
  onGeneratePrep: () => void;
  className?: string;
}

function hasPrepContent(notes: PrepNotes): boolean {
  if (notes.meetingSummary?.trim()) return true;
  const lists = [
    notes.questionsToPrepare,
    notes.talkingPoints,
    notes.strengthsToHighlight,
    notes.skillsToReview,
    notes.gapsOrMissing,
    notes.followUpQuestions,
  ];
  return lists.some((arr) => Array.isArray(arr) && arr.length > 0);
}

function formatBestOption(slot: OverlapSlotResult, zoneA: string) {
  const tz = resolveTimezone(zoneA);
  const start = DateTime.fromISO(slot.startISO, { setZone: true }).setZone(tz);
  const end = DateTime.fromISO(slot.endISO, { setZone: true }).setZone(tz);
  if (!start.isValid || !end.isValid) return null;
  return `${start.toFormat("EEE, MMM d")} • ${start.toFormat("h:mm a")} – ${end.toFormat("h:mm a")}`;
}

function ProgressRow({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5">
      <span className="text-sm text-[var(--foreground)]">{label}</span>
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          complete
            ? "bg-green-500/15 text-green-400"
            : "bg-[var(--foreground-subtle)]/20 text-[var(--foreground-muted)]"
        }`}
      >
        {complete ? "Ready" : "Pending"}
      </span>
    </div>
  );
}

export function MeetingSummaryRail({
  zoneA,
  zoneB,
  duration,
  useTwoPersonOverlap,
  calendarConnected,
  availabilityByDay,
  allSlots,
  selectedSlot,
  prepNotes,
  prepLoading,
  prepError,
  meetingType,
  context,
  resume,
  jobDescription,
  onMeetingTypeChange,
  onContextChange,
  onResumeChange,
  onJobDescriptionChange,
  onGeneratePrep,
  className = "",
}: MeetingSummaryRailProps) {
  const daysWithAvailability = availabilityByDay.filter((day) => day.slots.length > 0).length;
  const bestOption = selectedSlot ? null : allSlots[0] ?? null;
  const hasPrepInputs = Boolean(context.trim() || resume.trim() || jobDescription.trim());

  return (
    <section className={`summary-rail ${className}`}>
      {/* Header */}
      <div className="border-b border-[var(--border)] pb-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="step-badge step-badge-small">4</span>
          <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
            Step 4 of 4
          </span>
        </div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Meeting summary
        </h2>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Confirm your selection and generate your meeting brief.
        </p>
      </div>

      <div className="space-y-5">
        {/* Progress Section */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-4">
          <div className="mb-4 flex items-start gap-3">
            <div className="section-icon">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Progress
              </p>
              <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                Complete each step to finalize
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <ProgressRow label="Availability configured" complete={Boolean(zoneA.trim())} />
            <ProgressRow
              label="Their availability added"
              complete={!useTwoPersonOverlap || Boolean(zoneB.trim())}
            />
            <ProgressRow label="Time slot selected" complete={selectedSlot != null} />
            <ProgressRow label="Prep materials added" complete={hasPrepInputs} />
          </div>

          {/* Stats badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
              {duration} min
            </span>
            <span className="inline-flex items-center rounded-full bg-[var(--foreground-subtle)]/20 px-2.5 py-0.5 text-xs font-medium text-[var(--foreground-muted)]">
              {daysWithAvailability} day{daysWithAvailability === 1 ? "" : "s"} available
            </span>
            <span className="inline-flex items-center rounded-full bg-[var(--foreground-subtle)]/20 px-2.5 py-0.5 text-xs font-medium text-[var(--foreground-muted)]">
              {allSlots.length} slot{allSlots.length === 1 ? "" : "s"}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                calendarConnected
                  ? "bg-green-500/15 text-green-400"
                  : "bg-[var(--foreground-subtle)]/20 text-[var(--foreground-muted)]"
              }`}
            >
              {calendarConnected ? "Calendar synced" : "No calendar"}
            </span>
          </div>
        </div>

        {/* Selected Slot or Prompt */}
        {selectedSlot ? (
          <SelectedMeetingCard
            slot={selectedSlot}
            zoneA={zoneA}
            zoneB={useTwoPersonOverlap ? zoneB : undefined}
            title="Meeting"
            singleUser={!useTwoPersonOverlap}
          />
        ) : (
          <div className="rounded-xl border border-[var(--border-accent)] bg-[var(--background-card)] p-4 shadow-lg shadow-[var(--accent-glow)]/10">
            <div className="flex items-start gap-3">
              <div className="section-icon">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  Select a time slot
                </p>
                <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                  The booking details will appear here once selected.
                </p>
              </div>
            </div>
            {bestOption ? (
              <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                  Best option
                </p>
                <p className="mt-1.5 text-sm font-medium text-[var(--foreground)]">
                  {formatBestOption(bestOption, zoneA)}
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Meeting Context */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)]">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="section-icon">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  Meeting context
                </p>
                <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                  Add details for your brief
                </p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <MeetingContextForm
              meetingType={meetingType}
              context={context}
              resume={resume}
              jobDescription={jobDescription}
              onMeetingTypeChange={onMeetingTypeChange}
              onContextChange={onContextChange}
              onResumeChange={onResumeChange}
              onJobDescriptionChange={onJobDescriptionChange}
              noCard
            />
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <Button
                onClick={onGeneratePrep}
                disabled={prepLoading}
                className="w-full gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {prepLoading ? "Generating..." : "Generate Brief"}
              </Button>
            </div>
          </div>
        </div>

        {/* Brief Preview */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)]">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="section-icon">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  Brief preview
                </p>
                <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                  AI-generated meeting preparation
                </p>
              </div>
            </div>
          </div>

          {prepLoading ? (
            <div className="flex min-h-[120px] flex-col items-center justify-center px-4 py-6">
              <LoadingSpinner label="Generating..." size="md" />
            </div>
          ) : prepError ? (
            <div className="px-4 py-4">
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {prepError}
              </p>
            </div>
          ) : prepNotes && hasPrepContent(prepNotes) ? (
            <div className="max-h-[320px] overflow-auto p-4">
              <PrepBriefBody notes={prepNotes} />
              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <Link
                  href="/prep"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
                >
                  <Calendar className="w-4 h-4" />
                  View full brief
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="px-4 py-4">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-3">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  No brief yet
                </p>
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                  Add context above, then generate your brief.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
