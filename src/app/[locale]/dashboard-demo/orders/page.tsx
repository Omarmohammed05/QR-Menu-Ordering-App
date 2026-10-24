import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {restaurantsRepo, createRestaurantRepos} from '@/server/db/repos';
import {isSameLocalDay} from '@/lib/time';
import {formatNumber} from '@/lib/format';
import {DemoHeader} from '@/components/dashboard-demo/demo-header';
import {DemoStats} from '@/components/dashboard-demo/demo-stats';
import {OrdersBoard} from '@/components/dashboard/orders-board';
import {CheckIcon, ClockIcon, OrdersIcon} from '@/components/icons';

export const dynamic = 'force-dynamic';

/** Demo of the live order board — read-only: no actions, no polling. */
export default async function DemoOrdersPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations('dashboard.orders');

  const restaurant = await restaurantsRepo.findBySlug('demo');
  if (!restaurant) notFound();
  const repos = createRestaurantRepos(restaurant.id);

  const [orders, tables] = await Promise.all([repos.orders.listWithItems(), repos.tables.list()]);
  const tableLabels = Object.fromEntries(tables.map((table) => [table.id, table.label]));

  const now = new Date();
  const tz = restaurant.timezone;
  const todayOrders = orders.filter(({order}) => isSameLocalDay(order.createdAt, now, tz));
  const activeCount = todayOrders.filter(
    ({order}) => order.status === 'pending' || order.status === 'accepted' || order.status === 'ready'
  ).length;
  const completedToday = todayOrders.filter(({order}) => order.status === 'completed');
  const prepMinutes = completedToday.map(
    ({order}) => (order.updatedAt.getTime() - order.createdAt.getTime()) / 60_000
  );
  const avgPrep =
    prepMinutes.length > 0
      ? prepMinutes.reduce((sum, value) => sum + value, 0) / prepMinutes.length
      : null;

  const stats = [
    {label: t('stats.todayCount'), value: formatNumber(todayOrders.length, locale), icon: <OrdersIcon className="size-[18px]" />},
    {label: t('stats.activeNow'), value: formatNumber(activeCount, locale), icon: <span className="size-2 animate-pulse rounded-full bg-brand" />},
    {label: t('stats.completedToday'), value: formatNumber(completedToday.length, locale), icon: <CheckIcon className="size-[18px]" />},
    {
      label: t('stats.avgPrep'),
      value:
        avgPrep == null
          ? '—'
          : `${formatNumber(Math.round(avgPrep * 10) / 10, locale)} ${t('stats.minutesUnit')}`,
      icon: <ClockIcon className="size-[18px]" />
    }
  ];

  return (
    <>
      <DemoHeader title={t('title')} tagline={t('tagline')} />
      <DemoStats
        stats={stats}
        gridClassName="sm:grid-cols-3 xl:grid-cols-4"
        delay={0}
      />
      <OrdersBoard
        orders={orders}
        tableLabels={tableLabels}
        currency={restaurant.currency}
        readOnly
      />
    </>
  );
}
