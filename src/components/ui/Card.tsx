import { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-sm overflow-hidden ${className}`}
    >
      {title && (
        <div className="border-b border-[var(--border)] px-5 py-3.5 bg-slate-50/90">
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
