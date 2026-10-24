import {asc, eq} from 'drizzle-orm';
import {db} from '@/server/db';
import {openingHours} from '@/server/db/schema';

/**
 * Opening-hours repo scoped to one restaurant (ADR-002). Read-only for now:
 * the weekly schedule is seeded/edited by owner tooling, and the public menu
 * only evaluates it (`src/lib/opening-hours.ts`).
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
    }
  };
}

export type HoursRepo = ReturnType<typeof createHoursRepo>;
