import { ReactNode } from "react";

interface CardProps {
  title?: string;
  icon?: ReactNode;
  /** Optional action (e.g. button) shown at the end of the header. */
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Use for AI/meeting brief cards - adds subtle blue tint */
  variant?: "default" | "ai";
}

export function Card({ title, icon, headerAction, children, className = "", variant = "default" }: CardProps) {
  const isAi = variant === "ai";
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm card-hover ${isAi ? "bg-section-ai" : "bg-surface-elevated"} ${className}`}
    >
      {title && (
        <div className={`border-b border-slate-200/80 px-5 py-4 flex items-center justify-between gap-2.5 ${isAi ? "bg-gradient-to-r from-blue-50 via-indigo-50/80 to-white" : "bg-gradient-to-r from-slate-50 to-white"}`}>
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
