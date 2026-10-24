import {getTranslations} from 'next-intl/server';
import {requireMember} from '@/server/dashboard';
import {createRestaurantRepos} from '@/server/db/repos';
import {OrdersBoard} from '@/components/dashboard/orders-board';
import {formatNumber} from '@/lib/format';

type Props = {params: Promise<{locale: string}>};

/** One day in the restaurant's own IANA timezone (UTC anchor → local day). */
function isSameLocalDay(date: Date, now: Date, timeZone: string): boolean {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return fmt.format(date) === fmt.format(now);
}

/**
 * Live order board (Stitch "orders_board" screen): today's stats above a
 * status kanban. Data is fetched server-side; the board polls with
 * `router.refresh()` while the tab is visible (product decision: polling).
 */
export default async function OrdersPage({params}: Props) {
  const {locale} = await params;
  const {membership} = await requireMember(locale);
  const repos = createRestaurantRepos(membership.restaurant.id);

  const [orders, tables] = await Promise.all([repos.orders.listWithItems(), repos.tables.list()]);
  const tableLabels = Object.fromEntries(tables.map((table) => [table.id, table.label]));

  const now = new Date();
  const tz = membership.restaurant.timezone;
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

  const t = await getTranslations('dashboard.orders');
  const stats = [
    {label: t('stats.todayCount'), value: formatNumber(todayOrders.length, locale)},
    {label: t('stats.activeNow'), value: formatNumber(activeCount, locale)},
    {label: t('stats.completedToday'), value: formatNumber(completedToday.length, locale)},
    {
      label: t('stats.avgPrep'),
      value:
        avgPrep == null
          ? '—'
          : `${formatNumber(Math.round(avgPrep * 10) / 10, locale)} ${t('stats.minutesUnit')}`
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('tagline')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(({label, value}) => (
          <div
            key={label}
            className="flex flex-col gap-1 rounded-xl border border-hairline bg-surface p-4"
          >
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-lg font-semibold tracking-tight">{value}</span>
          </div>
        ))}
      </div>

      <OrdersBoard orders={orders} tableLabels={tableLabels} />
    </div>
  );
}
