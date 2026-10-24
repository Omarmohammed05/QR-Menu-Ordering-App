'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {routing} from '@/i18n/routing';
import {requireMember} from '@/server/dashboard';
import {createRestaurantRepos} from '@/server/db/repos';

/**
 * Branch addresses (settings screen): the restaurant's physical locations
 * shown to customers on the public menu. Same role policy as the other
 * settings actions — staff can view, never mutate.
 */

/** Machine-readable failure codes; the form maps them to locale strings. */
export type AddressMutationState = {
  error?: 'label' | 'address' | 'notFound' | 'forbidden' | 'generic';
  saved?: boolean;
};

const labelSchema = z.string().trim().min(1, 'label').max(100, 'label');
const addressSchema = z.string().trim().min(1, 'address').max(500, 'address');

type Locale = (typeof routing.locales)[number];

function localeFrom(formData: FormData): Locale {
  const raw = formData.get('locale');
  return routing.locales.includes(raw as Locale) ? (raw as Locale) : routing.defaultLocale;
}

function revalidate(locale: Locale) {
  revalidatePath(`/${locale}/dashboard/settings`);
  // The branches section renders on the customer menu.
  revalidatePath('/', 'layout');
}

export async function addAddressAction(
  _prev: AddressMutationState,
  formData: FormData
): Promise<AddressMutationState> {
  const locale = localeFrom(formData);
  const {membership} = await requireMember(locale);
  if (membership.role === 'staff') return {error: 'forbidden'};

  const label = labelSchema.safeParse(formData.get('label') ?? '');
  const address = addressSchema.safeParse(formData.get('address') ?? '');
  if (!label.success) return {error: 'label'};
  if (!address.success) return {error: 'address'};

  try {
    await createRestaurantRepos(membership.restaurant.id).addresses.create({
      label: label.data,
      address: address.data
    });
  } catch {
    return {error: 'generic'};
  }
  revalidate(locale);
  return {};
}

export async function updateAddressAction(
  _prev: AddressMutationState,
  formData: FormData
): Promise<AddressMutationState> {
  const locale = localeFrom(formData);
  const {membership} = await requireMember(locale);
  if (membership.role === 'staff') return {error: 'forbidden'};

  const id = z.string().uuid().safeParse(formData.get('addressId') ?? '');
  if (!id.success) return {error: 'generic'};

  const label = labelSchema.safeParse(formData.get('label') ?? '');
  const address = addressSchema.safeParse(formData.get('address') ?? '');
  if (!label.success) return {error: 'label'};
  if (!address.success) return {error: 'address'};

  const repos = createRestaurantRepos(membership.restaurant.id);
  if (!(await repos.addresses.findById(id.data))) return {error: 'notFound'};
  if (!(await repos.addresses.update(id.data, {label: label.data, address: address.data}))) {
    return {error: 'generic'};
  }
  revalidate(locale);
  return {saved: true};
}

/** Plain form action (no result state) — the row disappears on success. */
export async function deleteAddressAction(formData: FormData): Promise<void> {
  const locale = localeFrom(formData);
  const {membership} = await requireMember(locale);
  if (membership.role === 'staff') return;

  const id = z.string().uuid().safeParse(formData.get('addressId') ?? '');
  if (!id.success) return;

  await createRestaurantRepos(membership.restaurant.id).addresses.remove(id.data);
  revalidate(locale);
}
