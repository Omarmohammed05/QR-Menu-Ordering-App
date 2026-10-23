import {headers} from 'next/headers';
import {getTranslations} from 'next-intl/server';
import {redirect} from '@/i18n/navigation';
import {auth} from '@/server/auth';
import {membersRepo} from '@/server/db/repos';
import {CreateRestaurantForm} from '@/components/onboarding/create-restaurant-form';

type Props = {params: Promise<{locale: string}>};

/**
 * Phase 3 onboarding: a signed-in user with no restaurant membership creates
 * their tenant here. Users who already own one are bounced straight to the
 * dashboard.
 */
export default async function OnboardingPage({params}: Props) {
  const {locale} = await params;
  const t = await getTranslations('onboarding');
  const session = await auth.api.getSession({headers: await headers()});

  if (!session) {
    redirect({href: '/login', locale});
    return null;
  }

  const memberships = await membersRepo.listForUser(session.user.id);
  if (memberships.length > 0) {
    redirect({href: '/dashboard', locale});
    return null;
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <header className="flex flex-col gap-1.5 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('tagline')}</p>
        </header>
        <CreateRestaurantForm locale={locale} />
      </div>
    </main>
  );
}
