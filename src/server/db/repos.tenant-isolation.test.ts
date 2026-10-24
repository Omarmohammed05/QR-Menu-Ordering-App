import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {migrate} from 'drizzle-orm/postgres-js/migrator';
import {inArray} from 'drizzle-orm';
import {db, client} from '@/server/db';
import {
  menuItems,
  orderItems,
  orders,
  restaurantTables,
  restaurants
} from '@/server/db/schema';
import {createRestaurantRepos, restaurantsRepo, tablesByToken} from '@/server/db/repos';

/**
 * Tenancy-isolation integration tests (ADR-002).
 *
 * Runs against the Postgres pointed to by DATABASE_URL (compose `db` in dev,
 * the CI service container) and applies the committed `drizzle/` migrations
 * itself. All fixtures use random slugs and are removed in `afterAll`.
 */

/** Asserts a write fails with Postgres `foreign_key_violation` (23503). */
async function expectForeignKeyViolation(query: Promise<unknown>) {
  const err = (await query.then(
    () => {
      throw new Error('expected the write to be rejected, but it succeeded');
    },
    (error: unknown) => error
  )) as {cause?: {code?: string}; code?: string};
  // Drizzle wraps query errors (DrizzleQueryError); the Postgres code sits on
  // `.cause`. Fall back to the top level for unwrapped postgres-js errors.
  expect(err.cause?.code ?? err.code).toBe('23503');
}

describe('tenant isolation (integration)', () => {
  const suffix = randomUUID().slice(0, 8);
  const slugA = `iso-a-${suffix}`;
  const slugB = `iso-b-${suffix}`;

  let restaurantA: typeof restaurants.$inferSelect;
  let restaurantB: typeof restaurants.$inferSelect;
  let categoryA: Awaited<ReturnType<ReturnType<typeof createRestaurantRepos>['categories']['create']>>;
  let itemA: Awaited<ReturnType<ReturnType<typeof createRestaurantRepos>['items']['create']>>;
  let tableA: typeof restaurantTables.$inferSelect;
  let orderA: Awaited<ReturnType<ReturnType<typeof createRestaurantRepos>['orders']['create']>>['order'];
  let reposA: ReturnType<typeof createRestaurantRepos>;
  let reposB: ReturnType<typeof createRestaurantRepos>;

  beforeAll(async () => {
    await migrate(db, {migrationsFolder: fileURLToPath(new URL('../../../drizzle', import.meta.url))});

    restaurantA = await restaurantsRepo.create({
      slug: slugA,
      nameAr: 'مطعم أ',
      whatsappNumber: '+201000000001'
    });
    restaurantB = await restaurantsRepo.create({
      slug: slugB,
      nameAr: 'مطعم ب',
      whatsappNumber: '+201000000002'
    });
    reposA = createRestaurantRepos(restaurantA.id);
    reposB = createRestaurantRepos(restaurantB.id);

    categoryA = await reposA.categories.create({nameAr: 'المشويات', sortOrder: 0});
    await reposB.categories.create({nameAr: 'مقبلات'});
    itemA = await reposA.items.create({
      categoryId: categoryA.id,
      nameAr: 'كفتة',
      pricePiastres: 8500
    });
    const [tableRow] = await db
      .insert(restaurantTables)
      .values({restaurantId: restaurantA.id, label: 'طاولة ١'})
      .returning();
    if (!tableRow) throw new Error('table fixture insert returned no row');
    tableA = tableRow;
    const placed = await reposA.orders.create({
      tableId: tableA.id,
      totalPiastres: 17000,
      items: [
        {
          menuItemId: itemA.id,
          quantity: 2,
          unitPricePiastres: 8500,
          nameSnapshotAr: 'كفتة',
          options: [],
          lineTotalPiastres: 17000
        }
      ]
    });
    orderA = placed.order;
  }, 60_000);

  afterAll(async () => {
    await db.delete(restaurants).where(inArray(restaurants.slug, [slugA, slugB]));
    await client.end();
  });

  it('stamps the tenant id from the factory, never from caller input', async () => {
    const created = await reposB.items.create({
      categoryId: (await reposB.categories.list())[0]!.id,
      nameAr: 'حمص',
      pricePiastres: 3000
    });
    expect(created.restaurantId).toBe(restaurantB.id);
  });

  it('keeps tenant A’s rows invisible to tenant B', async () => {
    const bCategories = await reposB.categories.list();
    expect(bCategories.map((c) => c.id)).not.toContain(categoryA.id);
    expect(await reposB.categories.findById(categoryA.id)).toBeNull();
    expect(await reposB.items.findById(itemA.id)).toBeNull();
    expect(await reposB.orders.list()).toHaveLength(0);
    expect(await reposB.orders.findById(orderA.id)).toBeNull();
  });

  it('serves tenant A its own rows', async () => {
    expect((await reposA.categories.list()).map((c) => c.nameAr)).toContain('المشويات');
    expect(await reposA.items.findById(itemA.id)).not.toBeNull();
    expect(await reposA.orders.findById(orderA.id)).not.toBeNull();
    expect(await reposA.orders.list()).toHaveLength(1);
  });

  it('rejects an order line referencing another tenant’s order or item (composite FK)', async () => {
    await expectForeignKeyViolation(
      db.insert(orderItems).values({
        restaurantId: restaurantB.id,
        orderId: orderA.id,
        menuItemId: itemA.id,
        quantity: 1,
        unitPricePiastres: 8500,
        nameSnapshotAr: 'x',
        options: [],
        lineTotalPiastres: 8500
      })
    );
  });

  it('rejects an order referencing another tenant’s table (composite FK)', async () => {
    await expectForeignKeyViolation(
      db.insert(orders).values({
        restaurantId: restaurantB.id,
        tableId: tableA.id,
        totalPiastres: 100
      })
    );
  });

  it('rejects an item referencing another tenant’s category (composite FK)', async () => {
    await expectForeignKeyViolation(
      db.insert(menuItems).values({
        restaurantId: restaurantB.id,
        categoryId: categoryA.id,
        nameAr: 'x',
        pricePiastres: 100
      })
    );
  });

  it('makes a cross-tenant availability toggle a no-op', async () => {
    expect(await reposB.items.setAvailable(itemA.id, false)).toBe(false);
    expect((await reposA.items.findById(itemA.id))?.isAvailable).toBe(true);
    expect(await reposA.items.setAvailable(itemA.id, false)).toBe(true);
    expect((await reposA.items.findById(itemA.id))?.isAvailable).toBe(false);
    await reposA.items.setAvailable(itemA.id, true);
  });

  it('keeps tenant A’s tables and order lines invisible to tenant B', async () => {
    expect(await reposB.tables.findById(tableA.id)).toBeNull();
    expect((await reposB.tables.list()).map((t) => t.id)).not.toContain(tableA.id);
    expect(await reposB.orders.listWithItems()).toHaveLength(0);
    const aBoard = await reposA.orders.listWithItems();
    expect(aBoard).toHaveLength(1);
    expect(aBoard[0]?.items.map((line) => line.nameSnapshotAr)).toContain('كفتة');
  });

  it('makes a cross-tenant order status update a no-op', async () => {
    expect(await reposB.orders.setStatus(orderA.id, 'cancelled')).toEqual({ok: false, reason: 'missing'});
    expect((await reposA.orders.findById(orderA.id))?.status).toBe('pending');
    expect(await reposA.orders.setStatus(orderA.id, 'accepted')).toEqual({ok: true});
    expect((await reposA.orders.findById(orderA.id))?.status).toBe('accepted');
    // The lifecycle machine has no `accepted → pending` move; reset via the
    // legal happy-path walk so later assertions still see a live order.
    expect(await reposA.orders.setStatus(orderA.id, 'ready')).toEqual({ok: true});
    expect(await reposA.orders.setStatus(orderA.id, 'completed')).toEqual({ok: true});
  });

  it('resolves QR tokens to active tables only, and honors the archive switch', async () => {
    const resolved = await tablesByToken.findActive(tableA.token);
    expect(resolved?.restaurant.id).toBe(restaurantA.id);
    expect(resolved?.table.id).toBe(tableA.id);

    expect(await reposA.tables.setActive(tableA.id, false)).toBe(true);
    expect(await tablesByToken.findActive(tableA.token)).toBeNull();
    // An archived table must stay invisible to tenant B’s repo as well.
    expect(await reposB.tables.setActive(tableA.id, true)).toBe(false);
    expect(await reposA.tables.setActive(tableA.id, true)).toBe(true);
  });

  it('makes a cross-tenant item update and delete a no-op', async () => {
    expect(await reposB.items.update(itemA.id, {nameAr: 'معدّل'})).toBeNull();
    expect((await reposA.items.findById(itemA.id))?.nameAr).toBe('كفتة');
    expect(await reposB.items.remove(itemA.id)).toBe(false);
    expect(await reposA.items.findById(itemA.id)).not.toBeNull();
    // Own-tenant update applies.
    expect((await reposA.items.update(itemA.id, {nameAr: 'كفتة مشوية'}))?.nameAr).toBe(
      'كفتة مشوية'
    );
    await reposA.items.update(itemA.id, {nameAr: 'كفتة'});
  });

  it('blocks deleting a dish with order history; a history-free dish deletes', async () => {
    expect(await reposA.items.hasOrderHistory(itemA.id)).toBe(true);
    const free = await reposA.items.create({
      categoryId: categoryA.id,
      nameAr: 'سلطة',
      pricePiastres: 3000
    });
    expect(await reposA.items.hasOrderHistory(free.id)).toBe(false);
    expect(await reposA.items.remove(free.id)).toBe(true);
    expect(await reposA.items.findById(free.id)).toBeNull();
  });

  it('keeps dish options tenant-scoped: visible to A only, cross-tenant delete a no-op', async () => {
    const option = await reposA.options.create({
      menuItemId: itemA.id,
      nameAr: 'طحينة إضافية',
      priceDeltaPiastres: 500
    });
    expect((await reposA.options.listByItem(itemA.id)).map((o) => o.id)).toContain(option.id);
    // Tenant B sees nothing of A's options on the same dish id.
    expect(await reposB.options.listByItem(itemA.id)).toHaveLength(0);
    expect(await reposB.options.listActiveByItem(itemA.id)).toHaveLength(0);
    // A cross-tenant delete is a silent no-op.
    expect(await reposB.options.remove(option.id)).toBe(false);
    expect((await reposA.options.listByItem(itemA.id)).map((o) => o.id)).toContain(option.id);
    // Own-tenant delete applies.
    expect(await reposA.options.remove(option.id)).toBe(true);
    expect((await reposA.options.listByItem(itemA.id)).map((o) => o.id)).not.toContain(option.id);
  });

  it('makes a cross-tenant category update and delete a no-op', async () => {
    expect(await reposB.categories.update(categoryA.id, {nameAr: 'معدّل'})).toBeNull();
    expect((await reposA.categories.findById(categoryA.id))?.nameAr).toBe('المشويات');
    expect(await reposB.categories.remove(categoryA.id)).toBe(false);
    expect(await reposA.categories.findById(categoryA.id)).not.toBeNull();

    // An occupied section reports its dish count (the delete guard).
    expect(await reposA.categories.countItems(categoryA.id)).toBeGreaterThan(0);
    // An empty section deletes for its own tenant only.
    const emptyA = await reposA.categories.create({nameAr: 'حلويات', sortOrder: 9});
    expect(await reposA.categories.remove(emptyA.id)).toBe(true);
    expect(await reposA.categories.findById(emptyA.id)).toBeNull();
  });
});
