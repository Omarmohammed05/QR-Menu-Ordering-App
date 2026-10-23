import {eq} from 'drizzle-orm';
import {db} from '@/server/db';
import {restaurants} from '@/server/db/schema';

export type NewRestaurant = Omit<
  typeof restaurants.$inferInsert,
  'id' | 'isActive' | 'createdAt' | 'updatedAt'
>;

/**
 * Tenant-root repo — the only repo not scoped by `restaurantId`, because it
 * resolves the tenant (by slug or id) that the scoped repos are then built for.
 */
export const restaurantsRepo = {
  async findBySlug(slug: string) {
    const [row] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, slug))
      .limit(1);
    return row ?? null;
  },

  async findById(id: string) {
    const [row] = await db.select().from(restaurants).where(eq(restaurants.id, id)).limit(1);
    return row ?? null;
  },

  async create(values: NewRestaurant) {
    const [row] = await db.insert(restaurants).values(values).returning();
    if (!row) throw new Error('restaurant insert returned no row');
    return row;
  }
};
