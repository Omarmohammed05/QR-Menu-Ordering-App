import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {formatNumber, formatPrice} from '@/lib/format';
import {DEMO_ORDERS, DEMO_STATS} from '@/components/dashboard-demo/demo-data';
import {DemoButton} from '@/components/dashboard-demo/demo-button';
import {
  BagIcon,
  ChartIcon,
  ChevronDownIcon,
  ClockIcon,
  MenuBookIcon,
  OrdersIcon,
  PersonIcon,
  QrCodeIcon,
  SettingsIcon,
  TableIcon
} from '@/components/icons';

type Props = {params: Promise<{locale: string}>};

/** Subtitle keys for the two quick links the real dashboard home doesn't have. */
const EXTRA_LINKS = [
  {href: '/dashboard-demo/analytics', subtitleKey: 'links.analytics'},
  {href: '/dashboard-demo/team', subtitleKey: 'links.team'}
] as const;

/**
 * Demo overview — mirrors the real dashboard home: headline numbers above
 * quick links into every workspace, plus a taste of the live order feed.
 */
export default async function DashboardDemoPage({params}: Props) {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'dashboardDemo'});
  const tDash = await getTranslations({locale, namespace: 'dashboard'});

  const stats = [
    {label: tDash('overview.stats.todayOrders'), value: formatNumber(DEMO_STATS.todayOrders, locale), icon: <OrdersIcon className="size-4" />},
    {label: tDash('overview.stats.activeNow'), value: formatNumber(DEMO_STATS.activeNow, locale), icon: <ClockIcon className="size-4" />},
    {label: tDash('overview.stats.revenueToday'), value: formatPrice(DEMO_STATS.revenuePiastres, locale), icon: <BagIcon className="size-4" />},
    {
      label: tDash('overview.stats.activeTables'),
      value: (
        <span dir="ltr">
          {formatNumber(DEMO_STATS.activeTables, locale)} / {formatNumber(DEMO_STATS.totalTables, locale)}
        </span>
      ),
      icon: <TableIcon className="size-4" />
    }
  ];

  const links = [
    {href: '/dashboard-demo/orders', label: tDash('nav.orders'), subtitle: tDash('overview.links.orders'), icon: <OrdersIcon className="size-5" />},
    {href: '/dashboard-demo/analytics', label: tDash('nav.analytics'), subtitle: t(EXTRA_LINKS[0].subtitleKey), icon: <ChartIcon className="size-5" />},
    {href: '/dashboard-demo/menu', label: tDash('nav.menu'), subtitle: tDash('overview.links.menu'), icon: <MenuBookIcon className="size-5" />},
    {href: '/dashboard-demo/tables', label: tDash('nav.tables'), subtitle: tDash('overview.links.tables'), icon: <QrCodeIcon className="size-5" />},
    {href: '/dashboard-demo/team', label: tDash('nav.team'), subtitle: t(EXTRA_LINKS[1].subtitleKey), icon: <PersonIcon className="size-5" />},
    {href: '/dashboard-demo/settings', label: tDash('nav.settings'), subtitle: tDash('overview.links.settings'), icon: <SettingsIcon className="size-5" />}
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">{t('mock.restaurant')}</h1>
        <p className="text-sm text-muted-foreground">
          {tDash('overview.welcome')}{' '}
          <span className="font-medium text-foreground">{t('mock.team.ownerName')}</span>
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
        <h2 className="text-sm font-semibold">{tDash('overview.quickLinks')}</h2>
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

      {/* Recent orders — a taste of the live feed */}
      <section className="flex flex-col gap-2 rounded-base border border-hairline bg-surface py-1">
        <p className="px-4 pt-2 text-xs font-medium text-muted-foreground">{t('ordersSection.title')}</p>
        <ul className="divide-y divide-hairline">
          {DEMO_ORDERS.filter(({status}) => status !== 'completed').slice(0, 3).map((order) => (
            <li key={order.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
              <span dir="ltr" className="text-xs font-semibold text-muted-foreground">
                #{formatNumber(order.number, locale)}
              </span>
              <span className="text-sm">
                {order.tableLabelKey ? `${t('table')} ${t(order.tableLabelKey)}` : tDash('orders.outside')}
              </span>
              <span className="text-sm text-muted-foreground">
                {order.lines.map((line) => `${line.quantity}× ${t(line.dishKey)}`).join('، ')}
              </span>
              <span className="text-xs text-muted-foreground">{t('minutesAgo', {count: order.minutesAgo})}</span>
              <span className="ms-auto flex items-center gap-2">
                <span className="rounded-full border border-hairline bg-muted px-2 py-0.5 text-[11px]">
                  {tDash(`orders.status.${order.status}`)}
                </span>
                <span className="text-sm font-medium">{formatPrice(order.totalPiastres, locale)}</span>
                {order.status === 'pending' ? (
                  <DemoButton className="rounded-base border border-hairline px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted">
                    {tDash('orders.action.accepted')}
                  </DemoButton>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
