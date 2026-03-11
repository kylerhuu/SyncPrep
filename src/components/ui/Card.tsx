import { ReactNode } from "react";

interface CardProps {
  title?: string;
  icon?: ReactNode;
  /** Optional action (e.g. button) shown at the end of the header. */
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, icon, headerAction, children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-[var(--card-bg)] shadow-sm overflow-hidden ${className}`}
    >
      {title && (
        <div className="border-b border-slate-200/80 px-5 py-4 bg-slate-50/95 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon}
            <h2 className="text-sm font-semibold tracking-tight text-slate-800 truncate">
              {title}
            </h2>
          </div>
          {headerAction != null ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
