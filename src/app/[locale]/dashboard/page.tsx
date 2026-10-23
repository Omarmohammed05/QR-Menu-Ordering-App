import {headers} from 'next/headers';
import {getTranslations} from 'next-intl/server';
import {redirect} from '@/i18n/navigation';
import {auth} from '@/server/auth';
import {membersRepo} from '@/server/db/repos';
import {SignOutButton} from '@/components/auth/sign-out-button';

type Props = {params: Promise<{locale: string}>};

/**
 * Session-guarded, tenant-scoped dashboard: resolves the signed-in member's
 * restaurant via their membership. A user with no restaurant yet is sent to
 * onboarding; menu/QR management grows on this scoped context in later phases.
 */
export default async function DashboardPage({params}: Props) {
  const {locale} = await params;
  const t = await getTranslations('dashboard');
  const session = await auth.api.getSession({headers: await headers()});

  if (!session) {
    redirect({href: '/login', locale});
    // next-intl's redirect isn't typed `never` — this only satisfies the
    // narrowing; it never runs (redirect throws).
    return null;
  }

  const memberships = await membersRepo.listForUser(session.user.id);
  const membership = memberships[0];
  if (!membership) {
    redirect({href: '/onboarding', locale});
    return null;
  }

  const {role, restaurant} = membership;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="rounded-full border border-hairline px-3 py-1 text-xs tracking-wide text-muted-foreground">
        {t('phase')}
      </span>
      <h1 className="text-3xl font-semibold tracking-tight">{restaurant.nameAr}</h1>
      <p className="text-base text-muted-foreground">
        {t('signedInAs')} <span dir="ltr">{session.user.email}</span>
      </p>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-center gap-2">
          <dt className="text-muted-foreground">{t('publicSlug')}</dt>
          <dd dir="ltr" className="font-mono">
            /r/{restaurant.slug}
          </dd>
        </div>
        <div className="flex items-center justify-center gap-2">
          <dt className="text-muted-foreground">{t('whatsappLabel')}</dt>
          <dd dir="ltr" className="font-mono">
            {restaurant.whatsappNumber}
          </dd>
        </div>
        <div className="flex items-center justify-center gap-2">
          <dt className="text-muted-foreground">{t('roleLabel')}</dt>
          <dd>{t(`role.${role}`)}</dd>
        </div>
      </dl>
      <SignOutButton />
    </main>
  );
}
