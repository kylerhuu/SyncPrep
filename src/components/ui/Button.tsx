import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
  className?: string;
}

const variants = {
  primary:
    "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-lg shadow-[var(--accent-glow)] hover:shadow-[var(--accent-glow)] hover:-translate-y-0.5 active:translate-y-0 border border-transparent",
  secondary:
    "bg-transparent text-[var(--foreground)] hover:bg-white/5 border border-[var(--border-strong)] hover:border-white/20 hover:-translate-y-0.5 active:translate-y-0",
  ghost:
    "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-white/5 active:bg-white/10 border border-transparent",
};

export function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center min-h-[40px] rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
