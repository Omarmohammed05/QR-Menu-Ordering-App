import {headers} from 'next/headers';
import {getTranslations} from 'next-intl/server';
import {redirect} from '@/i18n/navigation';
import {auth} from '@/server/auth';
import {SignOutButton} from '@/components/auth/sign-out-button';

/**
 * Session-guarded dashboard stub: proves the Better Auth wiring end to end.
 * Tenant scoping (which restaurant this member owns) is Phase 3.
 */
type Props = {params: Promise<{locale: string}>};

export default async function DashboardPage({params}: Props) {
  const {locale} = await params;
  const t = await getTranslations('auth');
  const session = await auth.api.getSession({headers: await headers()});

  if (!session) {
    redirect({href: '/login', locale});
    // next-intl's redirect isn't typed `never` — this only satisfies the
    // narrowing; it never runs (redirect throws).
    return null;
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="rounded-full border border-hairline px-3 py-1 text-xs tracking-wide text-muted-foreground">
        {t('phase')}
      </span>
      <h1 className="text-3xl font-semibold tracking-tight">{t('dashboardTitle')}</h1>
      <p className="text-base text-muted-foreground">
        {t('signedInAs')} <span dir="ltr">{session.user.email}</span>
      </p>
      <SignOutButton />
    </main>
  );
}
