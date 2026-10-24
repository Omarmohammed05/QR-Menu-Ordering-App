import type {ReactNode} from 'react';

/** Warm white card — the demo's container rhythm. */
export function DemoCard({
  children,
  delay = 160,
  className = ''
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <section
      style={{animationDelay: `${delay}ms`}}
      className={`animate-rise rounded-[20px] bg-surface p-6 shadow-warm sm:p-7 ${className}`}
    >
      {children}
    </section>
  );
}
