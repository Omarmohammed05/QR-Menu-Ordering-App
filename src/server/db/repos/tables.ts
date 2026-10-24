import {and, asc, eq} from 'drizzle-orm';
import {db} from '@/server/db';
import {restaurantTables, restaurants} from '@/server/db/schema';

export type NewTable = Omit<
  typeof restaurantTables.$inferInsert,
  'id' | 'restaurantId' | 'token' | 'isActive' | 'createdAt'
>;

/** Physical-table repo scoped to one restaurant (ADR-002). */
export function createTablesRepo(restaurantId: string) {
  return {
    /** This restaurant's tables, oldest first; `activeOnly` hides archived. */
    list({activeOnly = false} = {}) {
      const conditions = [eq(restaurantTables.restaurantId, restaurantId)];
      if (activeOnly) conditions.push(eq(restaurantTables.isActive, true));
      return db
        .select()
        .from(restaurantTables)
        .where(and(...conditions))
        .orderBy(asc(restaurantTables.createdAt));
    },

    /** Fetch by id — returns null when the id belongs to another tenant. */
    async findById(id: string) {
      const [row] = await db
        .select()
        .from(restaurantTables)
        .where(and(eq(restaurantTables.id, id), eq(restaurantTables.restaurantId, restaurantId)))
        .limit(1);
      return row ?? null;
    },

    async create(values: NewTable) {
      const [row] = await db
        .insert(restaurantTables)
        .values({...values, restaurantId})
        .returning();
      if (!row) throw new Error('table insert returned no row');
      return row;
    },

    /**
     * Archive/unarchive — tables are never deleted (their orders use NO
     * ACTION FKs, ADR-002). Returns false for a foreign-tenant id.
     */
    async setActive(id: string, isActive: boolean) {
      const rows = await db
        .update(restaurantTables)
        .set({isActive})
        .where(and(eq(restaurantTables.id, id), eq(restaurantTables.restaurantId, restaurantId)))
        .returning({id: restaurantTables.id});
      return rows.length > 0;
    }
  };
}

export type TablesRepo = ReturnType<typeof createTablesRepo>;

/**
 * QR-token lookup — the unscoped tenant-root path (like `restaurantsRepo`):
 * the QR URL carries no slug, so the token itself resolves the tenant. Only
 * active tables match: an archived table's QR must not seat a customer.
 */
export const tablesByToken = {
  async findActive(token: string) {
    const [row] = await db
      .select({table: restaurantTables, restaurant: restaurants})
      .from(restaurantTables)
      .innerJoin(restaurants, eq(restaurants.id, restaurantTables.restaurantId))
      .where(and(eq(restaurantTables.token, token), eq(restaurantTables.isActive, true)))
      .limit(1);
    return row ?? null;
  }
};
