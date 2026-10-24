import {cache} from 'react';
import {headers} from 'next/headers';
import {redirect} from '@/i18n/navigation';
import {auth} from '@/server/auth';
import {env} from '@/server/env';

/**
 * Platform ownership. The account whose email matches `PLATFORM_OWNER_EMAIL`
 * is the single platform admin: only they reach the admin page, create
 * restaurants, and issue owner invites (public sign-up is closed).
 */

export function isPlatformOwner(email: string | null | undefined): boolean {
  return (
    !!env.PLATFORM_OWNER_EMAIL &&
    !!email &&
    email.trim().toLowerCase() === env.PLATFORM_OWNER_EMAIL
  );
}

/**
 * Guard for /admin: anonymous → login, non-owner → their dashboard. Cached
 * per request so a page + its components don't re-run the session lookup.
 */
export const requirePlatformOwner = cache(async (locale: string) => {
  const session = await auth.api.getSession({headers: await headers()});
  if (!session) {
    redirect({href: '/login', locale});
    throw new Error('unreachable: redirect() throws');
  }
  if (!isPlatformOwner(session.user.email)) {
    redirect({href: '/dashboard', locale});
    throw new Error('unreachable: redirect() throws');
  }
  return session;
});
