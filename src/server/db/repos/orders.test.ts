import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {migrate} from 'drizzle-orm/postgres-js/migrator';
import {eq} from 'drizzle-orm';
import {db, client} from '@/server/db';
import {restaurants} from '@/server/db/schema';
import {
  createRestaurantRepos,
  restaurantsRepo,
  type RestaurantRepos
} from '@/server/db/repos';
import {consumeRateLimit, rateLimitKey} from '@/server/security/rate-limit';
import type {restaurants as restaurantRows} from '@/server/db/schema';

/**
 * Order-engine integration coverage (spec §6): gapless per-tenant sequential
 * numbers under concurrency, idempotent resubmission, the status machine with
 * its audit trail, and the rate-limit window. Applies the committed
 * `drizzle/` migrations itself, like the tenancy suite.
 */
describe('orders repo (integration)', () => {
  const slug = `ord-${randomUUID().slice(0, 8)}`;

  let restaurant: typeof restaurantRows.$inferSelect;
  let repos: RestaurantRepos;
  let itemId: string;

  const newOrder = (overrides: Partial<Parameters<RestaurantRepos['orders']['create']>[0]> = {}) => ({
    totalPiastres: 5000,
    items: [
      {
        menuItemId: itemId,
        quantity: 1,
        unitPricePiastres: 5000,
        nameSnapshotAr: 'طبق',
        options: [],
        lineTotalPiastres: 5000
      }
    ],
    ...overrides
  });

  beforeAll(async () => {
    await migrate(db, {migrationsFolder: fileURLToPath(new URL('../../../drizzle', import.meta.url))});

    restaurant = await restaurantsRepo.create({
      slug,
      nameAr: 'مطعم الأرقام',
      whatsappNumber: '+20 100 555 0199'
    });
    repos = createRestaurantRepos(restaurant.id);
    const category = await repos.categories.create({nameAr: 'قسم', sortOrder: 0});
    const item = await repos.items.create({categoryId: category.id, nameAr: 'طبق', pricePiastres: 5000});
    itemId = item.id;
  }, 60_000);

  afterAll(async () => {
    await db.delete(restaurants).where(eq(restaurants.slug, slug));
    await client.end();
  });

  it('hands out unique gapless numbers under concurrency', async () => {
    const placed = await Promise.all(
      Array.from({length: 6}, () => repos.orders.create(newOrder()))
    );
    const numbers = placed.map(({order}) => order.number).sort((a, b) => a - b);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('returns the same order for a resubmit with the same idempotency key', async () => {
    const key = randomUUID();
    const first = await repos.orders.create(newOrder({idempotencyKey: key}));
    const again = await repos.orders.create(newOrder({idempotencyKey: key}));
    expect(again.order.id).toBe(first.order.id);
    expect(again.order.publicId).toBe(first.order.publicId);
    expect(again.order.number).toBe(first.order.number);

    // The write raced itself exactly once — 7 orders total so far.
    const all = await repos.orders.list();
    expect(all).toHaveLength(7);
  });

  it('accepts only legal transitions and writes an event per move', async () => {
    const {order} = await repos.orders.create(newOrder());

    // pending → completed skips steps: illegal.
    expect(await repos.orders.setStatus(order.id, 'completed')).toEqual({ok: false, reason: 'illegal'});
    // Unknown/foreign id: a miss.
    expect(await repos.orders.setStatus(randomUUID(), 'accepted')).toEqual({ok: false, reason: 'missing'});

    expect(await repos.orders.setStatus(order.id, 'accepted')).toEqual({ok: true});
    expect(await repos.orders.setStatus(order.id, 'pending')).toEqual({ok: false, reason: 'illegal'});
    expect(await repos.orders.setStatus(order.id, 'ready')).toEqual({ok: true});
    expect(await repos.orders.setStatus(order.id, 'cancelled', 'نفد الصنف')).toEqual({ok: true});

    const loaded = await repos.orders.findWithItemsByPublicId(order.publicId);
    expect(loaded?.order.status).toBe('cancelled');
    expect(loaded?.order.cancelReason).toBe('نفد الصنف');
    // Creation row + one row per accepted move.
    expect(loaded?.events.map((event) => [event.fromStatus, event.toStatus])).toEqual([
      [null, 'pending'],
      ['pending', 'accepted'],
      ['accepted', 'ready'],
      ['ready', 'cancelled']
    ]);
  });

  it('counts hits in one window and resets it after it lapses', async () => {
    const key = rateLimitKey('test', restaurant.id, randomUUID());
    const consume = (limit: number) => consumeRateLimit(key, limit, 1);
    // Window of 1 second: three hits pass a limit of 3, the fourth fails…
    expect(await consume(3)).toBe(true);
    expect(await consume(3)).toBe(true);
    expect(await consume(3)).toBe(true);
    expect(await consume(3)).toBe(false);
    // …and after the window lapses the same limit is available again.
    await new Promise((resolve) => setTimeout(resolve, 1_100));
    expect(await consume(3)).toBe(true);
  });
});
