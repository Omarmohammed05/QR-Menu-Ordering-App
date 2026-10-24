import {and, asc, eq} from 'drizzle-orm';
import {db} from '@/server/db';
import {openingHours} from '@/server/db/schema';

export type NewOpeningSlot = Omit<
  typeof openingHours.$inferInsert,
  'id' | 'restaurantId'
>;

/**
 * Opening-hours repo scoped to one restaurant (ADR-002). The weekly schedule
 * is maintained from the dashboard settings screen; the public menu only
 * evaluates it (`src/lib/opening-hours.ts`).
 */
export function createHoursRepo(restaurantId: string) {
  return {
    /** This restaurant's weekly slots, weekday then open time. */
    list() {
      return db
        .select()
        .from(openingHours)
        .where(eq(openingHours.restaurantId, restaurantId))
        .orderBy(asc(openingHours.weekday), asc(openingHours.opensAt));
    },

    /**
     * Add a slot. The table's unique `(restaurant_id, weekday, opens_at)` and
     * `opens < closes` constraints are the last line of defense — the action
     * validates first and maps the duplicate violation to a friendly error.
     */
    async create(values: NewOpeningSlot) {
      const [row] = await db
        .insert(openingHours)
        .values({...values, restaurantId})
        .returning();
      if (!row) throw new Error('opening-hours insert returned no row');
      return row;
    },

    /** Returns false for a foreign-tenant id. */
    async remove(id: string) {
      const rows = await db
        .delete(openingHours)
        .where(
          and(
            eq(openingHours.id, id),
            eq(openingHours.restaurantId, restaurantId)
          )
        )
        .returning({id: openingHours.id});
      return rows.length > 0;
    }
  };
}

export type HoursRepo = ReturnType<typeof createHoursRepo>;
