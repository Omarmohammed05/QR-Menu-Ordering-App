import {getTranslations} from 'next-intl/server';
import {requireMember} from '@/server/dashboard';
import {createRestaurantRepos} from '@/server/db/repos';
import {TeamSection} from '@/components/dashboard/team-section';

type Props = {params: Promise<{locale: string}>};

/**
 * Team (Stitch "users" screen): who can act in this restaurant. Owners seat
 * existing accounts by email (sign-up is closed — no invite emails), change
 * roles, and remove seats; managers and staff see the read-only list.
 */
export default async function TeamPage({params}: Props) {
  const {locale} = await params;
  const {session, membership} = await requireMember(locale);
  const members = await createRestaurantRepos(membership.restaurant.id).team.list();

  const t = await getTranslations('dashboard.team');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('tagline')}</p>
      </div>
      <TeamSection
        locale={locale}
        canManage={membership.role === 'owner'}
        currentUserId={session.user.id}
        members={members.map(({userId, name, email, role}) => ({userId, name, email, role}))}
      />
    </div>
  );
}
