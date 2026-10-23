import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex min-h-12 items-center justify-center rounded-[var(--radius-pill)] px-5 py-2 text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-[var(--invert-bg)] text-[var(--invert-fg)]"
      : "border border-[var(--line-strong)] text-[var(--fg)]";
  return <button type={type} className={`${base} ${styles} ${className}`} {...props} />;
}
