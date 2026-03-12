"use client";

import { useState, useCallback } from "react";
import type { MeetingType, PrepNotes } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { DocumentTextIcon, SparklesIcon, ClipboardIcon } from "@/components/ui/Icons";
import { MeetingContextForm } from "@/components/prep/MeetingContextForm";
import { PrepBriefBody } from "@/components/prep/PrepBriefBody";
import { getPrepNotesAsText } from "@/lib/prepBrief";

interface PrepNotesPanelProps {
  notes: PrepNotes | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  /** Form state and handlers for empty state (real form). */
  meetingType?: MeetingType;
  context?: string;
  resume?: string;
  jobDescription?: string;
  onMeetingTypeChange?: (v: MeetingType) => void;
  onContextChange?: (v: string) => void;
  onResumeChange?: (v: string) => void;
  onJobDescriptionChange?: (v: string) => void;
  onGenerate?: () => void;
}

export function PrepNotesPanel({
  notes,
  loading,
  error,
  onRetry,
  meetingType = "interview",
  context = "",
  resume = "",
  jobDescription = "",
  onMeetingTypeChange,
  onContextChange,
  onResumeChange,
  onJobDescriptionChange,
  onGenerate,
}: PrepNotesPanelProps) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    if (!notes) return;
    const text = getPrepNotesAsText(notes);
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [notes]);

  if (loading) {
    return (
      <Card title="Meeting brief" icon={<DocumentTextIcon />} variant="ai">
        <div className="py-8">
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner label="Generating meeting brief…" size="md" />
            <p className="text-xs text-slate-500">AI is preparing your talking points and questions…</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Meeting brief" icon={<DocumentTextIcon />} variant="ai">
        <div className="space-y-4">
          <p className="text-sm text-red-700 leading-relaxed">{error}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="secondary">
              Try again
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (!notes || !hasAnyContent(notes)) {
    const hasFormHandlers =
      onMeetingTypeChange &&
      onContextChange &&
      onResumeChange &&
      onJobDescriptionChange &&
      onGenerate;
    return (
      <Card title="Meeting brief" icon={<DocumentTextIcon />} variant="ai">
        <div className="space-y-0">
          {hasFormHandlers ? (
            <>
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
              <div className="border-t border-slate-200 pt-4 mt-4">
                <Button
                  onClick={onGenerate}
                  disabled={loading}
                  className="w-full sm:min-w-[260px] sm:w-auto min-h-[48px] px-6 py-3.5 text-sm font-bold transition-all duration-300 inline-flex items-center justify-center gap-2.5 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 [&_svg]:text-white"
                >
                  <SparklesIcon />
                  Generate meeting brief
                </Button>
                <p className="text-xs text-slate-500 mt-4 mb-0">
                  You&apos;ll get:
                </p>
                <ul className="text-xs text-slate-500 mt-1.5 space-y-1 list-none pl-0">
                  <li>• Meeting overview</li>
                  <li>• Talking points</li>
                  <li>• Likely questions</li>
                  <li>• Strengths to highlight</li>
                  <li>• Topics to review</li>
                  <li>• Follow-up questions</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-4">
                <p className="text-sm font-medium text-slate-700 mb-1">
                  Get your meeting brief
                </p>
                <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                  <li>Choose meeting type and add context (optional).</li>
                  <li>Paste resume or job description for interviews (optional).</li>
                  <li>Click &quot;Generate meeting brief&quot;.</li>
                </ol>
              </div>
              <p className="text-xs text-slate-400">
                You&apos;ll get: overview, likely questions, talking points,
                strengths to highlight, topics to review, and follow-up
                questions.
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  const copyButton = (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-1 transition-all duration-200 hover:-translate-y-0.5"
    >
      <ClipboardIcon />
      {copied ? "Copied!" : "Copy notes"}
    </button>
  );

  return (
    <Card
      title="Meeting brief"
      icon={<DocumentTextIcon />}
      headerAction={copyButton}
      variant="ai"
    >
      <PrepBriefBody notes={notes} />
    </Card>
  );
}

function hasAnyContent(notes: PrepNotes): boolean {
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
