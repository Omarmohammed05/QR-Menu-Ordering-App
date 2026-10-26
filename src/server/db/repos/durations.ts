import {asc, eq} from 'drizzle-orm';
import {db} from '@/server/db';
import {subscriptionDurations} from '@/server/db/schema';
import {DEFAULT_DURATIONS} from '@/lib/plans';

export type SubscriptionDuration = {id: string; months: number; discountPercent: number};

/**
 * Platform-level billing durations — the owner manages the list on the admin
 * page; the landing pricing applies each row's discount to every plan. Not
 * tenant-scoped (no `restaurant_id`): it configures the whole platform.
 */
export const durationsRepo = {
  /**
   * All durations, shortest first. The table is seeded by migration 0009,
   * but if it runs empty the seeded defaults still render — a broken pricing
   * section is worse than uneditable presets.
   */
  async list(): Promise<SubscriptionDuration[]> {
    const rows = await db
      .select({
        id: subscriptionDurations.id,
        months: subscriptionDurations.months,
        discountPercent: subscriptionDurations.discountPercent
      })
      .from(subscriptionDurations)
      .orderBy(asc(subscriptionDurations.months));
    if (rows.length > 0) return rows;
    return DEFAULT_DURATIONS.map((preset, index) => ({id: `default-${index}`, ...preset}));
  },

  async create(months: number, discountPercent: number): Promise<void> {
    await db.insert(subscriptionDurations).values({months, discountPercent});
  },

  async remove(id: string): Promise<void> {
    await db.delete(subscriptionDurations).where(eq(subscriptionDurations.id, id));
  }
};
