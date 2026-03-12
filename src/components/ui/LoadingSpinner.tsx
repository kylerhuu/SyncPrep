interface LoadingSpinnerProps {
  size?: "sm" | "md";
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  label,
  className = "",
}: LoadingSpinnerProps) {
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div
      className={`flex items-center gap-3 ${className}`}
      role="status"
      aria-label={label ?? "Loading"}
    >
      <span
        className={`inline-block ${sizeClass} shrink-0 animate-spin rounded-full border-2 border-slate-200/80 border-t-[var(--accent-blue)]`}
        aria-hidden
      />
      {label && (
        <span className="text-sm text-slate-500">{label}</span>
      )}
    </div>
  );
}
