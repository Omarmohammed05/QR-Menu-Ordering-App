import type {ReactNode} from 'react';
import {requireMember} from '@/server/dashboard';
import {isPlatformOwner} from '@/server/platform';
import {DashboardShell} from '@/components/dashboard/dashboard-shell';

type Props = {
  children: ReactNode;
  params: Promise<{locale: string}>;
};

/**
 * The dashboard shell: runs the guard once for every dashboard route
 * (login gate + tenant resolution) and renders the Stitch chrome —
 * fixed sidebar, header with the restaurant switcher.
 */
export default async function DashboardLayout({children, params}: Props) {
  const {locale} = await params;
  const {session, membership, memberships} = await requireMember(locale);

  return (
    <DashboardShell
      restaurantName={membership.restaurant.nameAr}
      restaurants={memberships.map((m) => ({
        id: m.restaurant.id,
        nameAr: m.restaurant.nameAr
      }))}
      activeRestaurantId={membership.restaurant.id}
      userEmail={session.user.email}
      showAdmin={isPlatformOwner(session.user.email)}
    >
      {children}
    </DashboardShell>
  );
}
