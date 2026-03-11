import Link from "next/link";

const navLinkClass =
  "text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors";
const primaryButtonClass =
  "inline-flex items-center justify-center min-h-[36px] rounded-lg px-4 py-2 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 border border-transparent transition-colors";

export function MarketingNav() {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
      <nav className="max-w-6xl mx-auto px-5 py-3.5 sm:px-6 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-slate-900"
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
