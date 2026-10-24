import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {restaurantsRepo, createRestaurantRepos} from '@/server/db/repos';
import {isSameLocalDay} from '@/lib/time';
import {formatNumber, formatPrice} from '@/lib/format';
import {DemoHeader} from '@/components/dashboard-demo/demo-header';
import {DemoStats} from '@/components/dashboard-demo/demo-stats';
import {
  BagIcon,
  ChevronDownIcon,
  ClockIcon,
  MenuBookIcon,
  OrdersIcon,
  QrCodeIcon,
  SettingsIcon,
  TableIcon
} from '@/components/icons';

export const dynamic = 'force-dynamic';

/** Workflow statuses that still need the kitchen's attention. */
const ACTIVE_STATUSES = new Set(['pending', 'accepted', 'ready']);

export async function generateMetadata({
  params
}: {
  params: Promise<{locale: string}>;
}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'dashboardDemo'});
  return {title: t('title')};
}

/** Demo home — the overview screen: today's headline numbers + shortcuts. */
export default async function DemoOverviewPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations('dashboard.overview');
  const tNav = await getTranslations('dashboard.nav');
  const tDemo = await getTranslations('dashboardDemo');

  const restaurant = await restaurantsRepo.findBySlug('demo');
  if (!restaurant) notFound();
  const repos = createRestaurantRepos(restaurant.id);

  const [orders, tables] = await Promise.all([repos.orders.listWithItems(), repos.tables.list()]);

  const now = new Date();
  const todayOrders = orders.filter(({order}) =>
    isSameLocalDay(order.createdAt, now, restaurant.timezone)
  );
  const activeNow = todayOrders.filter(({order}) => ACTIVE_STATUSES.has(order.status)).length;
  const revenueToday = todayOrders.reduce((sum, {order}) => sum + order.totalPiastres, 0);
  const activeTables = tables.filter((table) => table.isActive).length;

  const stats = [
    {label: t('stats.todayOrders'), value: formatNumber(todayOrders.length, locale), icon: <OrdersIcon className="size-[18px]" />},
    {label: t('stats.activeNow'), value: formatNumber(activeNow, locale), icon: <ClockIcon className="size-[18px]" />},
    {label: t('stats.revenueToday'), value: formatPrice(revenueToday, locale, restaurant.currency), icon: <BagIcon className="size-[18px]" />},
    {label: t('stats.activeTables'), value: formatNumber(activeTables, locale), icon: <TableIcon className="size-[18px]" />}
  ];

  const links = [
    {href: '/dashboard-demo/orders', label: tNav('orders'), subtitle: t('links.orders'), icon: <OrdersIcon className="size-5" />},
    {href: '/dashboard-demo/menu', label: tNav('menu'), subtitle: t('links.menu'), icon: <MenuBookIcon className="size-5" />},
    {href: '/dashboard-demo/tables', label: tNav('tables'), subtitle: t('links.tables'), icon: <QrCodeIcon className="size-5" />},
    {href: '/dashboard-demo/settings', label: tNav('settings'), subtitle: t('links.settings'), icon: <SettingsIcon className="size-5" />}
  ];

  return (
    <>
      <DemoHeader title={restaurant.nameAr} tagline={tDemo('tagline')} />
      <DemoStats stats={stats} gridClassName="sm:grid-cols-3 xl:grid-cols-4" />

      <section style={{animationDelay: '160ms'}} className="animate-rise flex flex-col gap-3">
        <h2 className="text-sm font-semibold">{t('quickLinks')}</h2>
        <ul className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
          {links.map(({href, label, subtitle, icon}) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center justify-between gap-3 rounded-[20px] bg-surface p-4 shadow-warm transition-[background-color] duration-100 hover:bg-warm-input active:bg-warm-input"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warm-chip text-brand-strong">
                    {icon}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium">{label}</span>
                    <span className="truncate text-xs text-warm-muted">{subtitle}</span>
                  </span>
                </span>
                <ChevronDownIcon className="size-4 shrink-0 -rotate-90 text-warm-muted rtl:rotate-90" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
