import {and, asc, eq} from 'drizzle-orm';
import {db} from '@/server/db';
import {menuCategories} from '@/server/db/schema';

export type NewCategory = Omit<
  typeof menuCategories.$inferInsert,
  'id' | 'restaurantId' | 'createdAt' | 'updatedAt'
>;

/**
 * Category repo scoped to one restaurant. Every method filters on the
 * `restaurantId` captured in the factory — callers never pass a tenant id,
 * so tenant-scoping cannot be forgotten (ADR-002).
 */
export function createCategoriesRepo(restaurantId: string) {
  return {
    /** All categories of this restaurant, in menu order. */
    list() {
      return db
        .select()
        .from(menuCategories)
        .where(eq(menuCategories.restaurantId, restaurantId))
        .orderBy(asc(menuCategories.sortOrder), asc(menuCategories.nameAr));
    },

    /** Fetch by id — returns null when the id belongs to another tenant. */
    async findById(id: string) {
      const [row] = await db
        .select()
        .from(menuCategories)
        .where(and(eq(menuCategories.id, id), eq(menuCategories.restaurantId, restaurantId)))
        .limit(1);
      return row ?? null;
    },

    async create(values: NewCategory) {
      const [row] = await db
        .insert(menuCategories)
        .values({...values, restaurantId})
        .returning();
      if (!row) throw new Error('category insert returned no row');
      return row;
    }
  };
}

export type CategoriesRepo = ReturnType<typeof createCategoriesRepo>;
