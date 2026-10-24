'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {routing} from '@/i18n/routing';
import {requireMember} from '@/server/dashboard';
import {createRestaurantRepos} from '@/server/db/repos';

type Locale = (typeof routing.locales)[number];

/** Machine-readable failure codes; the forms map them to locale strings. */
export type CreateTableState = {error?: 'label' | 'forbidden' | 'generic'};

const labelSchema = z.string().trim().min(1, 'label').max(100, 'label');

function localeFrom(formData: FormData): Locale {
  const raw = formData.get('locale');
  return routing.locales.includes(raw as Locale) ? (raw as Locale) : routing.defaultLocale;
}

/** Owner and manager manage tables; staff only read them (menu rule). */
function canManage(role: string): boolean {
  return role === 'owner' || role === 'manager';
}

/** One QR'd table label ("طاولة ٣"). Reuses the menu-management role gate. */
export async function createTableAction(
  _prev: CreateTableState,
  formData: FormData
): Promise<CreateTableState> {
  const locale = localeFrom(formData);
  const {membership} = await requireMember(locale);
  if (!canManage(membership.role)) return {error: 'forbidden'};

  const parsed = labelSchema.safeParse(formData.get('label') ?? '');
  if (!parsed.success) return {error: 'label'};

  const repos = createRestaurantRepos(membership.restaurant.id);
  try {
    await repos.tables.create({label: parsed.data});
  } catch {
    return {error: 'generic'};
  }
  revalidatePath(`/${locale}/dashboard/tables`);
  return {};
}

/** Archive/unarchive a table — archived QRs stop seating customers. */
export async function setTableActiveAction(formData: FormData): Promise<void> {
  const locale = localeFrom(formData);
  const {membership} = await requireMember(locale);
  if (!canManage(membership.role)) return;

  const tableId = z.string().uuid().safeParse(formData.get('tableId') ?? '');
  const makeActive = formData.get('makeActive') === 'true';
  if (!tableId.success) return;

  const repos = createRestaurantRepos(membership.restaurant.id);
  await repos.tables.setActive(tableId.data, makeActive);
  revalidatePath(`/${locale}/dashboard/tables`);
}
