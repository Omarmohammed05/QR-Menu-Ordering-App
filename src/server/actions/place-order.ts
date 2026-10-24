'use server';

import {headers} from 'next/headers';
import {z} from 'zod';
import {buildOrderMessage, buildWhatsAppUrl} from '@/lib/whatsapp';
import {isOpenAt} from '@/lib/opening-hours';
import {formatPrice} from '@/lib/format';
import {buildOrderStatusUrl, orderStatusPath} from '@/lib/public-url';
import {routing} from '@/i18n/routing';
import {createRestaurantRepos, restaurantsRepo, tablesByToken} from '@/server/db/repos';
import type {OrderItemOptionSnapshot} from '@/server/db/schema';
import {consumeRateLimit, rateLimitKey} from '@/server/security/rate-limit';
import {newIdempotencyKey} from '@/lib/ids';
import {env} from '@/server/env';
import type {NewOrderItem} from '@/server/db/repos';

/**
 * Public order placement — the ONLY unauthenticated write path, so the server
 * is the sole authority: cart ids are re-priced from the DB, quantities and
 * totals recomputed, the tenant injected from the slug, submissions rate
 * limited per IP, and a resubmit with the same idempotency key returns the
 * original order. The client never supplies a price.
 */
export type PlaceOrderState =
  | {ok: false; error: 'cart' | 'closed' | 'rate' | 'generic' | null}
  | {
      ok: true;
      whatsappUrl: string;
      /** Client route to the status page (SPA path, not absolute). */
      statusUrl: string;
      publicId: string;
      orderNumber: number;
    };

const MAX_LINES = 50;
const MAX_QUANTITY = 50;
/** Spec §11: 10 orders / 10 minutes / IP+restaurant. */
const ORDER_RATE_LIMIT = 10;
const ORDER_RATE_WINDOW_SECONDS = 600;

const cartSchema = z.array(
  z.object({
    id: z.string().uuid(),
    quantity: z.number().int().min(1).max(MAX_QUANTITY),
    optionIds: z.array(z.string().uuid()).max(MAX_LINES).default([])
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

/** First hop of the proxy chain — the real client, not the proxy. */
async function clientIp(): Promise<string> {
  try {
    const forwarded = (await headers()).get('x-forwarded-for');
    return forwarded?.split(',')[0]?.trim() || 'unknown';
  } catch {
    return 'unknown'; // outside a request scope (tests, scripts)
  }
}

export async function placeOrderAction(
  _prev: PlaceOrderState,
  formData: FormData
): Promise<PlaceOrderState> {
  // Honeypot: humans never see this field; anything in it is a bot (spec §11).
  if (typeof formData.get('company') === 'string' && formData.get('company') !== '') {
    return {ok: false, error: 'generic'};
  }

  const slug = z.string().trim().min(1).safeParse(formData.get('slug') ?? '');
  if (!slug.success) return {ok: false, error: 'generic'};

  const restaurant = await restaurantsRepo.findBySlug(slug.data);
  if (!restaurant || !restaurant.isActive) return {ok: false, error: 'generic'};

  const allowed = await consumeRateLimit(
    rateLimitKey('order', restaurant.id, await clientIp()),
    ORDER_RATE_LIMIT,
    ORDER_RATE_WINDOW_SECONDS
  );
  if (!allowed) return {ok: false, error: 'rate'};

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

    // Options are re-priced from the DB too: an unknown, inactive or foreign
    // option id drops the whole order with the same stale-cart error.
    const activeOptions = await repos.options.listActiveByItem(item.id);
    const optionsById = new Map(activeOptions.map((option) => [option.id, option]));
    const snapshots: OrderItemOptionSnapshot[] = [];
    for (const optionId of new Set(line.optionIds)) {
      const option = optionsById.get(optionId);
      if (!option) return {ok: false, error: 'cart'};
      snapshots.push({
        id: option.id,
        nameAr: option.nameAr,
        nameEn: option.nameEn ?? null,
        priceDeltaPiastres: option.priceDeltaPiastres
      });
    }
    const unitPricePiastres =
      item.pricePiastres + snapshots.reduce((sum, o) => sum + o.priceDeltaPiastres, 0);
    lines.push({
      menuItemId: item.id,
      quantity: line.quantity,
      unitPricePiastres,
      nameSnapshotAr: item.nameAr,
      options: snapshots,
      lineTotalPiastres: unitPricePiastres * line.quantity
    });
  }

  // Table QR token → seat, only when it belongs to THIS restaurant.
  const token = formData.get('tableToken');
  let tableId: string | null = null;
  if (typeof token === 'string' && token) {
    const resolved = await tablesByToken.findActive(token);
    if (resolved && resolved.restaurant.id === restaurant.id) tableId = resolved.table.id;
  }

  // Payment: cash by default. InstaPay is honored only when the restaurant
  // has a handle configured — otherwise the order lands as cash, because a
  // removed handle must never block checkout.
  const rawPayment = formData.get('paymentMethod');
  const paymentMethod =
    rawPayment === 'instapay' && restaurant.instapayHandle ? ('instapay' as const) : ('cash' as const);

  // Optional InstaPay transfer screenshot (imgbb URL from the upload action).
  const rawProof = z
    .string()
    .trim()
    .url()
    .max(500)
    .or(z.literal(''))
    .safeParse(formData.get('paymentProofUrl') ?? '');
  const paymentProofUrl =
    paymentMethod === 'instapay' && rawProof.success && rawProof.data ? rawProof.data : null;

  const rawLocale = formData.get('locale');
  const orderLocale = routing.locales.includes(rawLocale as (typeof routing.locales)[number])
    ? (rawLocale as (typeof routing.locales)[number])
    : routing.defaultLocale;

  const idempotencyKey = z
    .string()
    .trim()
    .min(1)
    .max(100)
    .safeParse(formData.get('idempotencyKey') ?? '');
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
      items: lines,
      idempotencyKey: idempotencyKey.success ? idempotencyKey.data : newIdempotencyKey(),
      locale: orderLocale,
      paymentMethod,
      paymentProofUrl
    });

    const message = buildOrderMessage({
      restaurantName: restaurant.nameAr,
      orderLabel: `طلب #${order.number}`,
      tableLabel: tableId ? (await repos.tables.findById(tableId))?.label : null,
      items: lines.map((line) => ({
        // The kitchen reads chosen options inline with the dish name.
        name:
          line.options.length > 0
            ? `${line.nameSnapshotAr} (${line.options.map((o) => o.nameAr).join('، ')})`
            : line.nameSnapshotAr,
        quantity: line.quantity,
        lineTotalPiastres: line.lineTotalPiastres
      })),
      totalPiastres,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      note: order.note,
      paymentMethod,
      instapayHandle: restaurant.instapayHandle,
      paymentProofUrl,
      statusUrl: buildOrderStatusUrl(
        env.NEXT_PUBLIC_APP_URL,
        restaurant.slug,
        order.publicId,
        orderLocale
      ),
      formatPrice: (piastres) => formatPrice(piastres, 'ar', restaurant.currency)
    });

    return {
      ok: true,
      whatsappUrl: buildWhatsAppUrl(restaurant.whatsappNumber, message),
      statusUrl: orderStatusPath(restaurant.slug, order.publicId, orderLocale),
      publicId: order.publicId,
      orderNumber: order.number
    };
  } catch {
    return {ok: false, error: 'generic'};
  }
}
