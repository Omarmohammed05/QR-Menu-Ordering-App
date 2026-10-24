'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {routing} from '@/i18n/routing';
import {requireMember} from '@/server/dashboard';
import {createRestaurantRepos} from '@/server/db/repos';

/**
 * Opening hours (settings screen): the weekly schedule evaluated by the
 * public menu's open/closed badge. Same role policy as the other settings
 * actions — staff can view, never mutate.
 */

/** Machine-readable failure codes; the form maps them to locale strings. */
export type OpeningHoursState = {
  error?: 'weekday' | 'times' | 'range' | 'duplicate' | 'forbidden' | 'generic';
  saved?: boolean;
};

/** `<input type="time">` submits `HH:MM`; zero-padded so string compare is safe. */
const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'times');

type Locale = (typeof routing.locales)[number];

function localeFrom(formData: FormData): Locale {
  const raw = formData.get('locale');
  return routing.locales.includes(raw as Locale) ? (raw as Locale) : routing.defaultLocale;
}

function revalidate(locale: Locale) {
  revalidatePath(`/${locale}/dashboard/settings`);
  // The public menu renders its open/closed badge from this schedule.
  revalidatePath('/', 'layout');
}

export async function addOpeningHourAction(
  _prev: OpeningHoursState,
  formData: FormData
): Promise<OpeningHoursState> {
  const locale = localeFrom(formData);
  const {membership} = await requireMember(locale);
  if (membership.role === 'staff') return {error: 'forbidden'};

  const weekday = z.coerce
    .number()
    .int()
    .min(0)
    .max(6)
    .safeParse(formData.get('weekday') ?? '');
  const opensAt = timeSchema.safeParse(formData.get('opensAt') ?? '');
  const closesAt = timeSchema.safeParse(formData.get('closesAt') ?? '');
  if (!weekday.success) return {error: 'weekday'};
  if (!opensAt.success || !closesAt.success) return {error: 'times'};
  if (opensAt.data >= closesAt.data) return {error: 'range'};

  try {
    await createRestaurantRepos(membership.restaurant.id).hours.create({
      weekday: weekday.data,
      opensAt: opensAt.data,
      closesAt: closesAt.data
    });
  } catch (error) {
    // Same weekday + open time twice — the table's unique constraint. Drizzle
    // wraps driver errors, so the pg code may sit on the cause.
    const err = error as {code?: string; cause?: {code?: string}};
    if (err.code === '23505' || err.cause?.code === '23505') return {error: 'duplicate'};
    throw error;
  }
  revalidate(locale);
  return {saved: true};
}

/** Plain form action (no result state) — the slot row disappears on success. */
export async function deleteOpeningHourAction(formData: FormData): Promise<void> {
  const locale = localeFrom(formData);
  const {membership} = await requireMember(locale);
  if (membership.role === 'staff') return;

  const id = z.string().uuid().safeParse(formData.get('slotId') ?? '');
  if (!id.success) return;

  await createRestaurantRepos(membership.restaurant.id).hours.remove(id.data);
  revalidate(locale);
}
