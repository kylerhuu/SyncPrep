"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinkClass =
  "text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors";
const navLinkActiveClass = "text-slate-900 font-semibold";

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
      <nav className="max-w-6xl mx-auto px-5 py-3.5 sm:px-6 flex items-center justify-between">
        <Link
          href="/schedule"
          className="text-lg font-semibold tracking-tight text-slate-900 hover:text-slate-700"
        >
          SyncPrep
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className={navLinkClass}>
            Home
          </Link>
          <Link
            href="/schedule"
            className={
              pathname === "/schedule" ? navLinkActiveClass : navLinkClass
            }
          >
            Schedule
          </Link>
          <Link
            href="/calendar"
            className={
              pathname === "/calendar" ? navLinkActiveClass : navLinkClass
            }
          >
            Calendar
          </Link>
        </div>
      </nav>
    </header>
  );
}
