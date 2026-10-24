'use server';

import {z} from 'zod';
import {buildOrderMessage, buildWhatsAppUrl} from '@/lib/whatsapp';
import {isOpenAt} from '@/lib/opening-hours';
import {formatPrice} from '@/lib/format';
import {createRestaurantRepos, restaurantsRepo, tablesByToken} from '@/server/db/repos';
import type {NewOrderItem} from '@/server/db/repos';

/**
 * Public order placement — the ONLY unauthenticated write path, so the server
 * is the sole authority: cart ids are re-priced from the DB, quantities and
 * totals recomputed, and the tenant injected from the slug. The client never
 * supplies a price.
 */
export type PlaceOrderState =
  | {ok: false; error: 'cart' | 'closed' | 'generic' | null}
  | {ok: true; whatsappUrl: string};

const MAX_LINES = 50;
const MAX_QUANTITY = 50;

const cartSchema = z.array(
  z.object({
    id: z.string().uuid(),
    quantity: z.number().int().min(1).max(MAX_QUANTITY)
  })
);
type CartLine = z.infer<typeof cartSchema>;

function parseCart(raw: FormDataEntryValue | null): CartLine | null {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(typeof raw === 'string' ? raw : '[]');
  } catch {
    return null;
  }
  const parsed = cartSchema.safeParse(parsedJson);
  if (!parsed.success || parsed.data.length === 0 || parsed.data.length > MAX_LINES) return null;
  return parsed.data;
}

export async function placeOrderAction(
  _prev: PlaceOrderState,
  formData: FormData
): Promise<PlaceOrderState> {
  const slug = z.string().trim().min(1).safeParse(formData.get('slug') ?? '');
  if (!slug.success) return {ok: false, error: 'generic'};

  const restaurant = await restaurantsRepo.findBySlug(slug.data);
  if (!restaurant || !restaurant.isActive) return {ok: false, error: 'generic'};

  const cart = parseCart(formData.get('cart'));
  if (!cart) return {ok: false, error: 'cart'};

  const repos = createRestaurantRepos(restaurant.id);
  const slots = await repos.hours.list();
  if (!isOpenAt(slots, new Date(), restaurant.timezone)) return {ok: false, error: 'closed'};

  // Re-price every line from the tenant-scoped repo: unavailable, unknown or
  // foreign ids drop the whole order (the customer sees a stale cart).
  const lines: NewOrderItem[] = [];
  for (const line of cart) {
    const item = await repos.items.findById(line.id);
    if (!item || !item.isAvailable) return {ok: false, error: 'cart'};
    lines.push({
      menuItemId: item.id,
      quantity: line.quantity,
      unitPricePiastres: item.pricePiastres,
      nameSnapshotAr: item.nameAr,
      options: [],
      lineTotalPiastres: item.pricePiastres * line.quantity
    });
  }

  // Table QR token → seat, only when it belongs to THIS restaurant.
  const token = formData.get('tableToken');
  let tableId: string | null = null;
  if (typeof token === 'string' && token) {
    const resolved = await tablesByToken.findActive(token);
    if (resolved && resolved.restaurant.id === restaurant.id) tableId = resolved.table.id;
  }

  const totalPiastres = lines.reduce((sum, line) => sum + line.lineTotalPiastres, 0);
  const optionalText = (value: FormDataEntryValue | null, max: number) => {
    const text = typeof value === 'string' ? value.trim() : '';
    return text ? text.slice(0, max) : undefined;
  };

  try {
    const {order} = await repos.orders.create({
      tableId,
      customerName: optionalText(formData.get('customerName'), 100),
      customerPhone: optionalText(formData.get('customerPhone'), 20),
      note: optionalText(formData.get('note'), 500),
      totalPiastres,
      items: lines
    });

    const message = buildOrderMessage({
      restaurantName: restaurant.nameAr,
      orderLabel: `طلب #${order.id.slice(0, 8)}`,
      tableLabel: tableId ? (await repos.tables.findById(tableId))?.label : null,
      items: lines.map((line) => ({
        name: line.nameSnapshotAr,
        quantity: line.quantity,
        lineTotalPiastres: line.lineTotalPiastres
      })),
      totalPiastres,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      note: order.note,
      formatPrice: (piastres) => formatPrice(piastres, 'ar', restaurant.currency)
    });

    return {ok: true, whatsappUrl: buildWhatsAppUrl(restaurant.whatsappNumber, message)};
  } catch {
    return {ok: false, error: 'generic'};
  }
}
