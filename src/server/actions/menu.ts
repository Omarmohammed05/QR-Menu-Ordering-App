'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {routing} from '@/i18n/routing';
import {requireMember} from '@/server/dashboard';
import {createRestaurantRepos} from '@/server/db/repos';

type Locale = (typeof routing.locales)[number];

/** Machine-readable failure codes; the forms map them to locale strings. */
export type CreateCategoryState = {error?: 'nameAr' | 'forbidden' | 'generic'};
export type CreateItemState = {error?: 'nameAr' | 'price' | 'category' | 'forbidden' | 'generic'};

const nameArSchema = z.string().trim().min(1, 'nameAr').max(200, 'nameAr');
const descriptionSchema = z.string().trim().max(1000, 'generic').transform((value) => value || null);
/** Price entered as EGP text ("85.50") — stored as integer piastres. */
const priceSchema = z
  .string()
  .trim()
  .regex(/^\d{1,6}(\.\d{1,2})?$/, 'price');

function localeFrom(formData: FormData): Locale {
  const raw = formData.get('locale');
  return routing.locales.includes(raw as Locale) ? (raw as Locale) : routing.defaultLocale;
}

/** Staff members can use the dashboard but never mutate the menu. */
function canManage(role: string): boolean {
  return role === 'owner' || role === 'manager';
}

export async function createCategoryAction(
  _prev: CreateCategoryState,
  formData: FormData
): Promise<CreateCategoryState> {
  const locale = localeFrom(formData);
  const {membership} = await requireMember(locale);
  if (!canManage(membership.role)) return {error: 'forbidden'};

  const parsed = nameArSchema.safeParse(formData.get('nameAr') ?? '');
  if (!parsed.success) return {error: 'nameAr'};

  const repos = createRestaurantRepos(membership.restaurant.id);
  try {
    // New sections sort after existing ones; ties break alphabetically.
    const sortOrder = (await repos.categories.list()).length;
    await repos.categories.create({nameAr: parsed.data, sortOrder});
  } catch {
    return {error: 'generic'};
  }
  revalidatePath(`/${locale}/dashboard/menu`);
  return {};
}

export async function createItemAction(
  _prev: CreateItemState,
  formData: FormData
): Promise<CreateItemState> {
  const locale = localeFrom(formData);
  const {membership} = await requireMember(locale);
  if (!canManage(membership.role)) return {error: 'forbidden'};

  const parsed = z
    .object({
      nameAr: nameArSchema,
      descriptionAr: descriptionSchema,
      price: priceSchema
    })
    .safeParse({
      nameAr: formData.get('nameAr') ?? '',
      descriptionAr: formData.get('descriptionAr') ?? '',
      price: formData.get('price') ?? ''
    });
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message;
    return {error: first === 'price' ? 'price' : first === 'nameAr' ? 'nameAr' : 'generic'};
  }

  // Category is resolved through the scoped repo — a foreign tenant's (or a
  // nonexistent) category id simply comes back null (ADR-002).
  const categoryId = z.string().uuid().safeParse(formData.get('categoryId'));
  if (!categoryId.success) return {error: 'category'};

  const repos = createRestaurantRepos(membership.restaurant.id);
  const category = await repos.categories.findById(categoryId.data);
  if (!category) return {error: 'category'};

  const pricePiastres = Math.round(parseFloat(parsed.data.price) * 100);
  try {
    await repos.items.create({
      categoryId: category.id,
      nameAr: parsed.data.nameAr,
      descriptionAr: parsed.data.descriptionAr,
      pricePiastres
    });
  } catch {
    return {error: 'generic'};
  }
  revalidatePath(`/${locale}/dashboard/menu`);
  return {};
}

export async function toggleItemAvailabilityAction(formData: FormData): Promise<void> {
  const locale = localeFrom(formData);
  const {membership} = await requireMember(locale);
  if (!canManage(membership.role)) return;

  const itemId = formData.get('itemId');
  const makeAvailable = formData.get('makeAvailable') === 'true';
  if (typeof itemId !== 'string') return;

  const repos = createRestaurantRepos(membership.restaurant.id);
  await repos.items.setAvailable(itemId, makeAvailable);
  revalidatePath(`/${locale}/dashboard/menu`);
}
