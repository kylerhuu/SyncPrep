import Link from "next/link";
import { MarketingNav } from "@/components/nav/MarketingNav";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const primaryButtonClass =
  "inline-flex items-center justify-center min-h-[52px] rounded-xl px-8 py-3.5 text-base font-semibold bg-[var(--accent-navy)] text-white hover:bg-slate-800 active:bg-slate-900 border border-transparent shadow-xl shadow-slate-900/25 hover:shadow-[0_10px_30px_rgba(59,130,246,0.35),0_0_30px_rgba(59,130,246,0.2)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2";
const secondaryButtonClass =
  "inline-flex items-center justify-center min-h-[52px] rounded-xl px-8 py-3.5 text-base font-medium text-slate-700 hover:text-slate-900 bg-white/95 backdrop-blur-sm hover:bg-white border-2 border-slate-200 hover:border-slate-300 shadow-lg shadow-slate-900/8 hover:shadow-xl hover:shadow-[0_0_32px_-8px_rgba(37,99,235,0.15)] hover:-translate-y-0.5 transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <MarketingNav />

      <main className="flex-1">
        {/* Hero - 90vh, layered lighting, product preview */}
        <section className="relative px-5 sm:px-6 py-24 sm:py-32 overflow-hidden min-h-[90vh] flex items-center">
          {/* Base: full-bleed gradient (no white strip) */}
          <div className="absolute inset-0 bg-hero-base pointer-events-none" aria-hidden />
          {/* Slow gradient drift - living background */}
          <div className="hero-gradient-drift" aria-hidden />
          {/* Radial light sources */}
          <div className="absolute inset-0 hero-lights pointer-events-none" aria-hidden />
          {/* Soft gradient waves (drift) */}
          <div className="hero-wave hero-wave-1" aria-hidden />
          <div className="hero-wave hero-wave-2" aria-hidden />
          <div className="hero-wave hero-wave-3" aria-hidden />
          {/* Grid: faded at center, strong at edges */}
          <div className="absolute inset-0 bg-dot-pattern-vignette pointer-events-none" aria-hidden />
          {/* Headline glow - large, blurred blue/purple */}
          <div className="hero-headline-glow-bg" aria-hidden />
          {/* Focal glow behind headline */}
          <div className="hero-glow" aria-hidden />
          {/* CTA glow - stronger */}
          <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 w-[28rem] h-36 rounded-full blur-[80px] opacity-50 pointer-events-none bg-blue-500/50" aria-hidden />
          <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 w-64 h-24 rounded-full blur-[48px] opacity-40 pointer-events-none bg-violet-400/40" aria-hidden />

          {/* Floating product preview - large, layered, overlapping */}
          <div className="hero-schedule-card hidden lg:block" aria-hidden>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Weekly schedule</div>
            <div className="flex gap-2 mb-3">
              <div className="h-3 rounded-lg bg-amber-300/90 flex-1 max-w-[40px]" />
              <div className="h-3 rounded-lg bg-amber-200/90 flex-1 max-w-[24px]" />
              <div className="h-3 rounded-lg bg-emerald-300/90 flex-1 max-w-[32px]" />
              <div className="h-3 rounded-lg bg-blue-400/90 flex-1" />
              <div className="h-3 rounded-lg bg-emerald-200/80 flex-1 max-w-[20px]" />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => (
                <div key={i} className="rounded-lg bg-slate-100/95 h-14 flex items-center justify-center text-xs font-bold text-slate-600">
                  {d}
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
              <span>6am</span>
              <span>6pm</span>
            </div>
          </div>

          <div className="relative w-full max-w-3xl mx-auto text-center z-10">
            <h1
              className={`hero-reveal hero-reveal-delay-1 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.08] hero-headline-glow`}
            >
              Schedule across time zones and prepare better meetings.
            </h1>
            <p className="hero-reveal hero-reveal-delay-2 mt-8 text-xl sm:text-2xl text-slate-700 leading-relaxed max-w-2xl mx-auto font-semibold">
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

        {/* Product showcase - cinematic stage */}
        <section className="relative px-5 sm:px-6 py-24 sm:py-32 overflow-hidden section-tint border-b border-slate-200/80">
          <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-40" aria-hidden />
          <div className="absolute inset-0 bg-signal-grid pointer-events-none opacity-30" aria-hidden />
          <div className="relative max-w-5xl mx-auto showcase-stage">
            <h2 className="relative text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight text-center mb-4">
              Your schedule, at a glance
            </h2>
            <p className="relative text-base sm:text-lg text-slate-600 text-center max-w-2xl mx-auto mb-16 font-medium">
              Weekly view with busy blocks, open gaps, and your selected meeting—designed for clarity.
            </p>
            <ScrollReveal className="relative z-10 showcase-frame overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 aspect-[16/10] max-h-[520px] flex items-center justify-center p-4 sm:p-10">
              {/* Premium dashboard mockup */}
              <div className="w-full h-full max-w-4xl mx-auto rounded-xl surface-glass border border-slate-200/90 shadow-2xl shadow-slate-900/15 flex flex-col overflow-hidden">
                <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-slate-200/80 bg-slate-50/80">
                  <div className="flex gap-1.5">
                    {["#ef4444","#f59e0b","#22c55e"].map((c,i) => <div key={i} className="w-3 h-3 rounded-full" style={{background:c}} />)}
                  </div>
                  <span className="text-xs font-medium text-slate-500">SyncPrep — Schedule</span>
                </div>
                <div className="flex-1 p-4 sm:p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-32 rounded-lg bg-slate-200/80" />
                    <div className="flex gap-2">
                      <div className="h-8 w-20 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold">Week</div>
                      <div className="h-8 w-20 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-medium">Month</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 flex-1 min-h-0">
                    {["Mon","Tue","Wed","Thu","Fri"].map((d,i) => (
                      <div key={d} className="rounded-lg bg-slate-50/90 border border-slate-200/60 flex flex-col gap-1 p-2">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">{d}</div>
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="h-4 rounded bg-amber-200/90" />
                          <div className="h-4 rounded bg-amber-100/90 flex-1 max-h-6" />
                          <div className="h-4 rounded bg-emerald-300/80" />
                          <div className="h-4 rounded bg-blue-400/90" />
                          <div className="h-4 rounded bg-emerald-200/70 flex-1 max-h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                    <span>6:00 AM</span>
                    <span>6:00 PM</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Product explanation - tinted cards */}
        <section className="relative px-5 sm:px-6 py-24 sm:py-28 overflow-hidden section-tint border-b border-slate-200/60">
          <div className="absolute inset-0 bg-signal-grid pointer-events-none opacity-80" aria-hidden />
          <div className="relative max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-center mb-16">
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
                  className={`rounded-2xl border-2 border-slate-200/90 bg-gradient-to-br ${item.bg} p-7 shadow-xl shadow-slate-900/8 hover:shadow-2xl hover:-translate-y-2.5 ${item.border} transition-all duration-350 card-hover card-glow group animate-fade-up`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.iconBg} flex items-center justify-center mx-auto mb-5 text-white shadow-xl ${item.iconShadow} group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300`}>
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

        {/* How it works */}
        <section
          id="how-it-works"
          className="relative px-5 sm:px-6 py-24 sm:py-28 scroll-mt-6 overflow-hidden section-light border-b border-slate-200/80"
        >
          <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-50" aria-hidden />
          <div className="absolute inset-0 bg-signal-lines pointer-events-none opacity-50" aria-hidden />
          <div className="relative max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-center mb-16">
              How it works
            </h2>
            <ol className="space-y-12">
              {[
                { n: 1, title: "Import your calendar", desc: "Connect Google Calendar. Your events block busy times; availability is calculated from your calendar and working hours.", color: "from-blue-600 to-indigo-600", shadow: "shadow-blue-500/30" },
                { n: 2, title: "Find the best meeting time", desc: "Enter both time zones and working hours. See overlapping slots, choose one, and add it to Google Calendar.", color: "from-cyan-500 to-blue-600", shadow: "shadow-cyan-500/30" },
                { n: 3, title: "Generate your meeting brief", desc: "Choose meeting type, add context or resume, and generate a brief you can use in the call.", color: "from-violet-500 to-indigo-600", shadow: "shadow-violet-500/30" },
              ].map(({ n, title, desc, color, shadow }, i) => (
                <li key={n} className="flex gap-6 items-start animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <span className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${color} text-white flex items-center justify-center text-xl font-bold shadow-xl ${shadow} ring-2 ring-white/30`}>
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

        {/* Feature highlights - premium cards with tinted icons */}
        <section className="relative px-5 sm:px-6 py-24 sm:py-28 overflow-hidden section-tint border-b border-slate-200/80">
          <div className="absolute inset-0 bg-signal-grid pointer-events-none opacity-60" aria-hidden />
          <div className="relative max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-center mb-16">
              Built for how you work
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Google Calendar import", desc: "Your events become busy blocks; open gaps stay visible so you never double-book.", icon: "calendar", iconBg: "from-blue-500 to-indigo-600", iconShadow: "shadow-blue-500/25", cardBg: "from-blue-50/60 to-white" },
                { title: "Time zone–aware scheduling", desc: "Both time zones and working hours in one place—suggested times shown in each person's local time.", icon: "clock", iconBg: "from-cyan-500 to-blue-600", iconShadow: "shadow-cyan-500/25", cardBg: "from-cyan-50/60 to-white" },
                { title: "Availability detection", desc: "Working hours minus calendar events = your real free slots, shown in a clear weekly grid.", icon: "grid", iconBg: "from-emerald-500 to-teal-600", iconShadow: "shadow-emerald-500/25", cardBg: "from-emerald-50/60 to-white" },
                { title: "Meeting brief", desc: "Interview, networking, or general meeting—get talking points, strengths to highlight, and questions to prepare.", icon: "document", iconBg: "from-violet-500 to-indigo-600", iconShadow: "shadow-violet-500/25", cardBg: "from-violet-50/60 to-white" },
                { title: "Weekly schedule preview", desc: "A visual week view: busy blocks, open gaps, and your selected meeting so you see your week at a glance.", icon: "schedule", iconBg: "from-indigo-500 to-violet-600", iconShadow: "shadow-indigo-500/25", cardBg: "from-indigo-50/60 to-white", wide: true },
              ].map(({ title, desc, icon, iconBg, iconShadow, cardBg, wide }, i) => (
                <div
                  key={title}
                  className={`group rounded-2xl border-2 border-slate-200/90 bg-gradient-to-br ${cardBg} p-6 shadow-xl shadow-slate-900/8 hover:shadow-2xl card-hover card-glow ${wide ? "sm:col-span-2 lg:col-span-1" : ""} animate-fade-up`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center mb-4 shadow-xl ${iconShadow} ring-2 ring-white/20 group-hover:scale-105 group-hover:shadow-2xl transition-all duration-300`}>
                    {icon === "calendar" && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    {icon === "clock" && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {icon === "grid" && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>}
                    {icon === "document" && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                    {icon === "schedule" && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>}
                  </div>
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

        {/* Final CTA - strong glow and hierarchy */}
        <section className="relative px-5 sm:px-6 py-32 sm:py-40 overflow-hidden section-accent border-t border-slate-200/80">
          <div className="absolute inset-0 bg-hero-gradient pointer-events-none opacity-100" aria-hidden />
          <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-25" aria-hidden />
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[32rem] h-48 rounded-full blur-[100px] opacity-40 pointer-events-none bg-blue-400/30" aria-hidden />
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full blur-[80px] opacity-25 pointer-events-none bg-violet-400/25" aria-hidden />
          <div className="relative max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-slate-900 tracking-tight">
              Ready to schedule and prep?
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-slate-700 leading-relaxed font-medium">
              Built for students, job seekers, and professionals scheduling
              interviews, networking calls, and remote meetings.
            </p>
            <div className="mt-14 relative inline-block">
              <div className="absolute -inset-4 rounded-2xl bg-blue-500/20 blur-2xl pointer-events-none" aria-hidden />
              <Link
                href="/schedule"
                className={`${primaryButtonClass} relative inline-flex`}
              >
                Open SyncPrep
              </Link>
            </div>
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
