import {notFound} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {restaurantsRepo, createRestaurantRepos} from '@/server/db/repos';
import {DemoHeader} from '@/components/dashboard-demo/demo-header';
import {TeamSection} from '@/components/dashboard/team-section';

export const dynamic = 'force-dynamic';

/** Demo of the team surface — the read-only list every non-owner sees. */
export default async function DemoTeamPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const t = await getTranslations('dashboard.team');

  const restaurant = await restaurantsRepo.findBySlug('demo');
  if (!restaurant) notFound();
  const members = await createRestaurantRepos(restaurant.id).team.list();

  return (
    <>
      <DemoHeader title={t('title')} tagline={t('tagline')} />
      <TeamSection
        locale={locale}
        canManage={false}
        currentUserId=""
        members={members.map(({userId, name, email, role}) => ({userId, name, email, role}))}
      />
    </>
  );
}
