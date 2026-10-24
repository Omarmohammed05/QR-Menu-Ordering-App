import {and, count, desc, eq, gte, inArray, isNull, sql} from 'drizzle-orm';
import {db} from '@/server/db';
import {menuItems, menuViews, orderItems, orders} from '@/server/db/schema';

export type DailyPoint = {day: string; views: number; orders: number};
export type TopDish = {name: string; quantity: number; revenuePiastres: number};

/** `YYYY-MM-DD` for a moment in the restaurant's own timezone (tenant root). */
function localDay(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {timeZone: timezone}).format(date);
}

/**
 * Analytics repo scoped to one restaurant (ADR-002): telemetry writes from
 * the public menu plus the dashboard's read-side series. Every day bucket is
 * cut in the restaurant's timezone — never the server's.
 */
export function createAnalyticsRepo(restaurantId: string) {
  return {
    /** A menu page load. `tableId` comes from the scanned QR token, if any. */
    async recordMenuView({tableId, locale}: {tableId: string | null; locale: string}) {
      await db.insert(menuViews).values({restaurantId, tableId, locale});
    },

    /**
     * Dish impressions (public beacon) — only ids that belong to this tenant
     * land; foreign or unknown ids are silently dropped. Capped defensively.
     */
    async recordItemViews(
      itemIds: string[],
      {tableId, locale}: {tableId: string | null; locale: string}
    ) {
      const ids = [...new Set(itemIds)].slice(0, 50);
      if (ids.length === 0) return;
      const owned = await db
        .select({id: menuItems.id})
        .from(menuItems)
        .where(and(eq(menuItems.restaurantId, restaurantId), inArray(menuItems.id, ids)));
      if (owned.length === 0) return;
      await db
        .insert(menuViews)
        .values(owned.map(({id}) => ({restaurantId, tableId, menuItemId: id, locale})));
    },

    /**
     * Menu views (page loads only — dish impressions are excluded) and order
     * counts per local calendar day, `days` back including today.
     */
    async dailySeries(days: number, timezone: string): Promise<DailyPoint[]> {
      const now = new Date();
      // Cover the whole window in UTC; local-day keys do the exact bucketing.
      const start = new Date(now.getTime() - (days - 1) * 86_400_000);
      start.setUTCHours(0, 0, 0, 0);

      const viewDay = sql<string>`to_char((${menuViews.viewedAt} AT TIME ZONE ${timezone})::date, 'YYYY-MM-DD')`;
      const orderDay = sql<string>`to_char((${orders.createdAt} AT TIME ZONE ${timezone})::date, 'YYYY-MM-DD')`;

      const [viewRows, orderRows] = await Promise.all([
        db
          .select({day: viewDay, views: count()})
          .from(menuViews)
          .where(
            and(
              eq(menuViews.restaurantId, restaurantId),
              isNull(menuViews.menuItemId),
              gte(menuViews.viewedAt, start)
            )
          )
          .groupBy(sql`1`),
        db
          .select({day: orderDay, orders: count()})
          .from(orders)
          .where(and(eq(orders.restaurantId, restaurantId), gte(orders.createdAt, start)))
          .groupBy(sql`1`)
      ]);

      const viewsByDay = new Map(viewRows.map((row) => [row.day, row.views]));
      const ordersByDay = new Map(orderRows.map((row) => [row.day, row.orders]));

      const points: DailyPoint[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const key = localDay(new Date(now.getTime() - i * 86_400_000), timezone);
        points.push({day: key, views: viewsByDay.get(key) ?? 0, orders: ordersByDay.get(key) ?? 0});
      }
      return points;
    },

    /** Best sellers from order lines: quantity sold + revenue, `days` back. */
    async topDishes(days: number, limit: number): Promise<TopDish[]> {
      const start = new Date(Date.now() - days * 86_400_000);
      const quantity = sql<number>`sum(${orderItems.quantity})`.mapWith(Number);
      const revenue = sql<number>`sum(${orderItems.lineTotalPiastres})`.mapWith(Number);
      return db
        .select({name: orderItems.nameSnapshotAr, quantity, revenuePiastres: revenue})
        .from(orderItems)
        .innerJoin(
          orders,
          and(eq(orders.id, orderItems.orderId), eq(orders.restaurantId, orderItems.restaurantId))
        )
        .where(and(eq(orderItems.restaurantId, restaurantId), gte(orders.createdAt, start)))
        .groupBy(orderItems.menuItemId, orderItems.nameSnapshotAr)
        .orderBy(desc(quantity))
        .limit(limit);
    }
  };
}

export type AnalyticsRepo = ReturnType<typeof createAnalyticsRepo>;
