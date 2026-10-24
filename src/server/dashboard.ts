import {cache} from 'react';
import {cookies, headers} from 'next/headers';
import {redirect} from '@/i18n/navigation';
import {auth} from '@/server/auth';
import {membersRepo, type Membership} from '@/server/db/repos';

/** Cookie remembering the restaurant picked in the header switcher. */
export const ACTIVE_RESTAURANT_COOKIE = 'active-restaurant';

/** Session + resolved tenant seat for a dashboard page or action. */
export type MemberContext = {
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
  membership: Membership;
  /** Every seat the user holds — the header switcher lists these. */
  memberships: Membership[];
};

/**
 * The shared dashboard guard: a valid session AND a restaurant membership.
 * Request-cached, so a layout and its page running in one request hit the
 * session and membership queries once. Unauthenticated users land on login,
 * members without a restaurant on onboarding (Phase 3 flow).
 */
export const requireMember = cache(async (locale: string): Promise<MemberContext> => {
  const session = await auth.api.getSession({headers: await headers()});
  if (!session) {
    redirect({href: '/login', locale});
    throw new Error('unreachable: redirect() throws');
  }

  const memberships = await membersRepo.listForUser(session.user.id);
  // The switcher's pick wins; otherwise the oldest seat stays the default.
  const activeId = (await cookies()).get(ACTIVE_RESTAURANT_COOKIE)?.value;
  const membership = memberships.find((m) => m.restaurant.id === activeId) ?? memberships[0];
  if (!membership) {
    redirect({href: '/onboarding', locale});
    throw new Error('unreachable: redirect() throws');
  }

  return {session, membership, memberships};
});
