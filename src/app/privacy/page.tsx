import Link from "next/link";
import { MarketingNav } from "@/components/nav/MarketingNav";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <MarketingNav />

      <main className="flex-1 max-w-2xl w-full mx-auto px-5 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Privacy
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: March 2025
        </p>

        <div className="mt-10 space-y-8 text-sm text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">
              Overview
            </h2>
            <p>
              SyncPrep helps you schedule meetings and prepare for them. We
              access only what we need to provide that service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">
              Google Calendar
            </h2>
            <p>
              If you connect Google Calendar, we request <strong>read-only</strong> access
              to your events. We use this to:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 pl-2">
              <li>Show your busy times so you can see when you’re available</li>
              <li>Calculate open slots for meeting scheduling</li>
              <li>Display a weekly schedule view</li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> create, edit, or delete calendar events.
              You can disconnect at any time.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">
              Meeting brief (AI prep)
            </h2>
            <p>
              When you generate a meeting brief, we send your meeting type,
              context, resume, and job description to our AI provider (OpenAI) to
              produce prep notes. This data is not stored on our servers; it’s
              used only to generate your brief.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">
              Local storage
            </h2>
            <p>
              Schedule preferences, selected meeting times, and prep notes are
              stored in your browser’s session storage. Nothing is saved to our
              servers beyond what’s needed for calendar sync and AI generation.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">
              Questions
            </h2>
            <p>
              If you have questions about how we handle your data, you can reach
              out through the app or repository.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <Link
            href="/schedule"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to Schedule
          </Link>
        </div>
      </main>
    </div>
  );
}
