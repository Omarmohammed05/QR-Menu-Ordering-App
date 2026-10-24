'use client';

import {useLocale, useTranslations} from 'next-intl';
import {BagIcon, OrdersIcon, QrCodeIcon} from '@/components/icons';
import {formatNumber, formatPrice} from '@/lib/format';
import type {DailyPoint, TopDish} from '@/server/db/repos';

type Props = {
  series: DailyPoint[];
  topDishes: TopDish[];
  currency: string;
};

/**
 * The analytics read surface: stat cards, a two-tone 14-day views/orders
 * chart (pure CSS bars — no chart library, monochrome by design), and the
 * best-seller list aggregated from order lines.
 */
export function AnalyticsView({series, topDishes, currency}: Props) {
  const t = useTranslations('dashboard.analytics');
  const locale = useLocale();

  const last7 = series.slice(-7);
  const views7 = last7.reduce((sum, point) => sum + point.views, 0);
  const orders7 = last7.reduce((sum, point) => sum + point.orders, 0);
  const topDish = topDishes[0]?.name ?? '—';
  const max = Math.max(1, ...series.map((point) => Math.max(point.views, point.orders)));
  const hasAny = series.some((point) => point.views > 0 || point.orders > 0);

  const stats = [
    {label: t('stats.views7d'), value: formatNumber(views7, locale), icon: 'views'},
    {label: t('stats.orders7d'), value: formatNumber(orders7, locale), icon: 'orders'},
    {label: t('stats.topDish'), value: topDish, icon: 'dish'}
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map(({label, value, icon}, index) => (
          <div
            key={label}
            style={{animationDelay: `${index * 60}ms`}}
            className="animate-float-up [animation-fill-mode:backwards] flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-surface shadow-card p-4"
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="truncate text-lg font-semibold tracking-tight">{value}</span>
            </span>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
              {icon === 'views' ? (
                <QrCodeIcon className="size-4" />
              ) : icon === 'orders' ? (
                <OrdersIcon className="size-4" />
              ) : (
                <BagIcon className="size-4" />
              )}
            </span>
          </div>
        ))}
      </div>

      <section className="animate-fade-in flex flex-col gap-4 rounded-2xl border border-hairline bg-surface shadow-card p-5">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{t('chart.title')}</h2>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-brand" />
              {t('chart.views')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-muted-foreground" />
              {t('chart.orders')}
            </span>
          </div>
        </header>

        {!hasAny ? (
          <p className="py-8 text-center text-xs text-muted-foreground">{t('chart.none')}</p>
        ) : (
          <div className="flex h-44 items-end gap-1.5 sm:gap-2">
            {series.map((point) => (
              <div key={point.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <div className="flex h-36 w-full items-end justify-center gap-0.5" title={t('chart.tip', {views: point.views, orders: point.orders})}>
                  <span
                    className="w-full max-w-2 rounded-t-sm bg-brand"
                    style={{height: point.views > 0 ? `${Math.max(4, (point.views / max) * 100)}%` : '0%'}}
                  />
                  <span
                    className="w-full max-w-2 rounded-t-sm bg-muted-foreground"
                    style={{height: point.orders > 0 ? `${Math.max(4, (point.orders / max) * 100)}%` : '0%'}}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {formatNumber(Number(point.day.slice(8, 10)), locale)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="animate-fade-in flex flex-col gap-3 rounded-2xl border border-hairline bg-surface shadow-card p-5">
        <h2 className="text-sm font-semibold">{t('topDishes.title')}</h2>
        {topDishes.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">{t('topDishes.empty')}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-hairline">
            {topDishes.map((dish, index) => (
              <li key={`${dish.name}-${index}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold">
                    {formatNumber(index + 1, locale)}
                  </span>
                  <span className="truncate font-medium">{dish.name}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
                    {formatNumber(dish.quantity, locale)}×
                  </span>
                  <span className="text-xs font-semibold tabular-nums">
                    {formatPrice(dish.revenuePiastres, locale, currency)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
