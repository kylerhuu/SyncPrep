import { ReactNode } from "react";

export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="border-b border-gray-100 px-4 py-3 bg-gray-50/80">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
