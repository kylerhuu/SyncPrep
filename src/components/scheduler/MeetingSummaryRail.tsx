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
import {
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  SparklesIcon,
} from "@/components/ui/Icons";

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
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-800 px-3 py-2.5">
      <span className="text-sm text-slate-200">{label}</span>
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
          complete
            ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
            : "bg-slate-700 text-slate-300 ring-1 ring-slate-600"
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
    <section
      className={`meeting-summary-rail overflow-hidden rounded-[28px] border border-slate-700 bg-slate-900/70 shadow-sm ${className}`}
    >
      <div className="border-b border-slate-200/80 px-6 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
            Step 4 of 4
          </span>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Confirm + prepare
          </span>
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">
          Meeting summary
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-slate-600">
          Confirm the slot, add booking details, and generate a focused meeting brief.
        </p>
      </div>

      <div className="space-y-5 px-6 py-6">
        <div className="rounded-3xl border border-slate-700 bg-slate-900/65 p-4">
          <div className="mb-4 flex items-start gap-3">
            <span className="rounded-2xl bg-white p-2 text-slate-500 shadow-sm">
              <CheckCircleIcon />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Decision progress
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Keep moving top to bottom. The booking state card becomes primary once a slot is selected.
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <ProgressRow label="Your availability is configured" complete={Boolean(zoneA.trim())} />
            <ProgressRow
              label="Their availability is usable"
              complete={!useTwoPersonOverlap || Boolean(zoneB.trim())}
            />
            <ProgressRow label="A meeting time is selected" complete={selectedSlot != null} />
            <ProgressRow label="Prep materials are added" complete={hasPrepInputs} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
              {duration} min
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
              {daysWithAvailability} day{daysWithAvailability === 1 ? "" : "s"} with slots
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
              {allSlots.length} total option{allSlots.length === 1 ? "" : "s"}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                calendarConnected
                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                  : "bg-slate-800 text-slate-300 ring-1 ring-slate-700"
              }`}
            >
              {calendarConnected ? "Calendar synced" : "Calendar not connected"}
            </span>
          </div>
        </div>

        {selectedSlot ? (
          <SelectedMeetingCard
            slot={selectedSlot}
            zoneA={zoneA}
            zoneB={useTwoPersonOverlap ? zoneB : undefined}
            title="Meeting"
            singleUser={!useTwoPersonOverlap}
          />
        ) : (
          <div className="rounded-3xl border border-blue-500/45 bg-slate-900/80 p-5 shadow-[0_20px_46px_-24px_rgba(37,99,235,0.45)]">
            <div className="flex items-start gap-3">
              <span className="rounded-2xl bg-white p-2 text-blue-600 shadow-sm">
                <ClockIcon />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Choose a slot to unlock booking
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  The selected time will appear here with booking fields and cross-timezone details.
                </p>
              </div>
            </div>
            {bestOption ? (
              <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                  Best upcoming option
                </p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {formatBestOption(bestOption, zoneA)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Start with the recommended list in Step 3, then come back here to confirm.
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
                <p className="text-sm text-slate-600">
                  Finish the availability steps to surface recommended times.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="rounded-3xl border border-slate-700 bg-slate-900/70">
          <div className="border-b border-slate-200/80 px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="rounded-2xl bg-slate-100 p-2 text-slate-500">
                <DocumentTextIcon />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Meeting context
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Add notes and materials before generating your brief.
                </p>
              </div>
            </div>
          </div>
          <div className="p-5">
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
            <div className="mt-5 border-t border-slate-200 pt-5">
              <Button
                onClick={onGeneratePrep}
                disabled={prepLoading}
                className="w-full gap-2.5"
              >
                <SparklesIcon />
                {prepLoading ? "Generating brief..." : "Generate meeting brief"}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-700 bg-slate-900/55">
          <div className="border-b border-slate-200/80 px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="rounded-2xl bg-white p-2 text-slate-500 shadow-sm">
                <SparklesIcon />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Brief preview
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Tertiary context. Useful after scheduling, not before.
                </p>
              </div>
            </div>
          </div>

          {prepLoading ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center px-5 py-10">
              <LoadingSpinner label="Generating meeting brief..." size="md" />
            </div>
          ) : prepError ? (
            <div className="px-5 py-5">
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {prepError}
              </p>
            </div>
          ) : prepNotes && hasPrepContent(prepNotes) ? (
            <div className="max-h-[420px] overflow-auto p-5">
              <PrepBriefBody notes={prepNotes} />
              <div className="mt-4 border-t border-slate-200 pt-4">
                <Link
                  href="/prep"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline"
                >
                  <CalendarIcon />
                  View full brief
                </Link>
              </div>
            </div>
          ) : (
            <div className="px-5 py-5">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/75 px-4 py-4">
                <p className="text-sm font-medium text-slate-900">
                  No brief yet
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Add context above, then generate a brief with talking points, questions, strengths, and review topics.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
