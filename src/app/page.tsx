import Link from "next/link";
import { MarketingNav } from "@/components/nav/MarketingNav";

const primaryButtonClass =
  "inline-flex items-center justify-center min-h-[48px] rounded-xl px-8 py-3.5 text-base font-semibold bg-[var(--accent-navy)] text-white hover:bg-slate-800 active:bg-slate-900 border border-transparent shadow-xl shadow-slate-900/15 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 hover:scale-[1.02] active:translate-y-0 active:scale-100 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2";
const secondaryButtonClass =
  "inline-flex items-center justify-center min-h-[48px] rounded-xl px-8 py-3.5 text-base font-medium text-slate-700 hover:text-slate-900 bg-white/90 hover:bg-white border-2 border-slate-200 hover:border-slate-300 shadow-lg shadow-slate-900/5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <MarketingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative px-5 sm:px-6 py-28 sm:py-40 overflow-hidden min-h-[85vh] flex items-center">
          {/* Background layers */}
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none" aria-hidden />
          <div className="hero-orb hero-orb-1" aria-hidden />
          <div className="hero-orb hero-orb-2" aria-hidden />
          <div className="hero-orb hero-orb-3" aria-hidden />
          <div className="absolute inset-0 bg-dot-pattern pointer-events-none" aria-hidden />
          <div className="absolute inset-0 bg-signal-grid pointer-events-none" aria-hidden />
          <div className="absolute inset-0 bg-signal-lines pointer-events-none" aria-hidden />
          {/* Subtle gradient overlay for depth behind text */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 80% 50% at 50% 50%, transparent 0%, rgba(15, 23, 42, 0.03) 100%)",
            }}
            aria-hidden
          />
          {/* Glowing accent near CTA */}
          <div
            className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-64 h-24 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.4), transparent)" }}
            aria-hidden
          />

          <div className="relative w-full max-w-3xl mx-auto text-center">
            <h1
              className={`hero-reveal hero-reveal-delay-1 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1] hero-headline-glow`}
            >
              Schedule across time zones and prepare better meetings.
            </h1>
            <p className="hero-reveal hero-reveal-delay-2 mt-8 text-xl sm:text-2xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
              Import your calendar, find the best overlap, and generate your
              meeting brief—built for interviews, networking calls, and remote
              meetings.
            </p>
            <div className="hero-reveal hero-reveal-delay-3 mt-14 flex flex-col sm:flex-row items-center justify-center gap-4">
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

        {/* Product explanation - tinted cards */}
        <section className="relative px-5 sm:px-6 py-24 sm:py-28 overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-slate-100/80 border-y border-slate-200/60">
          <div className="absolute inset-0 bg-signal-grid pointer-events-none opacity-80" aria-hidden />
          <div className="relative max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-center mb-16">
              Schedule and prep in one place
            </h2>
            <ul className="grid sm:grid-cols-3 gap-8 sm:gap-10">
              {[
                { icon: "calendar", color: "blue", border: "hover:border-blue-300", bg: "from-blue-50/80 to-indigo-50/60", iconBg: "from-blue-500 to-indigo-600", iconShadow: "shadow-blue-500/30" },
                { icon: "clock", color: "cyan", border: "hover:border-cyan-300", bg: "from-cyan-50/80 to-blue-50/60", iconBg: "from-cyan-500 to-blue-600", iconShadow: "shadow-cyan-500/30" },
                { icon: "document", color: "violet", border: "hover:border-violet-300", bg: "from-violet-50/80 to-indigo-50/60", iconBg: "from-violet-500 to-indigo-600", iconShadow: "shadow-violet-500/30" },
              ].map((item, i) => (
                <li
                  key={item.icon}
                  className={`rounded-2xl border-2 border-slate-200/80 bg-gradient-to-br ${item.bg} p-6 shadow-lg shadow-slate-900/5 hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-2 ${item.border} transition-all duration-300 group animate-fade-up`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.iconBg} flex items-center justify-center mx-auto mb-5 text-white shadow-lg ${item.iconShadow} group-hover:scale-110 transition-transform duration-300`}>
                    {item.icon === "calendar" && (
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    {item.icon === "clock" && (
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {item.icon === "document" && (
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">
                    {item.icon === "calendar" && "Connect your calendar"}
                    {item.icon === "clock" && "Find overlap automatically"}
                    {item.icon === "document" && "Generate meeting prep notes"}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.icon === "calendar" && "Connect Google Calendar and your busy times are blocked—open slots stay visible."}
                    {item.icon === "clock" && "Enter both time zones and working hours, then get suggested meeting times in one view."}
                    {item.icon === "document" && "One click to generate your meeting brief—talking points, strengths to highlight, and questions to prepare."}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works - darker tint */}
        <section
          id="how-it-works"
          className="relative px-5 sm:px-6 py-24 sm:py-28 scroll-mt-6 overflow-hidden bg-gradient-to-b from-slate-100 via-slate-50 to-white"
        >
          <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-50" aria-hidden />
          <div className="absolute inset-0 bg-signal-lines pointer-events-none opacity-50" aria-hidden />
          <div className="relative max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-center mb-16">
              How it works
            </h2>
            <ol className="space-y-12">
              {[
                { n: 1, title: "Import your calendar", desc: "Connect Google Calendar. Your events block busy times; availability is calculated from your calendar and working hours.", color: "from-blue-600 to-indigo-600", shadow: "shadow-blue-500/30" },
                { n: 2, title: "Find the best meeting time", desc: "Enter both time zones and working hours. See overlapping slots, choose one, and add it to Google Calendar.", color: "from-cyan-500 to-blue-600", shadow: "shadow-cyan-500/30" },
                { n: 3, title: "Generate your meeting brief", desc: "Choose meeting type, add context or resume, and generate a brief you can use in the call.", color: "from-violet-500 to-indigo-600", shadow: "shadow-violet-500/30" },
              ].map(({ n, title, desc, color, shadow }, i) => (
                <li key={n} className="flex gap-6 items-start animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <span className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${color} text-white flex items-center justify-center text-lg font-bold shadow-xl ${shadow}`}>
                    {n}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      {title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Feature highlights - alternating card tints */}
        <section className="relative px-5 sm:px-6 py-24 sm:py-28 overflow-hidden bg-white border-y border-slate-200/80">
          <div className="absolute inset-0 bg-signal-grid pointer-events-none opacity-60" aria-hidden />
          <div className="relative max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-center mb-16">
              Built for how you work
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Google Calendar import", desc: "Your events become busy blocks; open gaps stay visible so you never double-book.", accent: "border-l-4 border-l-blue-500", bg: "bg-gradient-to-r from-blue-50/50 to-white" },
                { title: "Time zone–aware scheduling", desc: "Both time zones and working hours in one place—suggested times shown in each person's local time.", accent: "border-l-4 border-l-cyan-500", bg: "bg-gradient-to-r from-cyan-50/50 to-white" },
                { title: "Availability detection", desc: "Working hours minus calendar events = your real free slots, shown in a clear weekly grid.", accent: "border-l-4 border-l-emerald-500", bg: "bg-gradient-to-r from-emerald-50/50 to-white" },
                { title: "Meeting brief", desc: "Interview, networking, or general meeting—get talking points, strengths to highlight, and questions to prepare.", accent: "border-l-4 border-l-violet-500", bg: "bg-gradient-to-r from-violet-50/50 to-white" },
                { title: "Weekly schedule preview", desc: "A visual week view: busy blocks, open gaps, and your selected meeting so you see your week at a glance.", accent: "border-l-4 border-l-indigo-500", bg: "bg-gradient-to-r from-indigo-50/50 to-white", wide: true },
              ].map(({ title, desc, accent, bg, wide }, i) => (
                <div
                  key={title}
                  className={`rounded-2xl border border-slate-200/80 ${bg} p-6 shadow-md hover:shadow-xl ${accent} card-hover ${wide ? "sm:col-span-2 lg:col-span-1" : ""} animate-fade-up`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <h3 className="text-base font-semibold text-slate-900 mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product preview */}
        <section className="relative px-5 sm:px-6 py-24 sm:py-28 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50">
          <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-40" aria-hidden />
          <div className="relative max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-center mb-14">
              Your schedule, at a glance
            </h2>
            <div className="rounded-2xl border-2 border-slate-200/80 bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 aspect-[16/10] max-h-[420px] flex items-center justify-center overflow-hidden shadow-2xl shadow-slate-900/10">
              <div className="text-center px-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-200 to-indigo-200 flex items-center justify-center mx-auto mb-5 text-blue-700 border-2 border-blue-200/80 shadow-lg">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-slate-600">
                  Product preview
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Weekly schedule view
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative px-5 sm:px-6 py-28 sm:py-36 overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-slate-50 border-t border-slate-200/80">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none opacity-70" aria-hidden />
          <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-30" aria-hidden />
          <div className="relative max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
              Ready to schedule and prep?
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed">
              Built for students, job seekers, and professionals scheduling
              interviews, networking calls, and remote meetings.
            </p>
            <Link
              href="/schedule"
              className={`${primaryButtonClass} mt-12 inline-flex`}
            >
              Open SyncPrep
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/95 backdrop-blur-sm py-6">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-slate-800">SyncPrep</span>
            <Link
              href="/privacy"
              className="text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
            >
              Privacy
            </Link>
          </div>
          <Link
            href="/schedule"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Open app →
          </Link>
        </div>
      </footer>
    </div>
  );
}
