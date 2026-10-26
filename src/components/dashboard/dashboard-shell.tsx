'use client';

import {useState, type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {SignOutButton} from '@/components/auth/sign-out-button';
import {RestaurantSwitcher} from '@/components/dashboard/restaurant-switcher';
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
  SettingsIcon,
  StoreIcon
} from '@/components/icons';

type Props = {
  restaurantName: string;
  restaurants: {id: string; nameAr: string}[];
  activeRestaurantId: string;
  userEmail: string;
  /** Platform owner sees the admin link — sign-up is closed, only they creates restaurants. */
  showAdmin?: boolean;
  /** Plan gate (src/lib/plans.ts): analytics is a Pro feature. */
  canViewAnalytics?: boolean;
  children: ReactNode;
};

type NavItem = {href: string; label: string; icon: ReactNode};

/**
 * The dashboard chrome from the Stitch design: a fixed start-side sidebar
 * (start = right in the RTL default), a fixed top header with the
 * restaurant switcher, and a mobile drawer below `lg`.
 */
export function DashboardShell({
  restaurantName,
  restaurants,
  activeRestaurantId,
  userEmail,
  showAdmin = false,
  canViewAnalytics = true,
  children
}: Props) {
  const t = useTranslations('dashboard');
  // Tri-state so the drawer can play its exit animation before unmounting.
  const [drawerState, setDrawerState] = useState<'closed' | 'open' | 'closing'>('closed');
  const openDrawer = () => setDrawerState('open');
  const closeDrawer = () =>
    setDrawerState((state) => (state === 'open' ? 'closing' : state));
  // `usePathname()` includes the locale prefix; strip it so nav `href`s match.
  const pathname = usePathname().replace(/^\/(ar|en)(?=\/|$)/, '');

  const nav: NavItem[] = [
    {href: '/dashboard', label: t('nav.overview'), icon: <LogoGlyphIcon className="size-[18px]" />},
    {href: '/dashboard/orders', label: t('nav.orders'), icon: <OrdersIcon className="size-[18px]" />},
    {href: '/dashboard/menu', label: t('nav.menu'), icon: <MenuBookIcon className="size-[18px]" />},
    {href: '/dashboard/tables', label: t('nav.tables'), icon: <QrCodeIcon className="size-[18px]" />},
    {href: '/dashboard/team', label: t('nav.team'), icon: <PersonIcon className="size-[18px]" />},
    {href: '/dashboard/settings', label: t('nav.settings'), icon: <SettingsIcon className="size-[18px]" />}
  ];
  if (canViewAnalytics) {
    nav.splice(2, 0, {
      href: '/dashboard/analytics',
      label: t('nav.analytics'),
      icon: <ChartIcon className="size-[18px]" />
    });
  }
  if (showAdmin) {
    nav.push({href: '/admin', label: t('nav.admin'), icon: <StoreIcon className="size-[18px]" />});
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  const brandBlock = (
    <div className="flex h-16 shrink-0 items-center gap-3 border-b border-hairline px-5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-foreground text-background">
        <LogoGlyphIcon className="size-[18px]" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold leading-none">{restaurantName}</span>
        <span className="mt-1 text-[11px] leading-none text-muted-foreground">
          {t('shell.systemTagline')}
        </span>
      </span>
    </div>
  );

  const navList = (onNavigate?: () => void) => (
    <nav className="flex flex-col gap-1 px-3 py-2" aria-label={t('shell.mainMenu')}>
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
          <span className="text-[11px] text-muted-foreground">{t('shell.connectionLabel')}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold">
            <span className="inline-block size-2 rounded-full bg-foreground" />
            {t('shell.connected')}
          </span>
        </span>
        <CloudIcon className="size-5" />
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-surface-raised">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col justify-between border-e border-hairline bg-surface lg:flex print:hidden">
        <div className="flex flex-col">
          {brandBlock}
          <p className="px-5 pt-4 text-[11px] text-muted-foreground">{t('shell.mainMenu')}</p>
          {navList()}
        </div>
        {connectionCard}
      </aside>

      {/* Mobile drawer — enters/exits along its start-side path (globals.css) */}
      {drawerState !== 'closed' ? (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <button
            type="button"
            aria-label={t('shell.closeMenu')}
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
                  aria-label={t('shell.closeMenu')}
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
              aria-label={t('shell.openMenu')}
              onClick={openDrawer}
              className="grid size-9 shrink-0 place-items-center rounded-lg border border-hairline text-muted-foreground transition-[transform,color] duration-100 hover:text-foreground active:scale-[0.95] lg:hidden"
            >
              <MenuBarsIcon className="size-5" />
            </button>
            <RestaurantSwitcher
              restaurants={restaurants}
              activeId={activeRestaurantId}
            />
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <StoreIcon className="hidden size-5 shrink-0 text-muted-foreground sm:block" />
            <span dir="ltr" className="hidden truncate text-xs text-muted-foreground md:block">
              {userEmail}
            </span>
            <SignOutButton />
          </div>
        </header>
        <main className="px-4 pb-16 pt-24 lg:px-8 lg:pt-24 print:px-0 print:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
