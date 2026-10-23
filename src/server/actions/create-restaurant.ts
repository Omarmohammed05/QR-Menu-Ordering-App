'use server';

import {headers} from 'next/headers';
import {redirect} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';
import {z} from 'zod';
import {auth} from '@/server/auth';
import {db} from '@/server/db';
import {restaurantMembers, restaurants} from '@/server/db/schema';
import {slugCandidate} from '@/server/restaurants/slug';

type Restaurant = typeof restaurants.$inferSelect;
type Locale = (typeof routing.locales)[number];

/** Machine-readable failure codes; the form maps them to locale strings. */
export type CreateRestaurantState = {error?: 'nameAr' | 'whatsapp' | 'generic'};

const payloadSchema = z.object({
  nameAr: z.string().trim().min(1, 'nameAr').max(200, 'nameAr'),
  nameEn: z.string().trim().max(200, 'nameEn').transform((value) => value || null),
  // E.164 without the double-zero variant — the WhatsApp handoff needs it exact.
  whatsappNumber: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'whatsapp')
});

const SLUG_ATTEMPTS = 5;

function localeFrom(formData: FormData): Locale {
  const raw = formData.get('locale');
  return routing.locales.includes(raw as Locale) ? (raw as Locale) : routing.defaultLocale;
}

function isUniqueViolation(error: unknown): boolean {
  const err = error as {cause?: {code?: string}; code?: string};
  // Drizzle wraps query errors; the Postgres code sits on `.cause`.
  return (err.cause?.code ?? err.code) === '23505';
}

/**
 * One attempt: insert the restaurant and the owner membership atomically.
 * Returns null on a slug race (unique violation) so the caller retries with
 * a fresh random suffix.
 */
async function tryCreateRestaurant(
  slug: string,
  values: z.infer<typeof payloadSchema>,
  userId: string
): Promise<Restaurant | null> {
  try {
    return await db.transaction(async (tx) => {
      const [restaurant] = await tx
        .insert(restaurants)
        .values({
          slug,
          nameAr: values.nameAr,
          nameEn: values.nameEn,
          whatsappNumber: values.whatsappNumber
        })
        .returning();
      if (!restaurant) throw new Error('restaurant insert returned no row');
      await tx.insert(restaurantMembers).values({
        restaurantId: restaurant.id,
        userId,
        role: 'owner'
      });
      return restaurant;
    });
  } catch (error) {
    if (isUniqueViolation(error)) return null;
    throw error;
  }
}

/**
 * Onboarding action: creates the signed-in user's restaurant and seats them
 * as its owner, then lands them on the now tenant-scoped dashboard.
 */
export async function createRestaurantAction(
  _prev: CreateRestaurantState,
  formData: FormData
): Promise<CreateRestaurantState> {
  const locale = localeFrom(formData);
  const session = await auth.api.getSession({headers: await headers()});
  if (!session) {
    redirect({href: '/login', locale});
    // next-intl's redirect isn't typed `never` — this only satisfies the
    // narrowing; it never runs (redirect throws).
    return {error: 'generic'};
  }

  const parsed = payloadSchema.safeParse({
    nameAr: formData.get('nameAr') ?? '',
    nameEn: formData.get('nameEn') ?? '',
    whatsappNumber: formData.get('whatsappNumber') ?? ''
  });
  if (!parsed.success) {
    return {error: parsed.error.issues[0]?.message === 'whatsapp' ? 'whatsapp' : 'nameAr'};
  }

  // Latin name first; Arabic-only names fall back to the generic base inside.
  const base = parsed.data.nameEn ?? parsed.data.nameAr;
  for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt++) {
    const restaurant = await tryCreateRestaurant(slugCandidate(base), parsed.data, session.user.id);
    if (restaurant) redirect({href: '/dashboard', locale});
  }
  return {error: 'generic'};
}
