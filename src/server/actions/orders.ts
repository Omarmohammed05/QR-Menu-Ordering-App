'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {routing} from '@/i18n/routing';
import {requireMember} from '@/server/dashboard';
import {createRestaurantRepos, type OrderStatus} from '@/server/db/repos';

type Locale = (typeof routing.locales)[number];

const statusSchema = z.enum(['pending', 'accepted', 'ready', 'completed', 'cancelled']);

function localeFrom(formData: FormData): Locale {
  const raw = formData.get('locale');
  return routing.locales.includes(raw as Locale) ? (raw as Locale) : routing.defaultLocale;
}

/**
 * Move an order along its lifecycle. Every dashboard seat may advance orders
 * — running the floor is the staff role's job — but cancelling is a manager+
 * decision and always carries a reason (spec §5). Illegal transitions are
 * rejected by the repo's status machine (spec §6).
 */
export async function setOrderStatusAction(formData: FormData): Promise<void> {
  const locale = localeFrom(formData);
  const {membership} = await requireMember(locale);

  const orderId = z.string().uuid().safeParse(formData.get('orderId') ?? '');
  const status = statusSchema.safeParse(formData.get('status') ?? '');
  if (!orderId.success || !status.success) return;

  const reason = z
    .string()
    .trim()
    .min(1)
    .max(200)
    .safeParse(formData.get('reason') ?? '');

  if (status.data === 'cancelled') {
    if (membership.role === 'staff') return; // cancel is manager+ (spec §5)
    if (!reason.success) return; // a cancel without a reason is never written
  }

  const repos = createRestaurantRepos(membership.restaurant.id);
  // Scoped repo: a foreign-tenant order id is a silent no-op (ADR-002).
  await repos.orders.setStatus(
    orderId.data,
    status.data as OrderStatus,
    status.data === 'cancelled' ? reason.data : undefined
  );
  revalidatePath(`/${locale}/dashboard/orders`);
}
