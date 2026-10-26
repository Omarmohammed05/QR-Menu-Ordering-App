'use server';

import {headers} from 'next/headers';
import {z} from 'zod';
import {buildOrderMessage, buildWhatsAppUrl} from '@/lib/whatsapp';
import {isOpenAt} from '@/lib/opening-hours';
import {formatPrice} from '@/lib/format';
import {buildOrderStatusUrl, orderStatusPath} from '@/lib/public-url';
import {routing} from '@/i18n/routing';
import {createRestaurantRepos, restaurantsRepo, tablesByToken} from '@/server/db/repos';
import {consumeRateLimit, rateLimitKey} from '@/server/security/rate-limit';
import {newIdempotencyKey} from '@/lib/ids';
import {env} from '@/server/env';
import type {NewOrderItem, OrderItemOptionSnapshot} from '@/server/db/repos';

/**
 * Public order placement — the ONLY unauthenticated write path, so the server
 * is the sole authority: cart ids and selected option choices are re-priced
 * from the DB, quantities and totals recomputed, the tenant injected from
 * the slug, submissions rate limited per IP, and a resubmit with the same
 * idempotency key returns the original order. The client never supplies a
 * price.
 */
export type PlaceOrderState =
  | {ok: false; error: 'cart' | 'options' | 'address' | 'closed' | 'rate' | 'generic' | null}
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
    /** Selected option choice ids (sizes/modifiers/add-ons). */
    options: z.array(z.string().uuid()).max(50).optional()
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

    // Selected choices are re-priced from the DB exactly like the base price:
    // an unknown/foreign/retired choice id fails the whole cart, and a
    // required group the customer never answered fails with `options`.
    const selectedIds = [...new Set(line.options ?? [])];
    const {groups, chosen} = await repos.options.findActiveChoices(item.id, selectedIds);
    if (chosen.size !== selectedIds.length) return {ok: false, error: 'cart'};
    const unanswered = groups.filter(
      (group) => group.isRequired && !group.choices.some((choice) => chosen.has(choice.id))
    );
    if (unanswered.length > 0) return {ok: false, error: 'options'};

    const options: OrderItemOptionSnapshot[] = [...chosen.entries()].map(([choiceId, group]) => {
      const choice = group.choices.find((entry) => entry.id === choiceId)!;
      return {
        id: choice.id,
        nameAr: choice.nameAr,
        nameEn: choice.nameEn ?? null,
        priceDeltaPiastres: choice.priceDeltaPiastres,
        kind: group.kind,
        groupNameAr: group.nameAr,
        groupNameEn: group.nameEn ?? null
      };
    });
    const unitPricePiastres =
      item.pricePiastres +
      options.reduce((sum, option) => sum + option.priceDeltaPiastres, 0);

    lines.push({
      menuItemId: item.id,
      quantity: line.quantity,
      unitPricePiastres,
      nameSnapshotAr: item.nameAr,
      options,
      lineTotalPiastres: unitPricePiastres * line.quantity
    });
  }

  // Table QR token → seat, only when it belongs to THIS restaurant. A scanned
  // table pins the order to dine-in; without it the customer's own toggle
  // decides between delivery and takeaway.
  const token = formData.get('tableToken');
  let tableId: string | null = null;
  if (typeof token === 'string' && token) {
    const resolved = await tablesByToken.findActive(token);
    if (resolved && resolved.restaurant.id === restaurant.id) tableId = resolved.table.id;
  }

  // Order type: dine-in comes from the table; otherwise the form's own field
  // (default takeaway). Delivery requires an address.
  let orderType: 'dine_in' | 'delivery' | 'takeaway';
  if (tableId) orderType = 'dine_in';
  else {
    const rawType = formData.get('orderType');
    orderType = rawType === 'delivery' ? 'delivery' : 'takeaway';
  }
  const rawAddress = z.string().trim().min(5).max(300).safeParse(formData.get('deliveryAddress') ?? '');
  const deliveryAddress =
    orderType === 'delivery' ? (rawAddress.success ? rawAddress.data : null) : null;
  if (orderType === 'delivery' && !deliveryAddress) return {ok: false, error: 'address'};

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
      orderType,
      deliveryAddress,
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
      orderType,
      tableLabel: tableId ? (await repos.tables.findById(tableId))?.label : null,
      deliveryAddress: order.deliveryAddress,
      items: lines.map((line) => ({
        name: line.nameSnapshotAr,
        quantity: line.quantity,
        lineTotalPiastres: line.lineTotalPiastres,
        options: line.options
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
