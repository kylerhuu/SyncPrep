import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`input-dark ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/25" : ""} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-2 text-xs text-red-400 font-medium" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
