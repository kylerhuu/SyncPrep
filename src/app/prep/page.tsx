"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PrepNotes } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const PREP_STORAGE_KEY = "syncprep_prepNotes";

export default function PrepResultsPage() {
  const [notes, setNotes] = useState<PrepNotes | null>(null);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  useEffect(() => {
    try {
      const s = sessionStorage.getItem(PREP_STORAGE_KEY);
      if (s) {
        const parsed = JSON.parse(s) as PrepNotes;
        setNotes(parsed && typeof parsed === "object" ? parsed : null);
      } else {
        setNotes(null);
      }
    } catch {
      setNotes(null);
    } finally {
      setHasCheckedStorage(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="max-w-4xl mx-auto px-5 py-4 sm:px-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-slate-900 hover:text-slate-700"
          >
            SyncPrep
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/schedule">
              <Button variant="ghost">Back to schedule</Button>
            </Link>
            <Link href="/">
              <Button variant="secondary">Home</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-5 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-8 tracking-tight">
          Prep results
        </h1>

        {!hasCheckedStorage ? (
          <Card title="Preparation notes">
            <p className="text-sm text-slate-500">Loading…</p>
          </Card>
        ) : !notes ? (
          <Card title="No prep notes yet">
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Generate prep notes on the schedule page, then return here to view
              them in a focused view. For now, prep notes also appear on the
              schedule page after you click &quot;Generate prep notes&quot;.
            </p>
            <Link href="/schedule">
              <Button>Go to schedule</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {notes.meetingSummary && (
              <Card title="Meeting summary">
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {notes.meetingSummary}
                </p>
              </Card>
            )}
            {notes.talkingPoints && notes.talkingPoints.length > 0 && (
              <Card title="Suggested talking points">
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 leading-relaxed">
                  {notes.talkingPoints.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </Card>
            )}
            {notes.questionsToPrepare && notes.questionsToPrepare.length > 0 && (
              <Card title="Questions to prepare for">
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 leading-relaxed">
                  {notes.questionsToPrepare.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </Card>
            )}
            {notes.strengthsToHighlight &&
              notes.strengthsToHighlight.length > 0 && (
                <Card title="Strengths to highlight">
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 leading-relaxed">
                    {notes.strengthsToHighlight.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </Card>
              )}
            {notes.skillsToReview && notes.skillsToReview.length > 0 && (
              <Card title="Skills or topics to review">
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 leading-relaxed">
                  {notes.skillsToReview.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </Card>
            )}
            {notes.gapsOrMissing && notes.gapsOrMissing.length > 0 && (
              <Card title="Gaps or missing qualifications">
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 leading-relaxed">
                  {notes.gapsOrMissing.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </Card>
            )}
            {notes.followUpQuestions && notes.followUpQuestions.length > 0 && (
              <Card title="Follow-up questions to ask">
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 leading-relaxed">
                  {notes.followUpQuestions.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
