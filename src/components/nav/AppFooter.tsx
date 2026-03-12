import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 py-5 bg-white/50">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 flex items-center justify-center sm:justify-end gap-6">
        <Link
          href="/privacy"
          className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          Privacy
        </Link>
        <Link
          href="/terms"
          className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          Terms
        </Link>
      </div>
    </footer>
  );
}
