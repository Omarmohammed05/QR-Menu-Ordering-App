import {and, asc, eq, sql} from 'drizzle-orm';
import {db} from '@/server/db';
import {menuCategories, menuItems} from '@/server/db/schema';

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
    },

    /** Rename a section / set its photo — null when the id belongs to another tenant. */
    async update(id: string, values: Partial<Pick<NewCategory, 'nameAr' | 'imageUrl'>>) {
      const [row] = await db
        .update(menuCategories)
        .set({...values, updatedAt: new Date()})
        .where(and(eq(menuCategories.id, id), eq(menuCategories.restaurantId, restaurantId)))
        .returning();
      return row ?? null;
    },

    /** Dishes sitting in this section — it must be emptied before deletion. */
    async countItems(id: string) {
      const [row] = await db
        .select({count: sql<number>`count(*)::int`})
        .from(menuItems)
        .where(and(eq(menuItems.categoryId, id), eq(menuItems.restaurantId, restaurantId)));
      return row?.count ?? 0;
    },

    /** Delete a section — false when the id belongs to another tenant. */
    async remove(id: string) {
      const rows = await db
        .delete(menuCategories)
        .where(and(eq(menuCategories.id, id), eq(menuCategories.restaurantId, restaurantId)))
        .returning({id: menuCategories.id});
      return rows.length > 0;
    }
  };
}

export type CategoriesRepo = ReturnType<typeof createCategoriesRepo>;
