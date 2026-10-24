'use client';

import {usePathname} from 'next/navigation';
import type {ReactNode} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {
  ChartIcon,
  LogoGlyphIcon,
  MenuBookIcon,
  OrdersIcon,
  PersonIcon,
  QrCodeIcon,
  SettingsIcon,
  SparkleIcon
} from '@/components/icons';

type Props = {restaurantName: string; children: ReactNode};

type NavItem = {href: string; label: string; icon: ReactNode};

/**
 * Public read-only demo chrome: the dashboard shell's structure (brand block,
 * nav pills, profile card) with no session, no switcher, no sign-out, and a
 * demo badge. Nav pills use the Sunrise-warmth active treatment.
 */
export function DemoShell({restaurantName, children}: Props) {
  const t = useTranslations('dashboard');
  const tDemo = useTranslations('dashboardDemo');
  const pathname = usePathname().replace(/^\/(ar|en)(?=\/|$)/, '');

  const nav: NavItem[] = [
    {href: '/dashboard-demo', label: t('nav.overview'), icon: <LogoGlyphIcon className="size-[18px]" />},
    {href: '/dashboard-demo/orders', label: t('nav.orders'), icon: <OrdersIcon className="size-[18px]" />},
    {href: '/dashboard-demo/analytics', label: t('nav.analytics'), icon: <ChartIcon className="size-[18px]" />},
    {href: '/dashboard-demo/menu', label: t('nav.menu'), icon: <MenuBookIcon className="size-[18px]" />},
    {href: '/dashboard-demo/tables', label: t('nav.tables'), icon: <QrCodeIcon className="size-[18px]" />},
    {href: '/dashboard-demo/team', label: t('nav.team'), icon: <PersonIcon className="size-[18px]" />}
  ];
  const others: NavItem[] = [
    {href: '/dashboard-demo/settings', label: t('nav.settings'), icon: <SettingsIcon className="size-[18px]" />}
  ];

  const isActive = (href: string) =>
    href === '/dashboard-demo' ? pathname === href : pathname.startsWith(href);

  const brandBlock = (compact = false) => (
    <div className={`flex items-center gap-3 ${compact ? '' : 'h-16 border-b border-warm-hairline px-5'}`}>
      <span className="sunrise-gradient grid size-8 shrink-0 place-items-center rounded-xl text-white shadow-[0_6px_14px_rgba(255,87,34,0.3)]">
        <SparkleIcon className="size-[18px]" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold leading-none">{restaurantName}</span>
        <span className="mt-1 text-[11px] leading-none text-warm-muted">
          {t('shell.systemTagline')}
        </span>
      </span>
    </div>
  );

  const pill = ({href, label, icon}: NavItem) => {
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? 'page' : undefined}
        className={`flex shrink-0 items-center gap-2.5 rounded-full px-3.5 py-2.5 text-sm transition-[background-color,color] duration-100 ${
          active
            ? 'sunrise-gradient font-medium text-white shadow-[0_6px_16px_rgba(255,87,34,0.35)]'
            : 'text-warm-muted hover:bg-warm-chip hover:text-warm-ink'
        }`}
      >
        {icon}
        {label}
      </Link>
    );
  };

  const profileCard = (
    <div className="border-t border-warm-hairline p-4">
      <div className="flex items-center gap-3 rounded-2xl bg-warm-pill p-3">
        <span className="sunrise-gradient grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-white">
          {(restaurantName.trim()[0] ?? '?')}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold leading-tight">{restaurantName}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-warm-muted">
            <span className="inline-block size-1.5 rounded-full bg-success" />
            {t('shell.roleOwner')}
          </span>
        </span>
      </div>
      <span className="mt-2 block rounded-full bg-warm-chip px-3 py-1.5 text-center text-[11px] font-medium text-brand-strong">
        {tDemo('badge')}
      </span>
    </div>
  );

  return (
    <div className="min-h-dvh bg-warm-canvas text-warm-ink">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col justify-between border-e border-warm-hairline bg-surface lg:flex print:hidden">
        <div className="flex flex-col">
          {brandBlock()}
          <p className="px-5 pt-4 text-[11px] text-warm-muted">{t('shell.mainMenu')}</p>
          <nav className="flex flex-col gap-1 px-3 py-2">{nav.map(pill)}</nav>
          <div className="flex flex-col">
            <p className="px-5 pt-4 text-[11px] text-warm-muted">{t('shell.others')}</p>
            <nav className="flex flex-col gap-1 px-3 py-2">{others.map(pill)}</nav>
          </div>
        </div>
        {profileCard}
      </aside>

      {/* Mobile top bar with a horizontal nav (no drawer in the demo) */}
      <div className="sticky top-0 z-40 flex flex-col gap-2 border-b border-warm-hairline bg-surface px-4 py-3 lg:hidden print:hidden">
        <div className="flex items-center justify-between gap-3">
          {brandBlock(true)}
          <span className="shrink-0 rounded-full bg-warm-chip px-3 py-1.5 text-[11px] font-medium text-brand-strong">
            {tDemo('badge')}
          </span>
        </div>
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-1" aria-label={t('shell.mainMenu')}>
          {[...nav, ...others].map(pill)}
        </nav>
      </div>

      {/* Column next to the sidebar, with the warm header glow */}
      <div className="relative overflow-hidden lg:ps-64">
        <div aria-hidden className="sunrise-glow" />
        <main className="relative z-10 flex flex-col gap-7 p-4 pb-16 sm:p-6 lg:p-12">
          {children}
          <p className="pt-2 text-center text-xs text-warm-muted">{tDemo('readOnlyNote')}</p>
        </main>
      </div>
    </div>
  );
}
