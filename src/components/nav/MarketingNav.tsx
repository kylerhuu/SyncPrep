import Link from "next/link";

const navLinkClass =
  "text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200";
const primaryButtonClass =
  "inline-flex items-center justify-center min-h-[36px] rounded-lg px-4 py-2 text-sm font-semibold bg-[var(--accent-navy)] text-white hover:bg-slate-800 border border-transparent shadow-md shadow-slate-900/10 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200";

export function MarketingNav() {
  return (
    <header className="border-b border-black/5 bg-white/60 backdrop-blur-[12px] sticky top-0 z-10">
      <nav className="max-w-6xl mx-auto px-5 py-3.5 sm:px-6 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-slate-900 hover:text-slate-700 transition-colors"
        >
          SyncPrep
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className={navLinkClass}>
            Home
          </Link>
          <Link href="/calendar" className={navLinkClass}>
            Weekly schedule
          </Link>
          <Link href="/schedule" className={primaryButtonClass}>
            Open app
          </Link>
        </div>
      </nav>
    </header>
  );
}
