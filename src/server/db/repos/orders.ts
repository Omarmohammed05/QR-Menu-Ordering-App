import {and, desc, eq} from 'drizzle-orm';
import {db} from '@/server/db';
import {orderItems, orders, type OrderItemOptionSnapshot} from '@/server/db/schema';

export type NewOrderItem = {
  menuItemId: string;
  quantity: number;
  /** Unit price at order time (piastres), snapshotted from the menu item. */
  unitPricePiastres: number;
  nameSnapshotAr: string;
  options: OrderItemOptionSnapshot[];
  lineTotalPiastres: number;
};

export type NewOrder = {
  tableId?: string | null;
  status?: (typeof orders.$inferInsert)['status'];
  customerName?: string;
  customerPhone?: string;
  note?: string;
  totalPiastres: number;
  items: NewOrderItem[];
};

/** Order repo scoped to one restaurant (ADR-002). */
export function createOrdersRepo(restaurantId: string) {
  return {
    /**
     * Persist the order and its lines atomically — always before the customer
     * is handed to WhatsApp. Tenant id is injected, never taken from input.
     */
    async create(values: NewOrder) {
      const {items, ...orderValues} = values;
      return db.transaction(async (tx) => {
        const [order] = await tx
          .insert(orders)
          .values({...orderValues, tableId: values.tableId ?? null, restaurantId})
          .returning();
        if (!order) throw new Error('order insert returned no row');
        const lines = await tx
          .insert(orderItems)
          .values(items.map((item) => ({...item, restaurantId, orderId: order.id})))
          .returning();
        return {order, items: lines};
      });
    },

    /** Fetch by id — returns null when the id belongs to another tenant. */
    async findById(id: string) {
      const [row] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, id), eq(orders.restaurantId, restaurantId)))
        .limit(1);
      return row ?? null;
    },

    /** Most recent orders of this restaurant, newest first. */
    list(limit = 50) {
      return db
        .select()
        .from(orders)
        .where(eq(orders.restaurantId, restaurantId))
        .orderBy(desc(orders.createdAt))
        .limit(limit);
    }
  };
}

export type OrdersRepo = ReturnType<typeof createOrdersRepo>;
