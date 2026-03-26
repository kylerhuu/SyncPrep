import Link from "next/link";
import { Calendar, Clock, Sparkles, ArrowRight, CheckCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="page-dark">
      {/* Background effects */}
      <div className="page-grid" aria-hidden />
      
      {/* Content */}
      <div className="page-content flex flex-col min-h-screen">
        {/* Navigation */}
        <header className="nav-dark sticky top-0 z-50">
          <nav className="max-w-6xl mx-auto px-5 py-4 sm:px-6 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-[var(--foreground)] tracking-tight">
              SyncPrep
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/" className="nav-link nav-link-active">Home</Link>
              <Link href="/calendar" className="nav-link">Calendar</Link>
              <Link href="/schedule" className="nav-cta">
                Open App
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="flex-1">
          <section className="py-20 sm:py-28 lg:py-36 px-5 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                {/* Left: Copy */}
                <div className="animate-fade-in">
                  <div className="inline-flex items-center gap-2 bg-[var(--accent-soft)] text-[var(--accent)] px-3 py-1.5 rounded-full text-sm font-medium mb-6">
                    <Sparkles className="w-4 h-4" />
                    AI-Powered Meeting Prep
                  </div>
                  
                  <h1 className="hero-headline">
                    Schedule across time zones.{" "}
                    <span className="text-[var(--accent)]">Prepare smarter.</span>
                  </h1>
                  
                  <p className="hero-subheadline">
                    Import your calendar, find the perfect overlap with anyone&apos;s time zone, 
                    and generate AI meeting briefs—built for interviews, networking, and remote work.
                  </p>
                  
                  <div className="hero-cta-group">
                    <Link href="/schedule" className="btn-primary">
                      Start Scheduling
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <a href="#features" className="btn-secondary">
                      See How It Works
                    </a>
                  </div>

                  {/* Social proof */}
                  <div className="mt-10 flex items-center gap-6 text-sm text-[var(--foreground-muted)]">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                      <span>Free to use</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                      <span>No signup required</span>
                    </div>
                  </div>
                </div>

                {/* Right: Product Preview */}
                <div className="animate-fade-in animate-fade-in-delay-2">
                  <div className="preview-card">
                    <div className="preview-header">
                      <div className="preview-dot bg-red-500/80" />
                      <div className="preview-dot bg-yellow-500/80" />
                      <div className="preview-dot bg-green-500/80" />
                      <span className="ml-2 text-xs text-[var(--foreground-subtle)]">SyncPrep</span>
                    </div>
                    <div className="preview-body">
                      {/* Mini calendar preview */}
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <p className="text-[10px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-3">
                            Weekly Schedule
                          </p>
                          <div className="calendar-grid">
                            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                              <div key={day} className="calendar-day-header">{day}</div>
                            ))}
                            {Array.from({ length: 15 }).map((_, i) => (
                              <div 
                                key={i} 
                                className={`calendar-time-block ${
                                  i % 3 === 0 ? "calendar-time-busy" : 
                                  i % 3 === 1 ? "calendar-time-available" : 
                                  "calendar-time-overlap"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-[9px] text-[var(--foreground-subtle)] mt-2">9am – 6pm</p>
                        </div>
                        <div className="w-[45%] bg-[var(--background)] rounded-lg border border-[var(--border)] p-3">
                          <p className="text-[10px] font-semibold text-[var(--foreground)] mb-2">
                            Selected Time
                          </p>
                          <div className="space-y-2">
                            <div className="h-2 rounded bg-[var(--foreground-subtle)]/20 w-full" />
                            <div className="h-2 rounded bg-[var(--foreground-subtle)]/10 w-3/4" />
                            <button className="w-full mt-2 h-7 rounded bg-[var(--accent)] text-white text-[10px] font-semibold flex items-center justify-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Create Event
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section id="features" className="py-20 sm:py-28 px-5 sm:px-6 scroll-mt-20">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
                  Three steps to better meetings
                </h2>
                <p className="mt-4 text-[var(--foreground-muted)] max-w-xl mx-auto">
                  Connect your calendar, find overlap, and get prepared—all in one place.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  {
                    step: 1,
                    title: "Connect your calendar",
                    description: "Link your Google Calendar to automatically block busy times and show available slots.",
                    icon: Calendar,
                  },
                  {
                    step: 2,
                    title: "Find time zone overlap",
                    description: "Enter both time zones and working hours. See overlapping availability at a glance.",
                    icon: Clock,
                  },
                  {
                    step: 3,
                    title: "Generate your brief",
                    description: "Get AI-powered talking points, likely questions, and preparation notes for any meeting.",
                    icon: Sparkles,
                  },
                ].map(({ step, title, description, icon: Icon }) => (
                  <div 
                    key={step} 
                    className="section-card flex items-start gap-5 animate-fade-in"
                    style={{ animationDelay: `${step * 0.1}s` }}
                  >
                    <div className="step-badge">{step}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="w-5 h-5 text-[var(--accent)]" />
                        <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
                      </div>
                      <p className="text-[var(--foreground-muted)] leading-relaxed">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-20 sm:py-28 px-5 sm:px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
                  Built for how you work
                </h2>
                <p className="mt-4 text-[var(--foreground-muted)] max-w-xl mx-auto">
                  Every feature designed to save you time and reduce meeting anxiety.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: "Visual Time Grid",
                    description: "See both time zones side by side with working hours highlighted.",
                    icon: "grid",
                  },
                  {
                    title: "Smart Suggestions",
                    description: "AI ranks the best meeting times based on both schedules.",
                    icon: "sparkle",
                  },
                  {
                    title: "One-Click Events",
                    description: "Create calendar events directly without switching apps.",
                    icon: "calendar",
                  },
                  {
                    title: "Interview Prep",
                    description: "Tailored briefs for interviews, networking, and team meetings.",
                    icon: "brief",
                  },
                  {
                    title: "Working Hours",
                    description: "Set your availability and let others know when you&apos;re free.",
                    icon: "clock",
                  },
                  {
                    title: "No Account Needed",
                    description: "Start scheduling immediately—no signup required.",
                    icon: "check",
                  },
                ].map((feature, i) => (
                  <div 
                    key={feature.title} 
                    className="feature-card"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="feature-icon">
                      {feature.icon === "grid" && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <rect x="3" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" />
                          <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                      )}
                      {feature.icon === "sparkle" && <Sparkles className="w-5 h-5" />}
                      {feature.icon === "calendar" && <Calendar className="w-5 h-5" />}
                      {feature.icon === "brief" && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      {feature.icon === "clock" && <Clock className="w-5 h-5" />}
                      {feature.icon === "check" && <CheckCircle className="w-5 h-5" />}
                    </div>
                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-description">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-24 sm:py-32 px-5 sm:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--foreground)] tracking-tight">
                Ready to schedule smarter?
              </h2>
              <p className="mt-6 text-lg text-[var(--foreground-muted)] leading-relaxed">
                Built for students, job seekers, and professionals scheduling interviews, 
                networking calls, and remote meetings.
              </p>
              <div className="mt-10">
                <Link 
                  href="/schedule" 
                  className="btn-primary text-lg px-8 py-4"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="footer-dark">
          <div className="max-w-6xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <span className="text-sm font-semibold text-[var(--foreground)]">SyncPrep</span>
              <Link href="/privacy" className="footer-link">Privacy</Link>
              <Link href="/terms" className="footer-link">Terms</Link>
            </div>
            <Link href="/schedule" className="footer-link hover:text-[var(--accent)]">
              Open app →
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
