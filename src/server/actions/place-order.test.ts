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
    await client.end();
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
});
