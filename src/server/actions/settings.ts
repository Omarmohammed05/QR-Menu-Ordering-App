'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {routing} from '@/i18n/routing';
import {requireMember} from '@/server/dashboard';
import {restaurantsRepo} from '@/server/db/repos';

/** Machine-readable failure codes; the form maps them to locale strings. */
export type UpdateRestaurantState = {
  error?: 'nameAr' | 'whatsapp' | 'forbidden' | 'generic';
  saved?: boolean;
};

const payloadSchema = z.object({
  nameAr: z.string().trim().min(1, 'nameAr').max(200, 'nameAr'),
  nameEn: z.string().trim().max(200, 'nameEn').transform((value) => value || null),
  // E.164 without the double-zero variant — the WhatsApp handoff needs it exact.
  whatsappNumber: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'whatsapp')
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
    whatsappNumber: formData.get('whatsappNumber') ?? ''
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message;
    return {error: first === 'whatsapp' ? 'whatsapp' : 'nameAr'};
  }

  const updated = await restaurantsRepo.update(membership.restaurant.id, {
    nameAr: parsed.data.nameAr,
    nameEn: parsed.data.nameEn,
    whatsappNumber: parsed.data.whatsappNumber
  });
  if (!updated) return {error: 'generic'};

  // The shell's restaurant name and every dashboard route read the tenant
  // root, so revalidate the whole dashboard subtree.
  revalidatePath(`/${locale}/dashboard`, 'layout');
  return {saved: true};
}
