"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { PrepNotes } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DocumentTextIcon, ClipboardIcon } from "@/components/ui/Icons";
import { PrepBriefBody } from "@/components/prep/PrepBriefBody";
import { getPrepNotesAsText } from "@/lib/prepBrief";

const PREP_STORAGE_KEY = "syncprep_prepNotes";

export default function PrepResultsPage() {
  const [notes, setNotes] = useState<PrepNotes | null>(null);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = useCallback(() => {
    if (!notes) return;
    const text = getPrepNotesAsText(notes);
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [notes]);

  const copyButton = notes ? (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
    >
      <ClipboardIcon />
      {copied ? "Copied!" : "Copy notes"}
    </button>
  ) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <header className="border-b border-slate-200 bg-white">
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            AI meeting brief
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
            Your generated prep notes and talking points.
          </p>
        </div>

        {!hasCheckedStorage ? (
          <Card title="AI meeting brief" icon={<DocumentTextIcon />}>
            <p className="text-sm text-slate-500">Loading meeting brief…</p>
          </Card>
        ) : !notes ? (
          <Card title="No meeting brief yet">
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Generate prep notes on the schedule page, then return here to view
              them in a focused view. You can also see the brief on the schedule
              page after you click &quot;Generate prep notes&quot;.
            </p>
            <Link href="/schedule">
              <Button>Go to schedule</Button>
            </Link>
          </Card>
        ) : (
          <Card
            title="AI meeting brief"
            icon={<DocumentTextIcon />}
            headerAction={copyButton}
          >
            <PrepBriefBody notes={notes} />
          </Card>
        )}
      </main>
    </div>
  );
}
