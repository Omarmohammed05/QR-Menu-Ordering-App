/**
 * Demo page header — Sunrise-warmth treatment: title, tagline, and the
 * signature gradient tick. Delays stagger with the sections below.
 */
export function DemoHeader({
  title,
  tagline,
  delay = 0
}: {
  title: string;
  tagline?: string;
  delay?: number;
}) {
  return (
    <header style={{animationDelay: `${delay}ms`}} className="animate-rise flex flex-col gap-1.5">
      <h1 className="text-2xl font-semibold leading-[1.2] tracking-[-0.02em] sm:text-[28px]">
        {title}
      </h1>
      {tagline ? <p className="text-sm leading-relaxed text-warm-muted">{tagline}</p> : null}
      <i className="tick" />
    </header>
  );
}
