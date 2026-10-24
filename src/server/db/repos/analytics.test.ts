import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {migrate} from 'drizzle-orm/postgres-js/migrator';
import {and, eq} from 'drizzle-orm';
import {db, client} from '@/server/db';
import {menuViews, restaurants, type restaurants as restaurantRows} from '@/server/db/schema';
import {
  createRestaurantRepos,
  restaurantsRepo,
  type RestaurantRepos
} from '@/server/db/repos';

/**
 * Analytics repo integration coverage: telemetry writes are tenant-scoped
 * (foreign dish ids never land), day bucketing follows the restaurant's
 * timezone, page views and dish impressions are counted separately, best
 * sellers aggregate from real order lines, and hard-deleting a dish takes
 * its impressions with it (cascade). Applies the committed `drizzle/`
 * migrations itself, like the orders suite.
 */
describe('analytics repo (integration)', () => {
  const slug = `ana-${randomUUID().slice(0, 8)}`;
  const otherSlug = `ana-b-${randomUUID().slice(0, 8)}`;

  let restaurant: typeof restaurantRows.$inferSelect;
  let repos: RestaurantRepos;
  let otherRepos: RestaurantRepos;
  let itemId: string;
  let otherItemId: string;

  beforeAll(async () => {
    await migrate(db, {migrationsFolder: fileURLToPath(new URL('../../../../drizzle', import.meta.url))});

    restaurant = await restaurantsRepo.create({
      slug,
      nameAr: 'مطعم التحليلات',
      whatsappNumber: '+20 100 555 0199'
    });
    repos = createRestaurantRepos(restaurant.id);
    const category = await repos.categories.create({nameAr: 'قسم', sortOrder: 0});
    const item = await repos.items.create({categoryId: category.id, nameAr: 'طبق', pricePiastres: 5000});
    itemId = item.id;

    const other = await restaurantsRepo.create({
      slug: otherSlug,
      nameAr: 'مطعم آخر',
      whatsappNumber: '+20 100 555 0188'
    });
    otherRepos = createRestaurantRepos(other.id);
    const otherCategory = await otherRepos.categories.create({nameAr: 'قسم آخر', sortOrder: 0});
    const otherItem = await otherRepos.items.create({
      categoryId: otherCategory.id,
      nameAr: 'طبق آخر',
      pricePiastres: 1000
    });
    otherItemId = otherItem.id;
  }, 60_000);

  afterAll(async () => {
    await db.delete(restaurants).where(eq(restaurants.slug, slug));
    await db.delete(restaurants).where(eq(restaurants.slug, otherSlug));
    await client.end();
  });

  it('records menu views and counts them separately from dish impressions', async () => {
    const tz = restaurant.timezone;
    await repos.analytics.recordMenuView({tableId: null, locale: 'ar'});
    await repos.analytics.recordItemViews([itemId, itemId], {tableId: null, locale: 'ar'});

    const series = await repos.analytics.dailySeries(14, tz);
    const today = series.at(-1);
    expect(today?.views).toBe(1); // the page load — impressions never inflate it
    expect(series).toHaveLength(14);

    // Impressions landed as their own rows, scoped to this tenant.
    const impressions = await db
      .select({id: menuViews.id})
      .from(menuViews)
      .where(and(eq(menuViews.restaurantId, restaurant.id), eq(menuViews.menuItemId, itemId)));
    expect(impressions).toHaveLength(1);
  });

  it('never writes impressions for a foreign tenant dish', async () => {
    await repos.analytics.recordItemViews([otherItemId, randomUUID()], {tableId: null, locale: 'ar'});
    const foreign = await db
      .select({id: menuViews.id})
      .from(menuViews)
      .where(and(eq(menuViews.restaurantId, restaurant.id), eq(menuViews.menuItemId, otherItemId)));
    expect(foreign).toHaveLength(0);
  });

  it('aggregates best sellers from order lines', async () => {
    await repos.orders.create({
      totalPiastres: 10_000,
      items: [
        {
          menuItemId: itemId,
          quantity: 2,
          unitPricePiastres: 5000,
          nameSnapshotAr: 'طبق',
          options: [],
          lineTotalPiastres: 10_000
        }
      ]
    });

    const today = (await repos.analytics.dailySeries(14, restaurant.timezone)).at(-1);
    expect(today?.orders).toBeGreaterThanOrEqual(1);

    const top = await repos.analytics.topDishes(30, 5);
    expect(top.at(0)).toMatchObject({name: 'طبق', quantity: 2, revenuePiastres: 10_000});
    // The other tenant's board sees nothing.
    const otherTop = await otherRepos.analytics.topDishes(30, 5);
    expect(otherTop).toHaveLength(0);
  });

  it('drops a dish impressions when the dish is hard-deleted', async () => {
    const category = await repos.categories.create({nameAr: 'قسم مؤقت', sortOrder: 1});
    const temp = await repos.items.create({
      categoryId: category.id,
      nameAr: 'طبق مؤقت',
      pricePiastres: 1000
    });
    await repos.analytics.recordItemViews([temp.id], {tableId: null, locale: 'ar'});
    await repos.items.remove(temp.id);
    const remaining = await db
      .select({id: menuViews.id})
      .from(menuViews)
      .where(and(eq(menuViews.restaurantId, restaurant.id), eq(menuViews.menuItemId, temp.id)));
    expect(remaining).toHaveLength(0);
  });
});
