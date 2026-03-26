import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="footer-dark mt-auto">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--foreground-muted)]">
          SyncPrep
        </span>
        <div className="flex items-center gap-6">
          <Link
            href="/privacy"
            className="footer-link"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="footer-link"
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
