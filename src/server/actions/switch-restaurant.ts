'use server';

import {cookies, headers} from 'next/headers';
import {redirect} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';
import {auth} from '@/server/auth';
import {membersRepo} from '@/server/db/repos';
import {ACTIVE_RESTAURANT_COOKIE} from '@/server/dashboard';

type Locale = (typeof routing.locales)[number];

function localeFrom(formData: FormData): Locale {
  const raw = formData.get('locale');
  return routing.locales.includes(raw as Locale) ? (raw as Locale) : routing.defaultLocale;
}

/**
 * Header switcher action: remembers which of the user's own restaurants the
 * dashboard should act on. A target outside their seats never lands in the
 * cookie — the guard would fall back to the default seat anyway, so this
 * just redirects unchanged.
 */
export async function switchRestaurantAction(formData: FormData) {
  const locale = localeFrom(formData);
  const restaurantId = String(formData.get('restaurantId') ?? '');
  const session = await auth.api.getSession({headers: await headers()});
  if (!session) {
    redirect({href: '/login', locale});
    throw new Error('unreachable: redirect() throws');
  }

  const memberships = await membersRepo.listForUser(session.user.id);
  if (!memberships.some((m) => m.restaurant.id === restaurantId)) {
    redirect({href: '/dashboard', locale});
    throw new Error('unreachable: redirect() throws');
  }

  (await cookies()).set(ACTIVE_RESTAURANT_COOKIE, restaurantId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365
  });
  redirect({href: '/dashboard', locale});
  throw new Error('unreachable: redirect() throws');
}
