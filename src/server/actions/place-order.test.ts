import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {migrate} from 'drizzle-orm/postgres-js/migrator';
import {eq} from 'drizzle-orm';
import {db, client} from '@/server/db';
import {restaurants} from '@/server/db/schema';
import {createRestaurantRepos, restaurantsRepo, type RestaurantRepos} from '@/server/db/repos';
import {placeOrderAction} from './place-order';
import type {restaurants as restaurantRows} from '@/server/db/schema';

/**
 * Integration coverage for the ONLY unauthenticated write path: the server
 * re-prices the cart from the DB, injects the tenant from the slug, persists
 * the order first and only then hands the customer to WhatsApp.
 *
 * Runs against the Postgres pointed to by DATABASE_URL and applies the
 * committed `drizzle/` migrations itself, like the tenancy suite.
 */
describe('placeOrderAction (integration)', () => {
  const slug = `e2e-${randomUUID().slice(0, 8)}`;

  let restaurant: typeof restaurantRows.$inferSelect;
  let repos: RestaurantRepos;
  let item: Awaited<ReturnType<RestaurantRepos['items']['create']>>;
  let unavailable: Awaited<ReturnType<RestaurantRepos['items']['create']>>;
  let table: Awaited<ReturnType<RestaurantRepos['tables']['create']>>;

  const place = (fields: Record<string, string>) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) formData.set(key, value);
    return placeOrderAction({ok: false, error: null}, formData);
  };

  beforeAll(async () => {
    await migrate(db, {migrationsFolder: fileURLToPath(new URL('../../../drizzle', import.meta.url))});

    restaurant = await restaurantsRepo.create({
      slug,
      nameAr: 'مطعم الفحص',
      whatsappNumber: '+20 100 555 0199'
    });
    repos = createRestaurantRepos(restaurant.id);
    const category = await repos.categories.create({nameAr: 'المشويات', sortOrder: 0});
    item = await repos.items.create({
      categoryId: category.id,
      nameAr: 'كفتة',
      pricePiastres: 8500
    });
    unavailable = await repos.items.create({
      categoryId: category.id,
      nameAr: 'موقوف',
      pricePiastres: 1000,
      isAvailable: false
    });
    table = await repos.tables.create({label: 'طاولة ١'});
  }, 60_000);

  afterAll(async () => {
    await db.delete(restaurants).where(eq(restaurants.slug, slug));
  });

  it('persists a server-priced order and hands off to WhatsApp', async () => {
    const state = await place({
      slug,
      cart: JSON.stringify([{id: item.id, quantity: 2}]),
      tableToken: table.token,
      customerName: 'أحمد',
      customerPhone: '+201112223334',
      note: 'بدون بصل'
    });

    expect(state.ok).toBe(true);
    if (!state.ok) return;
    expect(state.whatsappUrl).toMatch(/^https:\/\/wa\.me\/201005550199\?text=/);
    const message = decodeURIComponent(state.whatsappUrl.split('text=')[1] ?? '');
    expect(message).toContain('مطعم الفحص');
    expect(message).toContain('كفتة × 2');
    expect(message).toContain('طاولة ١');
    expect(message).toContain('بدون بصل');

    const board = await repos.orders.listWithItems();
    expect(board).toHaveLength(1);
    const entry = board[0];
    expect(entry?.order.totalPiastres).toBe(17_000); // 2 × 85.00, re-priced server-side
    expect(entry?.order.tableId).toBe(table.id);
    expect(entry?.order.customerName).toBe('أحمد');
    expect(entry?.items.map((line) => line.nameSnapshotAr)).toEqual(['كفتة']);
    expect(entry?.items[0]?.lineTotalPiastres).toBe(17_000);
  });

  it('ignores a table token from another restaurant', async () => {
    const foreign = randomUUID();
    const state = await place({
      slug,
      cart: JSON.stringify([{id: item.id, quantity: 1}]),
      tableToken: foreign
    });
    expect(state.ok).toBe(true);
    const board = await repos.orders.listWithItems();
    expect(board[0]?.order.tableId).toBeNull();
  });

  it('rejects an unavailable dish', async () => {
    const state = await place({
      slug,
      cart: JSON.stringify([
        {id: item.id, quantity: 1},
        {id: unavailable.id, quantity: 1}
      ])
    });
    expect(state).toEqual({ok: false, error: 'cart'});
  });

  it('rejects tampered carts: unknown id, bad JSON, empty cart', async () => {
    expect(await place({slug, cart: JSON.stringify([{id: randomUUID(), quantity: 1}])})).toEqual({
      ok: false,
      error: 'cart'
    });
    expect(await place({slug, cart: '{not json'})).toEqual({ok: false, error: 'cart'});
    expect(await place({slug, cart: '[]'})).toEqual({ok: false, error: 'cart'});
  });

  it('rejects an unknown slug without writing anything', async () => {
    const state = await place({
      slug: 'no-such-restaurant',
      cart: JSON.stringify([{id: item.id, quantity: 1}])
    });
    expect(state).toEqual({ok: false, error: 'generic'});
    // Still exactly the two orders the successful tests wrote.
    expect(await repos.orders.list()).toHaveLength(2);
  });

  it('swallows a filled honeypot without writing anything', async () => {
    const state = await place({
      slug,
      cart: JSON.stringify([{id: item.id, quantity: 1}]),
      company: 'http://spam.example'
    });
    expect(state).toEqual({ok: false, error: 'generic'});
    expect(await repos.orders.list()).toHaveLength(2);
  });

  it('returns the SAME order for a resubmit with the same idempotency key', async () => {
    const idempotencyKey = randomUUID();
    const fields = {
      slug,
      cart: JSON.stringify([{id: item.id, quantity: 1}]),
      customerName: 'سارة',
      idempotencyKey
    };
    const first = await place(fields);
    const retry = await place(fields);

    expect(first.ok).toBe(true);
    expect(retry.ok).toBe(true);
    if (!first.ok || !retry.ok) return;
    expect(retry.publicId).toBe(first.publicId);
    expect(retry.orderNumber).toBe(first.orderNumber);
    expect(first.statusUrl).toBe(retry.statusUrl);
    expect(first.statusUrl).toMatch(new RegExp(`^/${slug}/order/${first.publicId}$`));
    // The WhatsApp message carries the order number and the status link.
    const message = decodeURIComponent(first.whatsappUrl.split('text=')[1] ?? '');
    expect(message).toContain(`طلب #${first.orderNumber}`);
    expect(message).toContain(first.publicId);

    // Exactly ONE new order was written by the two submissions.
    expect(await repos.orders.list()).toHaveLength(3);
  });

  it('numbering stays sequential across orders', async () => {
    const one = await place({slug, cart: JSON.stringify([{id: item.id, quantity: 1}])});
    const two = await place({slug, cart: JSON.stringify([{id: item.id, quantity: 2}])});
    if (!one.ok || !two.ok) throw new Error('expected both orders to place');
    expect(two.orderNumber).toBe(one.orderNumber + 1);
  });

});

describe('placeOrderAction options (integration)', () => {
  // Its own restaurant: the rate limit above is exhausted, and option pricing
  // needs its own fixtures anyway.
  const slug = `e2e-opt-${randomUUID().slice(0, 8)}`;
  let repos: RestaurantRepos;
  let item: Awaited<ReturnType<RestaurantRepos['items']['create']>>;
  let tahini: Awaited<ReturnType<RestaurantRepos['options']['create']>>;
  let bread: Awaited<ReturnType<RestaurantRepos['options']['create']>>;
  let inactive: Awaited<ReturnType<RestaurantRepos['options']['create']>>;

  const place = (fields: Record<string, string>) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) formData.set(key, value);
    return placeOrderAction({ok: false, error: null}, formData);
  };

  beforeAll(async () => {
    const restaurant = await restaurantsRepo.create({
      slug,
      nameAr: 'مطعم الخيارات',
      whatsappNumber: '+20 100 555 0177'
    });
    repos = createRestaurantRepos(restaurant.id);
    const category = await repos.categories.create({nameAr: 'المشويات', sortOrder: 0});
    item = await repos.items.create({categoryId: category.id, nameAr: 'كفتة', pricePiastres: 8500});
    tahini = await repos.options.create({
      menuItemId: item.id,
      nameAr: 'طحينة إضافية',
      priceDeltaPiastres: 500
    });
    bread = await repos.options.create({
      menuItemId: item.id,
      nameAr: 'خبز إضافي',
      priceDeltaPiastres: 300
    });
    inactive = await repos.options.create({
      menuItemId: item.id,
      nameAr: 'خيار موقوف',
      priceDeltaPiastres: 700,
      isActive: false
    });
  }, 60_000);

  afterAll(async () => {
    await db.delete(restaurants).where(eq(restaurants.slug, slug));
  });

  it('prices selected options from the DB and snapshots them on the line', async () => {
    const state = await place({
      slug,
      cart: JSON.stringify([{id: item.id, quantity: 2, optionIds: [tahini.id, bread.id]}])
    });
    expect(state.ok).toBe(true);
    if (!state.ok) return;

    const board = await repos.orders.listWithItems();
    expect(board[0]?.order.totalPiastres).toBe(18_600); // 2 × (85 + 5 + 3), server-priced
    const line = board[0]?.items[0];
    expect(line?.unitPricePiastres).toBe(9_300);
    expect(line?.lineTotalPiastres).toBe(18_600);
    expect(line?.options.map((option) => option.nameAr)).toEqual(['طحينة إضافية', 'خبز إضافي']);

    // The kitchen reads the chosen options inline in the WhatsApp message.
    const message = decodeURIComponent(state.whatsappUrl.split('text=')[1] ?? '');
    expect(message).toContain('كفتة (طحينة إضافية، خبز إضافي) × 2');
  });

  it('counts a repeated option id once', async () => {
    const state = await place({
      slug,
      cart: JSON.stringify([{id: item.id, quantity: 1, optionIds: [tahini.id, tahini.id]}])
    });
    expect(state.ok).toBe(true);
    if (!state.ok) return;
    const board = await repos.orders.listWithItems();
    expect(board[0]?.items[0]?.unitPricePiastres).toBe(9_000); // 85 + 5, once
  });

  it('rejects an unknown or inactive option id as a stale cart', async () => {
    expect(
      await place({slug, cart: JSON.stringify([{id: item.id, quantity: 1, optionIds: [randomUUID()]}])})
    ).toEqual({ok: false, error: 'cart'});
    expect(
      await place({slug, cart: JSON.stringify([{id: item.id, quantity: 1, optionIds: [inactive.id]}])})
    ).toEqual({ok: false, error: 'cart'});
  });
});

describe('placeOrderAction payments (integration)', () => {
  // Its own restaurant: the fixed-window rate limit (10 orders / 10 min per
  // restaurant+IP) is already exhausted by the suite above.
  const slug = `e2e-pay-${randomUUID().slice(0, 8)}`;
  let repos: RestaurantRepos;
  let item: Awaited<ReturnType<RestaurantRepos['items']['create']>>;

  const place = (fields: Record<string, string>) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) formData.set(key, value);
    return placeOrderAction({ok: false, error: null}, formData);
  };

  beforeAll(async () => {
    const restaurant = await restaurantsRepo.create({
      slug,
      nameAr: 'مطعم الدفع',
      whatsappNumber: '+20 100 555 0188',
      instapayHandle: 'fahs@instapay'
    });
    repos = createRestaurantRepos(restaurant.id);
    const category = await repos.categories.create({nameAr: 'المشويات', sortOrder: 0});
    item = await repos.items.create({categoryId: category.id, nameAr: 'كفتة', pricePiastres: 5000});
  }, 60_000);

  afterAll(async () => {
    await db.delete(restaurants).where(eq(restaurants.slug, slug));
    await client.end();
  });

  it('defaults to cash and persists the method on the order', async () => {
    const state = await place({slug, cart: JSON.stringify([{id: item.id, quantity: 1}])});
    expect(state.ok).toBe(true);
    if (!state.ok) return;
    const saved = await repos.orders.findWithItemsByPublicId(state.publicId);
    expect(saved?.order.paymentMethod).toBe('cash');
    expect(saved?.order.paymentProofUrl).toBeNull();

    const message = decodeURIComponent(state.whatsappUrl.split('text=')[1] ?? '');
    expect(message).toContain('طريقة الدفع: كاش');
  });

  it('accepts instapay with an optional transfer screenshot', async () => {
    const proof = 'https://i.ibb.co/receipt/transfer.png';
    const state = await place({
      slug,
      cart: JSON.stringify([{id: item.id, quantity: 1}]),
      paymentMethod: 'instapay',
      paymentProofUrl: proof
    });
    expect(state.ok).toBe(true);
    if (!state.ok) return;

    const saved = await repos.orders.findWithItemsByPublicId(state.publicId);
    expect(saved?.order.paymentMethod).toBe('instapay');
    expect(saved?.order.paymentProofUrl).toBe(proof);

    const message = decodeURIComponent(state.whatsappUrl.split('text=')[1] ?? '');
    expect(message).toContain('طريقة الدفع: إنستاباي');
    expect(message).toContain('حوالة إلى: fahs@instapay');
    expect(message).toContain(`إثبات الدفع: ${proof}`);
  });

  it('falls back to cash when the restaurant has no instapay handle', async () => {
    const restaurant = await restaurantsRepo.findBySlug(slug);
    if (!restaurant) throw new Error('restaurant missing');
    await restaurantsRepo.update(restaurant.id, {instapayHandle: null});

    const state = await place({
      slug,
      cart: JSON.stringify([{id: item.id, quantity: 1}]),
      paymentMethod: 'instapay'
    });
    expect(state.ok).toBe(true);
    if (!state.ok) return;
    const saved = await repos.orders.findWithItemsByPublicId(state.publicId);
    expect(saved?.order.paymentMethod).toBe('cash');

    await restaurantsRepo.update(restaurant.id, {instapayHandle: 'fahs@instapay'});
  });
});
