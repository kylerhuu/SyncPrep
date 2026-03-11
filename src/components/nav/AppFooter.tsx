import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 py-4">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 flex items-center justify-center sm:justify-end">
        <Link
          href="/privacy"
          className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          Privacy
        </Link>
      </div>
    </footer>
  );
}
