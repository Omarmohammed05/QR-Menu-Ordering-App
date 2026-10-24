'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {routing} from '@/i18n/routing';
import {isBranchCurrency, isBranchTimezone} from '@/lib/branch-options';
import {requireMember} from '@/server/dashboard';
import {restaurantsRepo} from '@/server/db/repos';
import {isReservedSlug, slugify} from '@/server/restaurants/slug';

/** Machine-readable failure codes; the form maps them to locale strings. */
export type UpdateRestaurantState = {
  error?: 'nameAr' | 'whatsapp' | 'slugTaken' | 'slugReserved' | 'slugInvalid' | 'forbidden' | 'generic';
  saved?: boolean;
};

/** imgbb URL of the public logo — an empty string drops the logo. */
const logoUrlSchema = z
  .string()
  .trim()
  .url('generic')
  .max(500, 'generic')
  .or(z.literal(''))
  .transform((value) => value || null);

const payloadSchema = z.object({
  nameAr: z.string().trim().min(1, 'nameAr').max(200, 'nameAr'),
  nameEn: z.string().trim().max(200, 'nameEn').transform((value) => value || null),
  // E.164 without the double-zero variant — the WhatsApp handoff needs it exact.
  whatsappNumber: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'whatsapp'),
  /** InstaPay address customers pay to — empty disables InstaPay checkout. */
  instapayHandle: z.string().trim().max(64).transform((value) => value || null),
  /** imgbb URL of the public logo, or empty to drop the current one. */
  logoUrl: logoUrlSchema
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
    instapayHandle: formData.get('instapayHandle') ?? '',
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
    instapayHandle: parsed.data.instapayHandle,
    logoUrl: parsed.data.logoUrl,
    ...slugUpdate
  });
  if (!updated) return {error: 'generic'};

  // The shell's restaurant name and every dashboard route read the tenant
  // root, so revalidate the whole dashboard subtree.
  revalidatePath(`/${locale}/dashboard`, 'layout');
  return {saved: true};
}

/** Machine-readable failure codes for the branch-info form. */
export type UpdateBranchInfoState = {
  error?: 'timezone' | 'currency' | 'forbidden' | 'generic';
  saved?: boolean;
};

/**
 * Settings action: persists the branch's timezone and currency — the two
 * tenant-root values every price and opening-hours check renders from. Staff
 * members can view settings but never mutate them.
 */
export async function updateBranchInfoAction(
  _prev: UpdateBranchInfoState,
  formData: FormData
): Promise<UpdateBranchInfoState> {
  const locale = localeFrom(formData);
  const {membership} = await requireMember(locale);
  if (membership.role === 'staff') return {error: 'forbidden'};

  const timezone = z.string().trim().max(64).safeParse(formData.get('timezone') ?? '');
  const currency = z.string().trim().max(8).safeParse(formData.get('currency') ?? '');
  if (!timezone.success || !isBranchTimezone(timezone.data)) return {error: 'timezone'};
  if (!currency.success || !isBranchCurrency(currency.data)) return {error: 'currency'};

  const updated = await restaurantsRepo.update(membership.restaurant.id, {
    timezone: timezone.data,
    currency: currency.data
  });
  if (!updated) return {error: 'generic'};

  // Prices and the open/closed sign render from both — refresh everything.
  revalidatePath('/', 'layout');
  return {saved: true};
}

/** Machine-readable outcome for the settings logo picker. */
export type SetLogoState = {ok: boolean};

/**
 * Immediate logo persistence for the settings screen: the picker uploads to
 * imgbb and this action saves the URL at once — tenant-root branding is not a
 * draft form field, so it must survive a refresh without pressing Save.
 * Removing the logo persists the same way (null drops it).
 */
export async function setLogoAction(url: string | null): Promise<SetLogoState> {
  const {membership} = await requireMember('ar');
  if (membership.role === 'staff') return {ok: false};

  const parsed = logoUrlSchema.safeParse(url ?? '');
  if (!parsed.success) return {ok: false};

  const updated = await restaurantsRepo.update(membership.restaurant.id, {logoUrl: parsed.data});
  if (!updated) return {ok: false};

  // The logo renders in the dashboard shell and on the public menu — revalidate
  // the whole tree so every locale reflects it on the next load.
  revalidatePath('/', 'layout');
  return {ok: true};
}
