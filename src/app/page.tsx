import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="max-w-5xl mx-auto px-5 py-4 sm:px-6 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            SyncPrep
          </span>
          <Link href="/schedule">
            <Button>Get started</Button>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-20 sm:px-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 text-center max-w-2xl mb-5 leading-tight">
          Schedule across time zones. Prepare with AI.
        </h1>
        <p className="text-lg text-slate-600 text-center max-w-xl mb-12 leading-relaxed">
          Find overlapping meeting times, get a Google Calendar link, and
          generate structured prep notes—including resume and job description
          analysis for interviews.
        </p>
        <Link href="/schedule">
          <Button className="px-6 py-3 text-base">Start scheduling</Button>
        </Link>
        <ul className="mt-20 grid gap-8 sm:grid-cols-3 text-center max-w-3xl w-full">
          <li className="rounded-xl border border-[var(--border)] bg-white p-6 text-left shadow-sm">
            <span className="block text-base font-semibold text-slate-900 mb-2">
              Timezone-aware
            </span>
            <span className="text-sm text-slate-600 leading-relaxed">
              Two time zones and availability → overlapping slots and top
              suggestions.
            </span>
          </li>
          <li className="rounded-xl border border-[var(--border)] bg-white p-6 text-left shadow-sm">
            <span className="block text-base font-semibold text-slate-900 mb-2">
              Calendar link
            </span>
            <span className="text-sm text-slate-600 leading-relaxed">
              One click to open a Google Calendar event for your chosen time.
            </span>
          </li>
          <li className="rounded-xl border border-[var(--border)] bg-white p-6 text-left shadow-sm">
            <span className="block text-base font-semibold text-slate-900 mb-2">
              AI prep notes
            </span>
            <span className="text-sm text-slate-600 leading-relaxed">
              Meeting type, optional resume & job description → structured prep.
            </span>
          </li>
        </ul>
      </main>
    </div>
  );
}
