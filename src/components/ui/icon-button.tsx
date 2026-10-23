import type { ButtonHTMLAttributes } from "react";

/** Compact control for row actions (move, rename, delete, availability). */
export function IconButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-9 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--line-strong)] px-3 text-xs text-[var(--fg)] transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
