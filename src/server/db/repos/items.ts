import {and, asc, eq} from 'drizzle-orm';
import {db} from '@/server/db';
import {menuItems} from '@/server/db/schema';

export type NewMenuItem = Omit<
  typeof menuItems.$inferInsert,
  'id' | 'restaurantId' | 'createdAt' | 'updatedAt'
>;

/** Menu-item repo scoped to one restaurant (ADR-002). */
export function createItemsRepo(restaurantId: string) {
  return {
    /** Items of this restaurant, optionally narrowed to one category. */
    list(filter?: {categoryId?: string}) {
      const conditions = [eq(menuItems.restaurantId, restaurantId)];
      if (filter?.categoryId) {
        conditions.push(eq(menuItems.categoryId, filter.categoryId));
      }
      return db
        .select()
        .from(menuItems)
        .where(and(...conditions))
        .orderBy(asc(menuItems.sortOrder), asc(menuItems.nameAr));
    },

    /** Fetch by id — returns null when the id belongs to another tenant. */
    async findById(id: string) {
      const [row] = await db
        .select()
        .from(menuItems)
        .where(and(eq(menuItems.id, id), eq(menuItems.restaurantId, restaurantId)))
        .limit(1);
      return row ?? null;
    },

    async create(values: NewMenuItem) {
      const [row] = await db
        .insert(menuItems)
        .values({...values, restaurantId})
        .returning();
      if (!row) throw new Error('menu item insert returned no row');
      return row;
    },

    /**
     * Flip availability — the "sold out today" lever. Returns false when the
     * id belongs to another tenant, so a cross-tenant toggle is a no-op.
     */
    async setAvailable(id: string, isAvailable: boolean) {
      const rows = await db
        .update(menuItems)
        .set({isAvailable, updatedAt: new Date()})
        .where(and(eq(menuItems.id, id), eq(menuItems.restaurantId, restaurantId)))
        .returning({id: menuItems.id});
      return rows.length > 0;
    }
  };
}

export type ItemsRepo = ReturnType<typeof createItemsRepo>;
