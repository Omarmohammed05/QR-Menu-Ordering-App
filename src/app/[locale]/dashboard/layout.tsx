import type {ReactNode} from 'react';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {requireMember} from '@/server/dashboard';
import {SignOutButton} from '@/components/auth/sign-out-button';

type Props = {
  children: ReactNode;
  params: Promise<{locale: string}>;
};

/**
 * The dashboard shell: runs the Phase 3 guard once for every dashboard route
 * (login gate + tenant resolution) and renders the shared header.
 */
export default async function DashboardLayout({children, params}: Props) {
  const {locale} = await params;
  const {membership} = await requireMember(locale);
  const t = await getTranslations('dashboard');

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-hairline">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-semibold">{membership.restaurant.nameAr}</span>
            <nav className="flex items-center gap-3 text-xs text-muted-foreground">
              <Link href="/dashboard" className="transition-colors hover:text-foreground">
                {t('nav.overview')}
              </Link>
              <Link href="/dashboard/menu" className="transition-colors hover:text-foreground">
                {t('nav.menu')}
              </Link>
              <Link href="/dashboard/orders" className="transition-colors hover:text-foreground">
                {t('nav.orders')}
              </Link>
              <Link href="/dashboard/tables" className="transition-colors hover:text-foreground">
                {t('nav.tables')}
              </Link>
            </nav>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
