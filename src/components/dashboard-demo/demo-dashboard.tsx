'use client';

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {formatNumber, formatPrice} from '@/lib/format';
import {
  BagIcon,
  ChartIcon,
  ClockIcon,
  LogoGlyphIcon,
  MenuBookIcon,
  OrdersIcon,
  TableIcon
} from '@/components/icons';

type Tab = 'overview' | 'orders' | 'menu';
type OrderStatus = 'pending' | 'accepted' | 'ready' | 'completed';

/** Static showcase rows — no session, no tenant, nothing is saved (read-only by design). */
const DEMO_STATS = {todayOrders: 24, activeNow: 3, revenuePiastres: 318000, activeTables: 6, totalTables: 8};

const DEMO_ORDERS: {
  id: string;
  table: number;
  minutes: number;
  totalPiastres: number;
  status: OrderStatus;
  summaryKey: string;
}[] = [
  {id: '#1028', table: 5, minutes: 2, totalPiastres: 44000, status: 'pending', summaryKey: 'mock.orderSummaries.grill2'},
  {id: '#1027', table: 2, minutes: 6, totalPiastres: 7500, status: 'pending', summaryKey: 'mock.orderSummaries.koshary1'},
  {id: '#1026', table: 7, minutes: 14, totalPiastres: 9500, status: 'accepted', summaryKey: 'mock.orderSummaries.hawawshi1'},
  {id: '#1025', table: 3, minutes: 22, totalPiastres: 9000, status: 'ready', summaryKey: 'mock.orderSummaries.pudding2'},
  {id: '#1024', table: 1, minutes: 38, totalPiastres: 22000, status: 'completed', summaryKey: 'mock.orderSummaries.grill1'}
];

const DEMO_MENU: {
  categoryKey: string;
  items: {dishKey: string; piastres: number; hasOptions?: boolean}[];
}[] = [
  {
    categoryKey: 'mock.categories.main',
    items: [
      {dishKey: 'mock.dishes.koshary', piastres: 7500},
      {dishKey: 'mock.dishes.hawawshi', piastres: 9500, hasOptions: true}
    ]
  },
  {
    categoryKey: 'mock.categories.grills',
    items: [{dishKey: 'mock.dishes.grill', piastres: 22000, hasOptions: true}]
  },
  {
    categoryKey: 'mock.categories.desserts',
    items: [{dishKey: 'mock.dishes.pudding', piastres: 4500}]
  }
];

const TABS: {id: Tab; icon: React.ReactNode}[] = [
  {id: 'overview', icon: <ChartIcon className="size-[18px]" />},
  {id: 'orders', icon: <OrdersIcon className="size-[18px]" />},
  {id: 'menu', icon: <MenuBookIcon className="size-[18px]" />}
];

/**
 * Read-only showcase of the owner dashboard: prospects tap around the real
 * UI on static data; every mutating gesture only surfaces the demo notice.
 */
export function DemoDashboard({locale}: {locale: string}) {
  const t = useTranslations('dashboardDemo');
  const tDash = useTranslations('dashboard');
  const tMenu = useTranslations('menuManagement');
  const [tab, setTab] = useState<Tab>('overview');
  const [notice, setNotice] = useState(false);

  // Every save/delete/accept attempt just re-arms the polite demo notice.
  const demoAction = () => setNotice(true);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(false), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  const statCards = [
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

  const orderRow = (order: (typeof DEMO_ORDERS)[number]) => (
    <li key={order.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
      <span dir="ltr" className="text-xs font-semibold text-muted-foreground">{order.id}</span>
      <span className="text-sm">{t('table')} {formatNumber(order.table, locale)}</span>
      <span className="text-sm text-muted-foreground">{t(order.summaryKey)}</span>
      <span className="text-xs text-muted-foreground">{t('minutesAgo', {count: order.minutes})}</span>
      <span className="ms-auto flex items-center gap-2">
        <span className="rounded-full border border-hairline bg-muted px-2 py-0.5 text-[11px]">
          {tDash(`orders.status.${order.status}`)}
        </span>
        <span className="text-sm font-medium">{formatPrice(order.totalPiastres, locale)}</span>
        {order.status === 'pending' ? (
          <button
            type="button"
            onClick={demoAction}
            className="rounded-base border border-hairline px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted"
          >
            {tDash('orders.action.accepted')}
          </button>
        ) : null}
      </span>
    </li>
  );

  return (
    <div className="min-h-dvh bg-surface-raised">
      {/* Chrome mirroring the real dashboard shell */}
      <header className="material sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-hairline px-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-foreground text-background">
            <LogoGlyphIcon className="size-[18px]" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold leading-none">{t('mock.restaurant')}</span>
            <span className="mt-1 text-[11px] leading-none text-muted-foreground">{t('shellTagline')}</span>
          </span>
          <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-white">{t('badge')}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link href="/" className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:block">
            {t('backHome')}
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-[transform] duration-100 active:scale-[0.98]"
          >
            {t('subscribeCta')}
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-24 pt-6 lg:px-8">
        {/* Read-only banner — the only "feature" of this page is the preview itself */}
        <div className="flex flex-col gap-2 rounded-base border border-accent/30 bg-accent/10 p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="text-sm font-semibold">{t('bannerTitle')}</p>
            <p className="text-xs text-muted-foreground">{t('bannerBody')}</p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 self-start rounded-base bg-accent px-4 py-2 text-xs font-medium text-white transition-[transform] duration-100 active:scale-[0.98] sm:self-auto"
          >
            {t('subscribeCta')}
          </Link>
        </div>

        {/* Section tabs (mobile-first stand-in for the dashboard sidebar) */}
        <nav className="flex gap-1 rounded-base border border-hairline bg-surface p-1" aria-label={t('shellTagline')}>
          {TABS.map(({id, icon}) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'true' : undefined}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                tab === id ? 'bg-foreground font-medium text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {icon}
              {t(`tabs.${id}`)}
            </button>
          ))}
        </nav>

        {tab === 'overview' ? (
          <section className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{t('overview.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('overview.subtitle')}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {statCards.map(({label, value, icon}) => (
                <div key={label} className="flex flex-col gap-2 rounded-base border border-hairline bg-surface p-4">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</span>
                  <span className="text-2xl font-semibold tracking-tight">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 rounded-base border border-hairline bg-surface py-1">
              <p className="px-4 pt-2 text-xs font-medium text-muted-foreground">{t('ordersSection.title')}</p>
              <ul className="divide-y divide-hairline">{DEMO_ORDERS.slice(0, 3).map(orderRow)}</ul>
            </div>
          </section>
        ) : null}

        {tab === 'orders' ? (
          <section className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{t('ordersSection.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('ordersSection.subtitle')}</p>
            </div>
            <ul className="divide-y divide-hairline rounded-base border border-hairline bg-surface">
              {DEMO_ORDERS.map(orderRow)}
            </ul>
          </section>
        ) : null}

        {tab === 'menu' ? (
          <section className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{t('menuSection.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('menuSection.subtitle')}</p>
            </div>
            {DEMO_MENU.map(({categoryKey, items}) => (
              <div key={categoryKey} className="flex flex-col gap-1 rounded-base border border-hairline bg-surface p-4">
                <h2 className="text-sm font-semibold">{t(categoryKey)}</h2>
                <ul className="divide-y divide-hairline">
                  {items.map(({dishKey, piastres, hasOptions}) => (
                    <li key={dishKey} className="flex flex-wrap items-center gap-2 py-3">
                      <span className="text-sm">{t(dishKey)}</span>
                      {hasOptions ? (
                        <span className="rounded-full border border-hairline bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          {t('hasOptions')}
                        </span>
                      ) : null}
                      <span className="ms-auto flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{formatPrice(piastres, locale)}</span>
                        <button
                          type="button"
                          onClick={demoAction}
                          className="rounded-base border border-hairline px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted"
                        >
                          {tMenu('edit')}
                        </button>
                        <button
                          type="button"
                          onClick={demoAction}
                          className="rounded-base border border-hairline px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-muted"
                        >
                          {tMenu('deleteItem')}
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ) : null}
      </main>

      {/* Polite read-only notice — fires instead of every real mutation */}
      {notice ? (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-base border border-accent/30 bg-surface p-3 text-center text-sm shadow-[0_16px_40px_-16px_rgb(0_0_0/0.3)] animate-fade-in"
        >
          {t('notice')}
        </div>
      ) : null}
    </div>
  );
}
