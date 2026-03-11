import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
  className?: string;
}

const variants = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 border border-transparent",
  secondary:
    "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-200",
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
      className={`inline-flex items-center justify-center min-h-[40px] rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
