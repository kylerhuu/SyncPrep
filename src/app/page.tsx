import Link from "next/link";
import { MarketingNav } from "@/components/nav/MarketingNav";
import { ScheduleBackground } from "@/components/ui/ScheduleBackground";

export default function HomePage() {
  return (
    <div className="schedule-dark-tech min-h-screen flex flex-col">
      <div className="schedule-bg-layer" aria-hidden>
        <ScheduleBackground />
      </div>
      <div className="schedule-content relative z-10 flex flex-col flex-1">
        <MarketingNav />

        <main className="flex-1">
          {/* Hero — two columns: copy left, product preview right */}
          <section className="relative px-5 sm:px-6 py-20 sm:py-28 lg:py-32 overflow-hidden">
            <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-[1fr_minmax(420px,1fr)] lg:gap-12 lg:items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-[#E8EDF5] leading-[1.1]">
                  Schedule across time zones and prepare better meetings.
                </h1>
                <p className="mt-6 text-base sm:text-lg text-[#9FB0C6] leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Import your calendar, find the best overlap with anyone’s time zone, and generate an AI meeting brief—built for interviews, networking calls, and remote meetings.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link
                    href="/schedule"
                    className="inline-flex items-center justify-center min-h-[52px] rounded-xl px-8 py-3.5 text-base font-semibold bg-[#ff7a18] text-white hover:bg-[#e66d0f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a18]/50 focus-visible:ring-offset-2 ring-offset-[#0c0f18] transition-all duration-200 shadow-lg shadow-[#ff7a18]/20 w-full sm:w-auto"
                  >
                    Start scheduling
                  </Link>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center justify-center min-h-[52px] rounded-xl px-8 py-3.5 text-base font-medium text-[#E8EDF5] border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-200 w-full sm:w-auto"
                  >
                    See how it works
                  </a>
                </div>
              </div>
              <div className="mt-12 lg:mt-0 flex justify-center lg:justify-end">
                <div className="home-hero-preview rounded-2xl overflow-hidden w-full max-w-[480px] aspect-[4/3] flex">
                  {/* Product preview: weekly grid + side panel */}
                  <div className="flex-1 flex flex-col min-w-0 p-3 border-r border-white/5">
                    <p className="text-[10px] font-semibold text-[#9FB0C6] uppercase tracking-wider mb-2">Weekly schedule</p>
                    <div className="flex gap-1 mb-2">
                      {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
                        <div key={d} className="flex-1 rounded bg-white/5 py-1.5 text-center text-[10px] font-medium text-[#9FB0C6]">
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-5 gap-1 flex-1 min-h-0">
                      {[0, 1, 2, 3, 4].map((col) => (
                        <div key={col} className="flex flex-col gap-0.5">
                          <div className="h-2 rounded bg-amber-500/40 flex-shrink-0" />
                          <div className="h-2 rounded bg-amber-400/30 flex-shrink-0 w-3/4" />
                          <div className="flex-1 min-h-[4px] rounded bg-white/5" />
                          <div className="h-2 rounded bg-[#ff7a18]/50 flex-shrink-0 w-2/3" />
                          <div className="h-2 rounded bg-emerald-500/30 flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] text-[#6b7c94] mt-1">6am – 8pm</p>
                  </div>
                  <div className="w-[38%] min-w-[140px] flex flex-col bg-[#111827]/80 p-3">
                    <p className="text-[10px] font-semibold text-[#E8EDF5] mb-2">Add to calendar</p>
                    <div className="rounded-lg bg-white/5 border border-white/5 p-2 space-y-1.5">
                      <div className="h-2 rounded bg-white/10 w-full" />
                      <div className="h-2 rounded bg-white/5 w-4/5" />
                      <div className="h-6 rounded bg-[#ff7a18]/30 border border-[#ff7a18]/40 flex items-center justify-center mt-2">
                        <span className="text-[9px] font-semibold text-[#ff7a18]">Create event</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Product workflow — 3 steps with UI previews */}
          <section id="how-it-works" className="relative px-5 sm:px-6 py-20 sm:py-28 scroll-mt-20">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#E8EDF5] text-center mb-4">
                Schedule and prep in one place
              </h2>
              <p className="text-[#9FB0C6] text-center max-w-xl mx-auto mb-16 text-sm sm:text-base">
                Three steps: connect, find overlap, generate your brief.
              </p>
              <ol className="space-y-10 sm:space-y-12">
                {[
                  {
                    step: 1,
                    title: "Connect your calendar",
                    desc: "Connect Google Calendar so your busy times are blocked and open slots stay visible.",
                    preview: (
                      <div className="home-workflow-card rounded-xl p-4 h-full min-h-[120px] flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-white/10" />
                          <div className="h-2 rounded bg-white/10 w-24" />
                        </div>
                        <div className="h-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-[#9FB0C6]">
                          Connect Google Calendar
                        </div>
                        <div className="mt-2 flex gap-1">
                          <div className="h-1.5 flex-1 rounded bg-white/5" />
                          <div className="h-1.5 flex-1 rounded bg-white/5" />
                        </div>
                      </div>
                    ),
                  },
                  {
                    step: 2,
                    title: "Find overlap automatically",
                    desc: "Enter both time zones and working hours. See overlapping slots in one view and pick a time.",
                    preview: (
                      <div className="home-workflow-card rounded-xl p-4 h-full min-h-[120px]">
                        <div className="grid grid-cols-5 gap-1 mb-2">
                          {["M", "T", "W", "T", "F"].map((d, i) => (
                            <div key={i} className="rounded bg-white/5 py-1 text-center text-[9px] text-[#9FB0C6]">{d}</div>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <div className="flex-1 flex flex-col gap-0.5">
                            <div className="h-1.5 rounded bg-amber-500/40" />
                            <div className="h-1.5 rounded bg-[#ff7a18]/50" />
                          </div>
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex-1 flex flex-col gap-0.5">
                              <div className="h-1.5 rounded bg-white/5" />
                              <div className="h-1.5 rounded bg-white/5" />
                            </div>
                          ))}
                        </div>
                        <p className="text-[9px] text-[#6b7c94] mt-2">Your time · Their time</p>
                      </div>
                    ),
                  },
                  {
                    step: 3,
                    title: "Generate meeting prep",
                    desc: "One click to generate your meeting brief—talking points, strengths to highlight, and questions to prepare.",
                    preview: (
                      <div className="home-workflow-card rounded-xl p-4 h-full min-h-[120px]">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded bg-[#ff7a18]/20" />
                          <span className="text-[10px] font-semibold text-[#E8EDF5]">Meeting brief</span>
                        </div>
                        <ul className="space-y-1 text-[9px] text-[#9FB0C6]">
                          <li className="flex gap-1.5"><span className="text-[#ff7a18]">•</span> Talking points</li>
                          <li className="flex gap-1.5"><span className="text-[#ff7a18]">•</span> Likely questions</li>
                          <li className="flex gap-1.5"><span className="text-[#ff7a18]">•</span> Strengths to highlight</li>
                        </ul>
                        <div className="mt-2 h-6 rounded bg-[#ff7a18]/20 border border-[#ff7a18]/30 flex items-center justify-center">
                          <span className="text-[9px] font-semibold text-[#ff7a18]">Generate</span>
                        </div>
                      </div>
                    ),
                  },
                ].map(({ step, title, desc, preview }) => (
                  <li key={step} className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#ff7a18] text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-[#ff7a18]/25">
                      {step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-[#E8EDF5] mb-2">{title}</h3>
                      <p className="text-sm text-[#9FB0C6] leading-relaxed mb-4">{desc}</p>
                      <div className="max-w-[280px]">{preview}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Feature highlights — 3 horizontal sections */}
          <section className="relative px-5 sm:px-6 py-20 sm:py-28">
            <div className="max-w-5xl mx-auto space-y-24">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#E8EDF5] text-center mb-16">
                Built for how you work
              </h2>

              {[
                {
                  title: "Time zone overlap grid",
                  desc: "See both time zones and working hours in one place. Suggested meeting times appear in each person’s local time so no one has to do the math.",
                  preview: (
                    <div className="home-feature-card rounded-2xl overflow-hidden p-4 aspect-[16/10] max-h-[280px] flex">
                      <div className="flex-1 grid grid-cols-5 gap-2">
                        {[0, 1, 2, 3, 4].map((c) => (
                          <div key={c} className="rounded-lg bg-white/5 border border-white/5 p-2 flex flex-col gap-1">
                            <div className="text-[10px] font-medium text-[#9FB0C6]">Day {c + 1}</div>
                            <div className="h-3 rounded bg-amber-500/30" />
                            <div className="h-3 rounded bg-[#ff7a18]/40" />
                            <div className="flex-1 min-h-2 rounded bg-white/5" />
                          </div>
                        ))}
                      </div>
                      <div className="w-1/4 rounded-lg bg-[#111827] border border-white/5 p-2 flex flex-col justify-center items-center">
                        <span className="text-[10px] text-[#ff7a18] font-semibold">Selected</span>
                      </div>
                    </div>
                  ),
                },
                {
                  title: "Side panel event creation",
                  desc: "Pick a slot and add the event without leaving the page. Meeting title, notes, attendees, and duration—then create in Google Calendar or open the link.",
                  preview: (
                    <div className="home-feature-card rounded-2xl overflow-hidden p-4 aspect-[16/10] max-h-[280px] flex gap-3">
                      <div className="flex-1 rounded-lg bg-white/5 border border-white/5 p-3 space-y-2">
                        <div className="h-2 rounded bg-white/10 w-1/3" />
                        <div className="h-2 rounded bg-white/5 w-full" />
                        <div className="h-2 rounded bg-white/5 w-2/3" />
                      </div>
                      <div className="w-2/5 rounded-lg bg-[#111827] border border-white/10 p-3 flex flex-col gap-2">
                        <div className="h-2 rounded bg-white/10 w-full" />
                        <div className="h-2 rounded bg-white/5 w-full" />
                        <div className="mt-auto h-8 rounded-lg bg-[#ff7a18]/30 border border-[#ff7a18]/50 flex items-center justify-center">
                          <span className="text-xs font-semibold text-[#ff7a18]">Create event</span>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  title: "AI meeting prep output",
                  desc: "Get a structured brief: meeting overview, talking points, likely questions, strengths to highlight, and topics to review. Tailored for interviews, networking, and team meetings.",
                  preview: (
                    <div className="home-feature-card rounded-2xl overflow-hidden p-4 aspect-[16/10] max-h-[280px] flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#ff7a18]/20" />
                        <span className="text-sm font-semibold text-[#E8EDF5]">Meeting brief</span>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-2 text-[10px] text-[#9FB0C6]">
                        <div className="rounded bg-white/5 p-2">Overview</div>
                        <div className="rounded bg-white/5 p-2">Talking points</div>
                        <div className="rounded bg-white/5 p-2">Questions</div>
                        <div className="rounded bg-white/5 p-2">Strengths</div>
                      </div>
                    </div>
                  ),
                },
              ].map(({ title, desc, preview }, i) => (
                <div
                  key={title}
                  className={`flex flex-col ${i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} gap-8 lg:gap-12 items-center`}
                >
                  <div className="flex-1 min-w-0 w-full">
                    <h3 className="text-xl font-semibold text-[#E8EDF5] mb-3">{title}</h3>
                    <p className="text-sm text-[#9FB0C6] leading-relaxed">{desc}</p>
                  </div>
                  <div className="flex-1 w-full max-w-lg">{preview}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="relative px-5 sm:px-6 py-24 sm:py-32">
            <div className="absolute inset-0 bg-gradient-to-t from-[#ff7a18]/05 via-transparent to-transparent pointer-events-none" aria-hidden />
            <div className="relative max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#E8EDF5]">
                Ready to schedule and prep?
              </h2>
              <p className="mt-6 text-base sm:text-lg text-[#9FB0C6] leading-relaxed">
                Built for students, job seekers, and professionals scheduling interviews, networking calls, and remote meetings.
              </p>
              <div className="mt-12">
                <Link
                  href="/schedule"
                  className="inline-flex items-center justify-center min-h-[56px] rounded-xl px-10 py-4 text-base font-semibold bg-[#ff7a18] text-white hover:bg-[#e66d0f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a18]/50 focus-visible:ring-offset-2 ring-offset-[#0c0f18] transition-all duration-200 shadow-xl shadow-[#ff7a18]/25 hover:shadow-[#ff7a18]/30"
                >
                  Open app
                </Link>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/5 py-6 bg-[#080b12]/80">
          <div className="max-w-6xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <span className="text-sm font-semibold text-[#E8EDF5]">SyncPrep</span>
              <Link href="/privacy" className="text-sm text-[#9FB0C6] hover:text-[#E8EDF5] transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-[#9FB0C6] hover:text-[#E8EDF5] transition-colors">
                Terms
              </Link>
            </div>
            <Link href="/schedule" className="text-sm font-medium text-[#9FB0C6] hover:text-[#ff7a18] transition-colors">
              Open app →
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
