"use client";

import type { PrepNotes } from "@/types";
import { Card } from "@/components/ui/Card";

function Section({
  title,
  items,
  single,
}: {
  title: string;
  items?: string[] | string;
  single?: boolean;
}) {
  const content = single
    ? (typeof items === "string" ? items : items?.[0] ?? "")
    : items;
  if (single && typeof content === "string") {
    if (!content.trim()) return null;
    return (
      <div className="mb-5 last:mb-0">
        <h3 className="text-sm font-semibold text-slate-800 mb-1.5">{title}</h3>
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
          {content}
        </p>
      </div>
    );
  }
  const list = Array.isArray(content) ? content : [];
  if (list.length === 0) return null;
  return (
    <div className="mb-5 last:mb-0">
      <h3 className="text-sm font-semibold text-slate-800 mb-1.5">{title}</h3>
      <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 leading-relaxed">
        {list.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

interface PrepNotesPanelProps {
  notes: PrepNotes | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function PrepNotesPanel({
  notes,
  loading,
  error,
  onRetry,
}: PrepNotesPanelProps) {
  if (loading) {
    return (
      <Card title="Preparation notes">
        <div className="flex items-center gap-3 py-1">
          <span
            className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"
            aria-hidden
          />
          <p className="text-sm text-slate-600">Generating prep notes…</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Preparation notes">
        <p className="text-sm text-red-600 mb-2 leading-relaxed">{error}</p>
        <p className="text-xs text-slate-500 mb-4">
          Check your connection and that OPENAI_API_KEY is set in .env.local.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus-visible:underline"
          >
            Try again
          </button>
        )}
      </Card>
    );
  }

  if (!notes || !hasAnyContent(notes)) {
    return (
      <Card title="Preparation notes">
        <p className="text-sm text-slate-500 mb-2 leading-relaxed">
          Enter meeting type and optionally meeting goal, resume, or job
          description, then click &quot;Generate prep notes&quot; to get
          structured notes.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          Sections include: meeting summary, likely questions, talking points,
          strengths to highlight, skills to review, and follow-up questions.
        </p>
      </Card>
    );
  }

  return (
    <Card title="Preparation notes">
      <Section title="Meeting summary" items={notes.meetingSummary} single />
      <Section title="Likely questions" items={notes.questionsToPrepare} />
      <Section title="Talking points" items={notes.talkingPoints} />
      <Section title="Strengths to highlight" items={notes.strengthsToHighlight} />
      <Section title="Skills or topics to review" items={notes.skillsToReview} />
      <Section title="Gaps or missing qualifications" items={notes.gapsOrMissing} />
      <Section title="Follow-up questions to ask" items={notes.followUpQuestions} />
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
