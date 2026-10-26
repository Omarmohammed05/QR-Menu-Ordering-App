import {getTranslations} from 'next-intl/server';
import {DEMO_STATS} from '@/components/dashboard-demo/demo-data';
import {DemoOrdersBoard} from '@/components/dashboard-demo/demo-orders-board';
import {CheckIcon, ClockIcon, OrdersIcon} from '@/components/icons';
import {formatNumber} from '@/lib/format';

type Props = {params: Promise<{locale: string}>};

/** Demo of the live order board — today's stats above the read-only kanban. */
export default async function DashboardDemoOrdersPage({params}: Props) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'dashboard.orders'});

  const stats = [
    {label: t('stats.todayCount'), value: formatNumber(DEMO_STATS.todayOrders, locale), icon: 'orders'},
    {label: t('stats.activeNow'), value: formatNumber(DEMO_STATS.activeNow, locale), icon: 'pulse'},
    {label: t('stats.completedToday'), value: formatNumber(DEMO_STATS.todayOrders - DEMO_STATS.activeNow, locale), icon: 'check'},
    {
      label: t('stats.avgPrep'),
      value: `${formatNumber(DEMO_STATS.avgPrepMinutes, locale)} ${t('stats.minutesUnit')}`,
      icon: 'clock'
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('tagline')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(({label, value, icon}, index) => (
          <div
            key={label}
            style={{animationDelay: `${index * 60}ms`}}
            className="animate-float-up [animation-fill-mode:backwards] flex items-center justify-between rounded-xl border border-hairline bg-surface p-4"
          >
            <span className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-lg font-semibold tracking-tight">{value}</span>
            </span>
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted">
              {icon === 'pulse' ? (
                <span className="size-2 rounded-full bg-foreground motion-safe:animate-pulse" />
              ) : icon === 'check' ? (
                <CheckIcon className="size-4" />
              ) : icon === 'clock' ? (
                <ClockIcon className="size-4" />
              ) : (
                <OrdersIcon className="size-4" />
              )}
            </span>
          </div>
        ))}
      </div>

      <DemoOrdersBoard />
    </div>
  );
}
