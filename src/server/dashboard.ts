import {cache} from 'react';
import {headers} from 'next/headers';
import {redirect} from '@/i18n/navigation';
import {auth} from '@/server/auth';
import {membersRepo, type Membership} from '@/server/db/repos';

/** Session + resolved tenant seat for a dashboard page or action. */
export type MemberContext = {
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
  membership: Membership;
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

  const membership = (await membersRepo.listForUser(session.user.id))[0];
  if (!membership) {
    redirect({href: '/onboarding', locale});
    throw new Error('unreachable: redirect() throws');
  }

  return {session, membership};
});
