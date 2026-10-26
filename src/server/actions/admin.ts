'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {routing} from '@/i18n/routing';
import {requirePlatformOwner} from '@/server/platform';
import {db} from '@/server/db';
import {restaurantInvites, restaurants} from '@/server/db/schema';
import {generateInviteCode, invitesRepo, restaurantsRepo} from '@/server/db/repos';
import {slugSuggestions} from '@/server/restaurants/slug';

/**
 * Platform-owner admin actions — the ONLY place restaurants are created.
 * Sign-up is closed: the owner creates the restaurant, an invite code is
 * issued in the same transaction, and the restaurant owner claims their
 * account on the public /claim page with that code.
 */

/** Machine-readable failure codes; the form maps them to locale strings. */
export type AdminCreateState = {error?: 'nameAr' | 'whatsapp' | 'slugTaken' | 'generic'};

const payloadSchema = z.object({
  nameAr: z.string().trim().min(1, 'nameAr').max(200, 'nameAr'),
  nameEn: z.string().trim().max(200, 'nameEn').transform((value) => value || null),
  // E.164 without the double-zero variant — the WhatsApp handoff needs it exact.
  whatsappNumber: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'whatsapp'),
  // The chosen pricing tier; absent (older forms) keeps the `pro` default.
  plan: z.enum(['basic', 'pro', 'chain']).default('pro')
});

const SLUG_ATTEMPTS = 5;

type Locale = (typeof routing.locales)[number];

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
 * One attempt: insert the restaurant and its owner invite atomically.
 * Returns null on a slug race (unique violation) so the caller retries with
 * a fresh candidate.
 */
async function tryCreateRestaurantWithInvite(
  slug: string,
  values: z.infer<typeof payloadSchema>
): Promise<typeof restaurants.$inferSelect | null> {
  try {
    return await db.transaction(async (tx) => {
      const [restaurant] = await tx
        .insert(restaurants)
        .values({
          slug,
          nameAr: values.nameAr,
          nameEn: values.nameEn,
          whatsappNumber: values.whatsappNumber,
          plan: values.plan
        })
        .returning();
      if (!restaurant) throw new Error('restaurant insert returned no row');
      await tx.insert(restaurantInvites).values({
        restaurantId: restaurant.id,
        code: generateInviteCode()
      });
      return restaurant;
    });
  } catch (error) {
    if (isUniqueViolation(error)) return null;
    throw error;
  }
}

/**
 * Creates the restaurant and issues its owner invite — the admin page then
 * shows the claim link + code to send to the restaurant owner.
 */
export async function createRestaurantWithInviteAction(
  _prev: AdminCreateState,
  formData: FormData
): Promise<AdminCreateState> {
  const locale = localeFrom(formData);
  await requirePlatformOwner(locale);

  const parsed = payloadSchema.safeParse({
    nameAr: formData.get('nameAr') ?? '',
    nameEn: formData.get('nameEn') ?? '',
    whatsappNumber: formData.get('whatsappNumber') ?? '',
    plan: formData.get('plan') ?? undefined
  });
  if (!parsed.success) {
    return {error: parsed.error.issues[0]?.message === 'whatsapp' ? 'whatsapp' : 'nameAr'};
  }

  // Latin name first; Arabic-only names are transliterated inside slugify.
  // Clean, hashless slugs: `name`, `name-2`, `name-3`… (see slug.ts).
  const base = parsed.data.nameEn ?? parsed.data.nameAr;
  let created: typeof restaurants.$inferSelect | null = null;
  for (let attempt = 0; attempt < SLUG_ATTEMPTS && !created; attempt++) {
    const slug = await slugSuggestions(base, (candidate) =>
      restaurantsRepo.slugTaken(candidate)
    );
    if (!slug) return {error: 'slugTaken'};
    created = await tryCreateRestaurantWithInvite(slug, parsed.data);
  }
  if (!created) return {error: 'slugTaken'};

  revalidatePath(`/${locale}/admin`);
  return {};
}

/** Revokes the old link/code and issues a fresh one for this restaurant. */
export async function regenerateInviteAction(formData: FormData): Promise<void> {
  const locale = localeFrom(formData);
  await requirePlatformOwner(locale);

  const restaurantId = z.string().uuid().safeParse(formData.get('restaurantId') ?? '');
  if (restaurantId.success) {
    await invitesRepo.issueFor(restaurantId.data);
  }
  revalidatePath(`/${locale}/admin`);
}

/** Pauses/resumes the public menu for one restaurant. */
export async function setRestaurantActiveAction(formData: FormData): Promise<void> {
  const locale = localeFrom(formData);
  await requirePlatformOwner(locale);

  const restaurantId = z.string().uuid().safeParse(formData.get('restaurantId') ?? '');
  const makeActive = formData.get('makeActive') === 'true';
  if (restaurantId.success) {
    await restaurantsRepo.update(restaurantId.data, {isActive: makeActive});
  }
  revalidatePath(`/${locale}/admin`);
  revalidatePath('/', 'layout');
}
