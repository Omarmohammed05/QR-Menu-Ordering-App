import {and, asc, eq} from 'drizzle-orm';
import {db} from '@/server/db';
import {restaurantAddresses} from '@/server/db/schema';

export type NewAddress = Omit<
  typeof restaurantAddresses.$inferInsert,
  'id' | 'restaurantId' | 'createdAt'
>;

/** Branch-address repo scoped to one restaurant (ADR-002). */
export function createAddressesRepo(restaurantId: string) {
  return {
    /** This restaurant's branches, oldest first. */
    list() {
      return db
        .select()
        .from(restaurantAddresses)
        .where(eq(restaurantAddresses.restaurantId, restaurantId))
        .orderBy(asc(restaurantAddresses.createdAt));
    },

    /** Fetch by id — returns null when the id belongs to another tenant. */
    async findById(id: string) {
      const [row] = await db
        .select()
        .from(restaurantAddresses)
        .where(
          and(
            eq(restaurantAddresses.id, id),
            eq(restaurantAddresses.restaurantId, restaurantId)
          )
        )
        .limit(1);
      return row ?? null;
    },

    async create(values: NewAddress) {
      const [row] = await db
        .insert(restaurantAddresses)
        .values({...values, restaurantId})
        .returning();
      if (!row) throw new Error('address insert returned no row');
      return row;
    },

    /** Returns false for a foreign-tenant id. */
    async update(id: string, values: Partial<NewAddress>) {
      const rows = await db
        .update(restaurantAddresses)
        .set(values)
        .where(
          and(
            eq(restaurantAddresses.id, id),
            eq(restaurantAddresses.restaurantId, restaurantId)
          )
        )
        .returning({id: restaurantAddresses.id});
      return rows.length > 0;
    },

    async remove(id: string) {
      const rows = await db
        .delete(restaurantAddresses)
        .where(
          and(
            eq(restaurantAddresses.id, id),
            eq(restaurantAddresses.restaurantId, restaurantId)
          )
        )
        .returning({id: restaurantAddresses.id});
      return rows.length > 0;
    }
  };
}

export type AddressesRepo = ReturnType<typeof createAddressesRepo>;
