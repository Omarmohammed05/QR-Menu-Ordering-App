import {getTranslations} from 'next-intl/server';
import {DEMO_SERIES, DEMO_TOP_DISH_KEYS} from '@/components/dashboard-demo/demo-data';
import {AnalyticsView} from '@/components/dashboard/analytics-view';
import type {TopDish} from '@/server/db/repos';

type Props = {params: Promise<{locale: string}>};

/**
 * Demo of menu analytics — the SAME component the real Pro dashboard renders,
 * fed static series and best sellers so prospects see the chart working.
 */
export default async function DashboardDemoAnalyticsPage({params}: Props) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'dashboard.analytics'});
  const tMock = await getTranslations({locale, namespace: 'dashboardDemo'});

  const topDishes: TopDish[] = DEMO_TOP_DISH_KEYS.map(({dishKey, quantity, revenuePiastres}) => ({
    name: tMock(dishKey),
    quantity,
    revenuePiastres
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('tagline')}</p>
      </div>
      <AnalyticsView series={DEMO_SERIES} topDishes={topDishes} currency="EGP" />
    </div>
  );
}
