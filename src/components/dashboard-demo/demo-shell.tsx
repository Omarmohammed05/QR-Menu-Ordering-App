'use client';

import {useState, type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {DemoNoticeProvider} from './demo-notice';
import {
  ChartIcon,
  CloudIcon,
  CloseIcon,
  LogoGlyphIcon,
  MenuBarsIcon,
  MenuBookIcon,
  OrdersIcon,
  PersonIcon,
  QrCodeIcon,
  SettingsIcon
} from '@/components/icons';

type NavItem = {href: string; label: string; icon: ReactNode};

/**
 * Chrome mirroring the real `DashboardShell` — sidebar, drawer, header — but
 * every nav entry points at a `/dashboard-demo/*` showcase page and the
 * header carries the subscribe CTA. Nothing here talks to the server.
 */
export function DemoShell({children}: {children: ReactNode}) {
  const t = useTranslations('dashboardDemo');
  const tDash = useTranslations('dashboard');
  const [drawerState, setDrawerState] = useState<'closed' | 'open' | 'closing'>('closed');
  const openDrawer = () => setDrawerState('open');
  const closeDrawer = () =>
    setDrawerState((state) => (state === 'open' ? 'closing' : state));
  const pathname = usePathname().replace(/^\/(ar|en)(?=\/|$)/, '');

  const nav: NavItem[] = [
    {href: '/dashboard-demo', label: tDash('nav.overview'), icon: <LogoGlyphIcon className="size-[18px]" />},
    {href: '/dashboard-demo/orders', label: tDash('nav.orders'), icon: <OrdersIcon className="size-[18px]" />},
    {href: '/dashboard-demo/analytics', label: tDash('nav.analytics'), icon: <ChartIcon className="size-[18px]" />},
    {href: '/dashboard-demo/menu', label: tDash('nav.menu'), icon: <MenuBookIcon className="size-[18px]" />},
    {href: '/dashboard-demo/tables', label: tDash('nav.tables'), icon: <QrCodeIcon className="size-[18px]" />},
    {href: '/dashboard-demo/team', label: tDash('nav.team'), icon: <PersonIcon className="size-[18px]" />},
    {href: '/dashboard-demo/settings', label: tDash('nav.settings'), icon: <SettingsIcon className="size-[18px]" />}
  ];

  const isActive = (href: string) =>
    href === '/dashboard-demo' ? pathname === href : pathname.startsWith(href);

  const brandBlock = (
    <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-hairline px-5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-foreground text-background">
        <LogoGlyphIcon className="size-[18px]" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold leading-none">{t('mock.restaurant')}</span>
        <span className="mt-1 text-[11px] leading-none text-muted-foreground">{t('shellTagline')}</span>
      </span>
      <span className="ms-auto shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-white">
        {t('badge')}
      </span>
    </div>
  );

  const navList = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-1 px-3 py-2" aria-label={t('shellTagline')}>
      {nav.map(({href, label, icon}) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2 text-sm transition-[transform,background-color,color] duration-100 active:scale-[0.98] ${
              active
                ? 'bg-foreground font-medium text-background'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {icon}
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const connectionCard = (
    <div className="p-4">
      <div className="flex items-center justify-between rounded-lg border border-hairline bg-muted p-3">
        <span className="flex flex-col">
          <span className="text-[11px] text-muted-foreground">{tDash('shell.connectionLabel')}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold">
            <span className="inline-block size-2 rounded-full bg-foreground" />
            {tDash('shell.connected')}
          </span>
        </span>
        <CloudIcon className="size-5" />
      </div>
    </div>
  );

  return (
    <DemoNoticeProvider>
      <div className="min-h-dvh bg-surface-raised">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col justify-between border-e border-hairline bg-surface lg:flex print:hidden">
          <div className="flex flex-col">
            {brandBlock}
            <p className="px-5 pt-4 text-[11px] text-muted-foreground">{tDash('shell.mainMenu')}</p>
            {navList()}
          </div>
          {connectionCard}
        </aside>

        {/* Mobile drawer */}
        {drawerState !== 'closed' ? (
          <div className="fixed inset-0 z-50 lg:hidden print:hidden">
            <button
              type="button"
              aria-label={tDash('shell.closeMenu')}
              onClick={closeDrawer}
              className={`absolute inset-0 bg-[var(--backdrop)] ${
                drawerState === 'closing' ? 'animate-fade-out' : 'animate-fade-in'
              }`}
            />
            <div
              onAnimationEnd={(event) => {
                if (drawerState === 'closing' && event.target === event.currentTarget) {
                  setDrawerState('closed');
                }
              }}
              className={`absolute inset-y-0 start-0 flex w-72 max-w-[85%] flex-col justify-between border-e border-hairline bg-surface ${
                drawerState === 'closing' ? 'animate-drawer-out' : 'animate-drawer-in'
              }`}
            >
              <div className="flex flex-col">
                <div className="flex items-center justify-between border-b border-hairline pe-2">
                  {brandBlock}
                  <button
                    type="button"
                    aria-label={tDash('shell.closeMenu')}
                    onClick={closeDrawer}
                    className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <CloseIcon className="size-5" />
                  </button>
                </div>
                {navList(closeDrawer)}
              </div>
              {connectionCard}
            </div>
          </div>
        ) : null}

        {/* Column next to the sidebar */}
        <div className="lg:ps-64">
          <header className="material fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-hairline px-4 lg:px-6 print:hidden">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                aria-label={tDash('shell.openMenu')}
                onClick={openDrawer}
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-hairline text-muted-foreground transition-[transform,color] duration-100 hover:text-foreground active:scale-[0.95] lg:hidden"
              >
                <MenuBarsIcon className="size-5" />
              </button>
              <span className="truncate text-sm font-semibold">{t('mock.restaurant')}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/"
                className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:block"
              >
                {t('backHome')}
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-white transition-[transform] duration-100 active:scale-[0.98]"
              >
                {t('subscribeCta')}
              </Link>
            </div>
          </header>
          <main className="px-4 pb-16 pt-24 lg:px-8 print:pt-0">
            {/* Read-only banner — every demo page carries it */}
            <div className="mb-6 flex flex-col gap-2 rounded-base border border-accent/30 bg-accent/10 p-4 sm:flex-row sm:items-center print:hidden">
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
            {children}
          </main>
        </div>
      </div>
    </DemoNoticeProvider>
  );
}
