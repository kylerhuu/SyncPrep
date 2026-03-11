import Link from "next/link";
import { MarketingNav } from "@/components/nav/MarketingNav";

const primaryButtonClass =
  "inline-flex items-center justify-center min-h-[44px] rounded-xl px-6 py-3 text-base font-medium bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-700 border border-transparent shadow-sm hover:shadow transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2";
const secondaryButtonClass =
  "inline-flex items-center justify-center min-h-[44px] rounded-xl px-6 py-3 text-base font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <MarketingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="px-5 sm:px-6 py-20 sm:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
              Schedule across time zones and prepare better meetings.
            </h1>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed">
              Import your calendar, find the best overlap, and generate your
              meeting brief—built for interviews, networking calls, and remote
              meetings.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/schedule" className={`${primaryButtonClass} w-full sm:w-auto`}>
                Start scheduling
              </Link>
              <a
                href="#how-it-works"
                className={`${secondaryButtonClass} w-full sm:w-auto`}
              >
                See how it works
              </a>
            </div>
          </div>
        </section>

        {/* Product explanation */}
        <section className="px-5 sm:px-6 py-16 sm:py-20 bg-white border-y border-slate-200">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight text-center mb-12">
              Schedule and prep in one place
            </h2>
            <ul className="grid sm:grid-cols-3 gap-8 sm:gap-10">
              <li className="text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  Connect your calendar
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Connect Google Calendar and your busy times are blocked—open
                  slots stay visible.
                </p>
              </li>
              <li className="text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  Find overlap automatically
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Enter both time zones and working hours, then get suggested
                  meeting times in one view.
                </p>
              </li>
              <li className="text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  Generate meeting prep notes
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  One click to generate your meeting brief—talking points,
                  strengths to highlight, and questions to prepare.
                </p>
              </li>
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="px-5 sm:px-6 py-16 sm:py-20 scroll-mt-6"
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight text-center mb-12">
              How it works
            </h2>
            <ol className="space-y-10">
              <li className="flex gap-6">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
                  1
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Import your calendar
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Connect Google Calendar. Your events block busy times;
                    availability is calculated from your calendar and working
                    hours.
                  </p>
                </div>
              </li>
              <li className="flex gap-6">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Find the best meeting time
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Enter both time zones and working hours. See overlapping
                    slots, choose one, and add it to Google Calendar.
                  </p>
                </div>
              </li>
              <li className="flex gap-6">
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Generate your meeting brief
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    Choose meeting type, add context or resume, and generate a
                    brief you can use in the call.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Feature highlights */}
        <section className="px-5 sm:px-6 py-16 sm:py-20 bg-white border-y border-slate-200">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight text-center mb-12">
              Built for how you work
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  Google Calendar import
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your events become busy blocks; open gaps stay visible so you
                  never double-book.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  Time zone–aware scheduling
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Both time zones and working hours in one place—suggested times
                  shown in each person’s local time.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  Availability detection
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Working hours minus calendar events = your real free slots,
                  shown in a clear weekly grid.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  Meeting brief
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Interview, networking, or general meeting—get talking points,
                  strengths to highlight, and questions to prepare.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-1">
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  Weekly schedule preview
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  A visual week view: busy blocks, open gaps, and your selected
                  meeting so you see your week at a glance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Product preview */}
        <section className="px-5 sm:px-6 py-16 sm:py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight text-center mb-10">
              Your schedule, at a glance
            </h2>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 aspect-[16/10] max-h-[420px] flex items-center justify-center overflow-hidden shadow-sm">
              <div className="text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-500">
                  Product preview
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Weekly schedule view
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-5 sm:px-6 py-20 sm:py-28 bg-white border-t border-slate-200">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Ready to schedule and prep?
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Built for students, job seekers, and professionals scheduling
              interviews, networking calls, and remote meetings.
            </p>
            <Link
              href="/schedule"
              className={`${primaryButtonClass} mt-8 inline-flex`}
            >
              Open SyncPrep
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-slate-700">SyncPrep</span>
            <Link
              href="/privacy"
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Privacy
            </Link>
          </div>
          <Link
            href="/schedule"
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Open app →
          </Link>
        </div>
      </footer>
    </div>
  );
}
