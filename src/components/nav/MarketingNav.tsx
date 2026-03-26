import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function MarketingNav() {
  return (
    <header className="nav-dark sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-5 py-3.5 sm:px-6 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
        >
          SyncPrep
        </Link>
        
        <div className="flex items-center gap-2">
          <Link href="/" className="nav-link nav-link-active">
            Home
          </Link>
          <Link href="/calendar" className="nav-link">
            Calendar
          </Link>
          <Link href="/schedule" className="nav-cta flex items-center gap-1.5">
            Open App
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
