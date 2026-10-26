'use client';

import {useActionState} from 'react';
import {useTranslations} from 'next-intl';
import {
  createDurationAction,
  deleteDurationAction,
  type AdminDurationState
} from '@/server/actions/admin';
import {durationLabelParts, durationTotalPiastres, PLAN_IDS, PLAN_PRICES} from '@/lib/plans';
import {formatPrice} from '@/lib/format';
import type {SubscriptionDuration} from '@/server/db/repos';

const INITIAL_STATE: AdminDurationState = {};

const inputClassName =
  'h-10 min-w-0 flex-1 rounded-full border border-hairline bg-surface px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground';

/**
 * Owner-managed billing durations (1m/3m/6m/1y or custom) with their
 * discount. Each row previews what every plan's total costs at that
 * duration — exactly what the landing pricing picker shows customers.
 */
export function DurationsSection({
  locale,
  durations
}: {
  locale: string;
  durations: SubscriptionDuration[];
}) {
  const t = useTranslations('admin.durations');
  const tDuration = useTranslations();
  const tPlans = useTranslations('admin.plans');
  const [state, formAction, pending] = useActionState(createDurationAction, INITIAL_STATE);
  const error = state.error ? t(`errors.${state.error}`) : null;

  return (
    <section
      style={{animationDelay: '150ms'}}
      className="animate-float-up [animation-fill-mode:backwards] rounded-xl border border-hairline bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-col gap-1.5">
        <h2 className="text-sm font-semibold">{t('title')}</h2>
        <p className="text-xs text-muted-foreground">{t('tagline')}</p>
      </div>

      <form action={formAction} className="mt-4 flex flex-col gap-2" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{t('months')}</span>
            <input
              type="number"
              name="months"
              required
              min={1}
              max={60}
              step={1}
              inputMode="numeric"
              dir="ltr"
              placeholder="3"
              className={inputClassName}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{t('discount')}</span>
            <input
              type="number"
              name="discountPercent"
              required
              min={0}
              max={90}
              step={1}
              inputMode="numeric"
              dir="ltr"
              placeholder="10"
              className={inputClassName}
            />
          </label>
          <span className="flex flex-1 items-end sm:pt-0">
            <button
              type="submit"
              disabled={pending}
              className="h-10 w-full shrink-0 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-[transform] duration-100 active:scale-[0.98] disabled:opacity-50"
            >
              {pending ? t('working') : t('submit')}
            </button>
          </span>
        </div>
        {error ? (
          <p role="alert" className="text-sm font-medium">
            {error}
          </p>
        ) : null}
      </form>

      <ul className="mt-4 flex flex-col gap-2">
        {durations.map((duration) => {
          const label = durationLabelParts(duration.months);
          return (
            <li
              key={duration.id}
              className="flex flex-col gap-3 rounded-base border border-hairline p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {tDuration(label.key, {count: label.count})}
                  {duration.discountPercent > 0 ? (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                      {t('discountBadge', {percent: duration.discountPercent})}
                    </span>
                  ) : null}
                </span>
                <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  {PLAN_IDS.map((id) => (
                    <span key={id}>
                      {tPlans(`items.${id}.name`)}
                      {': '}
                      <span className="font-medium text-foreground">
                        {formatPrice(durationTotalPiastres(PLAN_PRICES[id], duration), locale)}
                      </span>
                    </span>
                  ))}
                </span>
              </div>
              {!duration.id.startsWith('default-') ? (
                <form action={deleteDurationAction} className="shrink-0">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="durationId" value={duration.id} />
                  <button
                    type="submit"
                    className="rounded-base border border-hairline px-3 py-1.5 text-xs font-medium text-muted-foreground transition-[transform] duration-100 active:scale-[0.98]"
                  >
                    {t('delete')}
                  </button>
                </form>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
