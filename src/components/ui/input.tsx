import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full min-h-12 rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--bg)] px-3 text-base text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--fg)] ${className}`}
      {...props}
    />
  );
}
