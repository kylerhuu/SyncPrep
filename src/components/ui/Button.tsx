import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
  className?: string;
}

const variants = {
  primary:
    "bg-gradient-to-b from-[var(--accent-blue)] to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 border border-transparent",
  secondary:
    "bg-white text-slate-800 hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
  ghost:
    "text-slate-700 hover:bg-slate-100 active:bg-slate-200 border border-transparent",
};

export function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center min-h-[40px] rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-250 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
