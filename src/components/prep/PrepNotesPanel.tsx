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
  const content = single ? (typeof items === "string" ? items : items?.[0] ?? "") : items;
  if (single && typeof content === "string") {
    if (!content.trim()) return null;
    return (
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">{title}</h3>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
      </div>
    );
  }
  const list = Array.isArray(content) ? content : [];
  if (list.length === 0) return null;
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-1">{title}</h3>
      <ul className="list-disc list-inside space-y-0.5 text-sm text-gray-700">
        {list.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function PrepNotesPanel({
  notes,
  loading,
  error,
}: {
  notes: PrepNotes | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <Card title="Preparation notes">
        <p className="text-sm text-gray-500">Generating structured prep notes…</p>
      </Card>
    );
  }
  if (error) {
    return (
      <Card title="Preparation notes">
        <p className="text-sm text-red-600">{error}</p>
      </Card>
    );
  }
  if (!notes) return null;

  return (
    <Card title="Preparation notes">
      <Section title="Meeting summary" items={notes.meetingSummary} single />
      <Section title="Suggested talking points" items={notes.talkingPoints} />
      <Section title="Questions to prepare for" items={notes.questionsToPrepare} />
      <Section title="Strengths to highlight" items={notes.strengthsToHighlight} />
      <Section title="Skills or topics to review" items={notes.skillsToReview} />
      <Section title="Gaps or missing qualifications" items={notes.gapsOrMissing} />
      <Section title="Follow-up questions to ask" items={notes.followUpQuestions} />
    </Card>
  );
}
