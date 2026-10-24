import {getTranslations} from 'next-intl/server';
import {requireMember} from '@/server/dashboard';
import {createRestaurantRepos} from '@/server/db/repos';
import {OrdersView} from '@/components/dashboard/orders-view';

type Props = {params: Promise<{locale: string}>};

/**
 * Live order board: the newest orders with their snapshotted lines. Data is
 * fetched server-side; the client view polls with `router.refresh()` while
 * the tab is visible (product decision: polling, no WebSockets).
 */
export default async function OrdersPage({params}: Props) {
  const {locale} = await params;
  const {membership} = await requireMember(locale);
  const repos = createRestaurantRepos(membership.restaurant.id);

  const [orders, tables] = await Promise.all([
    repos.orders.listWithItems(),
    repos.tables.list()
  ]);
  const tableLabels = Object.fromEntries(tables.map((table) => [table.id, table.label]));

  const t = await getTranslations('dashboard.orders');
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('tagline')}</p>
      </div>
      <OrdersView locale={locale} orders={orders} tableLabels={tableLabels} />
    </div>
  );
}
