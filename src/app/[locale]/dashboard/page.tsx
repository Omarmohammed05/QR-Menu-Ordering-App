import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {requireMember} from '@/server/dashboard';
import {createRestaurantRepos} from '@/server/db/repos';
import {isSameLocalDay} from '@/lib/time';
import {formatNumber, formatPrice} from '@/lib/format';
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

type Props = {params: Promise<{locale: string}>};

/** Workflow statuses that still need the kitchen's attention. */
const ACTIVE_STATUSES = new Set(['pending', 'accepted', 'ready']);

/**
 * Dashboard home (Stitch "overview"): today's headline numbers above quick
 * links into each workspace — the answer to "how is the restaurant doing
 * right now" before a single click.
 */
export default async function DashboardPage({params}: Props) {
  const {locale} = await params;
  const {session, membership} = await requireMember(locale);
  const {restaurant} = membership;
  const repos = createRestaurantRepos(restaurant.id);

  const t = await getTranslations('dashboard.overview');
  const tNav = await getTranslations('dashboard.nav');

  const [orders, tables] = await Promise.all([repos.orders.listWithItems(), repos.tables.list()]);

  const now = new Date();
  const todayOrders = orders.filter(({order}) =>
    isSameLocalDay(order.createdAt, now, restaurant.timezone)
  );
  const activeNow = todayOrders.filter(({order}) => ACTIVE_STATUSES.has(order.status)).length;
  const revenueToday = todayOrders.reduce((sum, {order}) => sum + order.totalPiastres, 0);
  const activeTables = tables.filter((table) => table.isActive).length;

  const stats = [
    {label: t('stats.todayOrders'), value: formatNumber(todayOrders.length, locale), icon: <OrdersIcon className="size-4" />},
    {label: t('stats.activeNow'), value: formatNumber(activeNow, locale), icon: <ClockIcon className="size-4" />},
    {label: t('stats.revenueToday'), value: formatPrice(revenueToday, locale), icon: <BagIcon className="size-4" />},
    {label: t('stats.activeTables'), value: formatNumber(activeTables, locale), icon: <TableIcon className="size-4" />}
  ];

  const links = [
    {href: '/dashboard/orders', label: tNav('orders'), subtitle: t('links.orders'), icon: <OrdersIcon className="size-5" />},
    {href: '/dashboard/menu', label: tNav('menu'), subtitle: t('links.menu'), icon: <MenuBookIcon className="size-5" />},
    {href: '/dashboard/tables', label: tNav('tables'), subtitle: t('links.tables'), icon: <QrCodeIcon className="size-5" />},
    {href: '/dashboard/settings', label: tNav('settings'), subtitle: t('links.settings'), icon: <SettingsIcon className="size-5" />}
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">{restaurant.nameAr}</h1>
        <p className="text-sm text-muted-foreground">
          {t('welcome')} <span className="font-medium text-foreground">{session.user.name}</span>
        </p>
      </div>

      {/* Today's headline numbers */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({label, value, icon}) => (
          <div
            key={label}
            className="flex flex-col justify-between gap-4 rounded-xl border border-hairline bg-surface p-4 sm:p-5"
          >
            <span className="flex items-start justify-between gap-2">
              <span className="text-xs leading-relaxed text-muted-foreground">{label}</span>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted">
                {icon}
              </span>
            </span>
            <span className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {value}
            </span>
          </div>
        ))}
      </section>

      {/* Workspace shortcuts */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">{t('quickLinks')}</h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {links.map(({href, label, subtitle, icon}) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface p-4 transition-[background-color] duration-100 hover:bg-muted/50 active:bg-muted"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted">
                    {icon}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium">{label}</span>
                    <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
                  </span>
                </span>
                <ChevronDownIcon className="size-4 shrink-0 -rotate-90 text-muted-foreground rtl:rotate-90" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
