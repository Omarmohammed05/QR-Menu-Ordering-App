'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {routing} from '@/i18n/routing';
import {requireMember} from '@/server/dashboard';
import {restaurantsRepo} from '@/server/db/repos';
import {isReservedSlug, slugify} from '@/server/restaurants/slug';

/** Machine-readable failure codes; the form maps them to locale strings. */
export type UpdateRestaurantState = {
  error?: 'nameAr' | 'whatsapp' | 'slugTaken' | 'slugReserved' | 'slugInvalid' | 'forbidden' | 'generic';
  saved?: boolean;
};

const payloadSchema = z.object({
  nameAr: z.string().trim().min(1, 'nameAr').max(200, 'nameAr'),
  nameEn: z.string().trim().max(200, 'nameEn').transform((value) => value || null),
  // E.164 without the double-zero variant — the WhatsApp handoff needs it exact.
  whatsappNumber: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'whatsapp'),
  /** imgbb URL of the public logo, or empty to drop the current one. */
  logoUrl: z
    .string()
    .trim()
    .url('generic')
    .max(500, 'generic')
    .or(z.literal(''))
    .transform((value) => value || null)
});

type Locale = (typeof routing.locales)[number];

function localeFrom(formData: FormData): Locale {
  const raw = formData.get('locale');
  return routing.locales.includes(raw as Locale) ? (raw as Locale) : routing.defaultLocale;
}

/**
 * Settings action: rewrites the tenant-root profile (name, WhatsApp handoff
 * number). Staff members can view settings but never mutate them — same
 * role policy as the menu actions.
 */
export async function updateRestaurantAction(
  _prev: UpdateRestaurantState,
  formData: FormData
): Promise<UpdateRestaurantState> {
  const locale = localeFrom(formData);
  const {membership} = await requireMember(locale);
  if (membership.role === 'staff') return {error: 'forbidden'};

  const parsed = payloadSchema.safeParse({
    nameAr: formData.get('nameAr') ?? '',
    nameEn: formData.get('nameEn') ?? '',
    whatsappNumber: formData.get('whatsappNumber') ?? '',
    logoUrl: formData.get('logoUrl') ?? ''
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message;
    return {error: first === 'whatsapp' ? 'whatsapp' : 'nameAr'};
  }

  // Optional slug change: shape + reservation + uniqueness (previous slugs
  // included — a freed handle stays retired so old QR codes never misroute).
  const typedSlug = z.string().trim().max(64, 'slugInvalid').safeParse(formData.get('slug') ?? '');
  let slugUpdate: {slug: string; previousSlugs: string[]} | undefined;
  if (typedSlug.success && typedSlug.data !== membership.restaurant.slug) {
    const slug = slugify(typedSlug.data);
    if (typedSlug.data !== slug) return {error: 'slugInvalid'};
    if (isReservedSlug(slug)) return {error: 'slugReserved'};
    if (await restaurantsRepo.slugTaken(slug, membership.restaurant.id)) {
      return {error: 'slugTaken'};
    }
    slugUpdate = {slug, previousSlugs: [membership.restaurant.slug]};
  }

  const updated = await restaurantsRepo.update(membership.restaurant.id, {
    nameAr: parsed.data.nameAr,
    nameEn: parsed.data.nameEn,
    whatsappNumber: parsed.data.whatsappNumber,
    logoUrl: parsed.data.logoUrl,
    ...slugUpdate
  });
  if (!updated) return {error: 'generic'};

  // The shell's restaurant name and every dashboard route read the tenant
  // root, so revalidate the whole dashboard subtree.
  revalidatePath(`/${locale}/dashboard`, 'layout');
  return {saved: true};
}
