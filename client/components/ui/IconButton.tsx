import { ButtonHTMLAttributes, forwardRef } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ label, className = "", children, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        className={`inline-flex items-center justify-center rounded-md p-2 text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-40 ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
