'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {CheckIcon} from '@/components/icons';
import {formatPrice} from '@/lib/format';
import {
  durationLabelParts,
  durationMonthlyPiastres,
  durationTotalPiastres,
  PLAN_FEATURE_COUNTS,
  PLAN_IDS,
  PLAN_PRICES
} from '@/lib/plans';
import type {SubscriptionDuration} from '@/server/db/repos';

/**
 * Interactive pricing grid: pick a billing duration (1m/3m/6m/1y or any
 * custom one the platform owner added) and every card re-prices with that
 * duration's discount — headline stays a per-month figure, with the
 * discounted total underneath.
 */
export function PricingGrid({
  locale,
  durations
}: {
  locale: string;
  durations: SubscriptionDuration[];
}) {
  const t = useTranslations('landing');
  const tDuration = useTranslations();
  const [selected, setSelected] = useState(durations[0]?.months ?? 1);
  const duration =
    durations.find((candidate) => candidate.months === selected) ?? durations[0];
  const durationLabel = duration
    ? durationLabelParts(duration.months)
    : {key: 'durations.months' as const, count: 1};
  const durationText = tDuration(durationLabel.key, {count: durationLabel.count});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">{t('pricing.durationLabel')}</span>
        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label={t('pricing.durationLabel')}>
          {durations.map((candidate) => {
            const label = durationLabelParts(candidate.months);
            const active = duration?.months === candidate.months;
            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => setSelected(candidate.months)}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'border-accent bg-accent text-white'
                    : 'border-hairline bg-surface hover:bg-muted'
                }`}
              >
                {tDuration(label.key, {count: label.count})}
                {candidate.discountPercent > 0 ? (
                  <span
                    className={`text-[11px] font-semibold ${
                      active ? 'text-white/90' : 'text-accent'
                    }`}
                  >
                    {t('pricing.discountBadge', {percent: candidate.discountPercent})}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLAN_IDS.map((id, index) => {
          const monthly = PLAN_PRICES[id];
          const featureCount = PLAN_FEATURE_COUNTS[id];
          const popular = id === 'pro';
          const effectiveMonthly = duration
            ? durationMonthlyPiastres(monthly, duration)
            : monthly;
          return (
            <div
              key={id}
              className={`relative flex flex-col gap-5 rounded-base border bg-surface p-6 ${
                popular ? 'border-accent' : 'border-hairline'
              }`}
            >
              {popular && (
                <span className="absolute -top-3 start-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-white rtl:translate-x-1/2">
                  {t('pricing.popular')}
                </span>
              )}
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold">{t(`pricing.plans.${index}.name`)}</h3>
                <p className="text-xs text-muted-foreground">
                  {t(`pricing.plans.${index}.description`)}
                </p>
              </div>
              <p className="flex flex-col gap-1">
                <span className="flex items-baseline gap-1.5">
                  {duration && duration.discountPercent > 0 ? (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(monthly, locale)}
                    </span>
                  ) : null}
                  <span className="text-3xl font-semibold tracking-tight">
                    {formatPrice(effectiveMonthly, locale)}
                  </span>
                  <span className="text-xs text-muted-foreground">{t('pricing.perMonth')}</span>
                </span>
                {duration && duration.months > 1 ? (
                  <span className="text-xs text-muted-foreground">
                    {t('pricing.billedNote', {
                      duration: durationText,
                      total: formatPrice(durationTotalPiastres(monthly, duration), locale)
                    })}
                  </span>
                ) : null}
              </p>
              <ul className="flex flex-1 flex-col gap-2.5">
                {Array.from({length: featureCount}, (_, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2 text-sm">
                    <CheckIcon
                      className={`mt-0.5 size-4 shrink-0 ${
                        popular ? 'text-accent' : 'text-muted-foreground'
                      }`}
                    />
                    {t(`pricing.plans.${index}.features.${featureIndex}`)}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`flex items-center justify-center rounded-base px-4 py-2.5 text-sm font-medium transition-[transform] duration-100 active:scale-[0.98] ${
                  popular ? 'bg-accent text-white' : 'border border-hairline hover:bg-muted'
                }`}
              >
                {t('pricing.cta')}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
