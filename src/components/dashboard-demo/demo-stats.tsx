import type {ReactNode} from 'react';

type Stat = {label: string; value: string; icon: ReactNode};

type Props = {
  stats: Stat[];
  /** First tile is the filled orange hero (Sunrise-warmth pattern). */
  hero?: boolean;
  /** Grid template override, e.g. four tiles on wide screens. */
  gridClassName?: string;
  delay?: number;
};

/** Warm stat tiles: first filled with the orange gradient, rest white. */
export function DemoStats({stats, hero = true, gridClassName, delay = 80}: Props) {
  return (
    <section
      style={{animationDelay: `${delay}ms`}}
      className={`animate-rise grid grid-cols-2 gap-[18px] ${gridClassName ?? 'sm:grid-cols-3'}`}
    >
      {stats.map(({label, value, icon}, index) => {
        const isHero = hero && index === 0;
        return (
          <div
            key={label}
            className={`flex min-h-[130px] flex-col justify-between gap-4 rounded-[20px] p-[22px] ${
              isHero ? 'sunrise-gradient text-white shadow-warm-strong' : 'bg-surface shadow-warm'
            }`}
          >
            <span className="flex items-start justify-between gap-2">
              <span
                className={`text-xs leading-relaxed ${isHero ? 'text-white/[0.88]' : 'text-warm-muted'}`}
              >
                {label}
              </span>
              <span
                className={`grid size-[38px] shrink-0 place-items-center rounded-full ${
                  isHero ? 'bg-white/[0.22] text-white' : 'bg-warm-chip text-brand-strong'
                }`}
              >
                {icon}
              </span>
            </span>
            <span className="text-2xl font-semibold leading-none tracking-[-0.03em] tabular-nums sm:text-[32px]">
              {value}
            </span>
          </div>
        );
      })}
    </section>
  );
}
