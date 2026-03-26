"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, LayoutGrid, Home } from "lucide-react";

export function AppNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="nav-dark sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-5 py-3.5 sm:px-6 flex items-center justify-between">
        <Link
          href="/schedule"
          className="text-lg font-bold tracking-tight text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
        >
          SyncPrep
        </Link>
        
        <div className="flex items-center gap-1">
          <Link 
            href="/" 
            className={`nav-link flex items-center gap-2 ${isActive("/") ? "nav-link-active" : ""}`}
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link
            href="/schedule"
            className={`nav-link flex items-center gap-2 ${isActive("/schedule") ? "nav-link-active" : ""}`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule</span>
          </Link>
          <Link
            href="/calendar"
            className={`nav-link flex items-center gap-2 ${isActive("/calendar") ? "nav-link-active" : ""}`}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Calendar</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
