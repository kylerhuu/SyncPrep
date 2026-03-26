import { ReactNode } from "react";

interface CardProps {
  title?: string;
  icon?: ReactNode;
  /** Optional action (e.g. button) shown at the end of the header. */
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Use for AI/meeting brief cards - adds accent tint */
  variant?: "default" | "ai";
}

export function Card({ title, icon, headerAction, children, className = "", variant = "default" }: CardProps) {
  const isAi = variant === "ai";
  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all duration-200 ${
        isAi 
          ? "border-[var(--border-accent)] bg-[var(--background-card)] shadow-lg shadow-[var(--accent-glow)]/10" 
          : "border-[var(--border)] bg-[var(--background-card)] hover:border-[var(--border-strong)]"
      } ${className}`}
    >
      {title && (
        <div className={`border-b border-[var(--border)] px-4 py-3 flex items-center justify-between gap-2.5 ${
          isAi ? "bg-[var(--accent-soft)]" : "bg-[var(--background-elevated)]"
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && <span className="text-[var(--accent)]">{icon}</span>}
            <h2 className="text-sm font-semibold text-[var(--foreground)] truncate">
              {title}
            </h2>
          </div>
          {headerAction != null ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
