import {and, asc, desc, eq, inArray, sql} from 'drizzle-orm';
import {db} from '@/server/db';
import {orderEvents, orderItems, orders, restaurants, type OrderItemOptionSnapshot} from '@/server/db/schema';

// Re-exported so callers of the repos barrel see the snapshot type too.
export type {OrderItemOptionSnapshot};
import {canTransition, type OrderLifecycleStatus} from '@/lib/order-status';
import {publicOrderId} from '@/lib/ids';

/** Lifecycle statuses the dashboard may move an order to. */
export type OrderStatus = (typeof orders.$inferSelect)['status'];

export type NewOrderItem = {
  menuItemId: string;
  quantity: number;
  /** Unit price at order time, snapshotted from the menu item. */
  unitPricePiastres: number;
  nameSnapshotAr: string;
  options: OrderItemOptionSnapshot[];
  lineTotalPiastres: number;
};

export type NewOrder = {
  tableId?: string | null;
  status?: (typeof orders.$inferInsert)['status'];
  /** Dine-in / delivery / takeaway — dine-in always pairs with a table. */
  orderType?: (typeof orders.$inferInsert)['orderType'];
  /** Delivery orders only: where to bring the food. */
  deliveryAddress?: string | null;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  totalPiastres: number;
  items: NewOrderItem[];
  /** Client-generated — a resubmit with the same key returns the same order. */
  idempotencyKey?: string;
  /** Customer UI locale; drives the status page and WhatsApp message. */
  locale?: string;
  /** Cash by default; `instapay` is only accepted with a configured handle. */
  paymentMethod?: 'cash' | 'instapay';
  /** imgbb screenshot of the InstaPay transfer (when the customer attached one). */
  paymentProofUrl?: string | null;
};

/** A Postgres unique-violation on a named constraint (23505). */
function isUniqueViolation(error: unknown, constraint: string): boolean {
  const cause = (error as {cause?: {code?: string; constraint?: string}}).cause;
  const direct = error as {code?: string; constraint?: string};
  return (
    (cause?.code ?? direct.code) === '23505' &&
    (cause?.constraint ?? direct.constraint) === constraint
  );
}

/** Order repo scoped to one restaurant (ADR-002). */
export function createOrdersRepo(restaurantId: string) {
  return {
    /**
     * Persist the order and its lines atomically — always before the customer
     * is handed to WhatsApp. The sequential number comes from a locked
     * counter bump inside the same transaction, so concurrent orders can
     * never share a number. A resubmit with a known idempotency key returns
     * the original order instead of writing a duplicate.
     */
    async create(values: NewOrder) {
      const existing = values.idempotencyKey
        ? await this.findByIdempotencyKey(values.idempotencyKey)
        : null;
      if (existing) return existing;

      try {
        return await db.transaction(async (tx) => {
          // Bump-and-read serializes concurrent inserts on the tenant row.
          const [counter] = await tx
            .update(restaurants)
            .set({orderCounter: sql`${restaurants.orderCounter} + 1`})
            .where(eq(restaurants.id, restaurantId))
            .returning({number: restaurants.orderCounter});
          const number = counter?.number ?? 1;

          const [order] = await tx
            .insert(orders)
            .values({
              restaurantId,
              tableId: values.tableId ?? null,
              status: values.status,
              orderType: values.orderType ?? (values.tableId ? 'dine_in' : 'takeaway'),
              deliveryAddress: values.deliveryAddress ?? null,
              customerName: values.customerName,
              customerPhone: values.customerPhone,
              note: values.note,
              totalPiastres: values.totalPiastres,
              publicId: publicOrderId(),
              number,
              idempotencyKey: values.idempotencyKey ?? publicOrderId(),
              locale: values.locale,
              paymentMethod: values.paymentMethod ?? 'cash',
              paymentProofUrl: values.paymentProofUrl ?? null
            })
            .returning();
          if (!order) throw new Error('order insert returned no row');

          const lines = await tx
            .insert(orderItems)
            .values(values.items.map((item) => ({...item, restaurantId, orderId: order.id})))
            .returning();

          await tx
            .insert(orderEvents)
            .values({restaurantId, orderId: order.id, fromStatus: null, toStatus: order.status});

          return {order, items: lines};
        });
      } catch (error) {
        // The pre-check raced a concurrent duplicate: return that order.
        if (isUniqueViolation(error, 'orders_tenant_idempotency_unique')) {
          const raced = values.idempotencyKey
            ? await this.findByIdempotencyKey(values.idempotencyKey)
            : null;
          if (raced) return raced;
        }
        throw error;
      }
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

    /** Idempotency lookup — the order with its snapshotted lines, or null. */
    async findByIdempotencyKey(key: string): Promise<OrderWithItems | null> {
      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.restaurantId, restaurantId), eq(orders.idempotencyKey, key)))
        .limit(1);
      if (!order) return null;
      const items = await db
        .select()
        .from(orderItems)
        .where(and(eq(orderItems.restaurantId, restaurantId), eq(orderItems.orderId, order.id)))
        .orderBy(asc(orderItems.nameSnapshotAr));
      return {order, items};
    },

    /** Bare status lookup for the public poll endpoint — no lines, no events. */
    async findByPublicIdLite(publicId: string) {
      const [row] = await db
        .select({status: orders.status, statusUpdatedAt: orders.statusUpdatedAt})
        .from(orders)
        .where(and(eq(orders.restaurantId, restaurantId), eq(orders.publicId, publicId)))
        .limit(1);
      return row ?? null;
    },

    /** Public status-page lookup — the order, its lines and its event trail. */
    async findWithItemsByPublicId(publicId: string): Promise<OrderWithEvents | null> {
      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.restaurantId, restaurantId), eq(orders.publicId, publicId)))
        .limit(1);
      if (!order) return null;
      const [items, events] = await Promise.all([
        db
          .select()
          .from(orderItems)
          .where(and(eq(orderItems.restaurantId, restaurantId), eq(orderItems.orderId, order.id)))
          .orderBy(asc(orderItems.nameSnapshotAr)),
        db
          .select()
          .from(orderEvents)
          .where(and(eq(orderEvents.restaurantId, restaurantId), eq(orderEvents.orderId, order.id)))
          .orderBy(asc(orderEvents.createdAt))
      ]);
      return {order, items, events};
    },

    /** Most recent orders of this restaurant, newest first. */
    list(limit = 50) {
      return db
        .select()
        .from(orders)
        .where(eq(orders.restaurantId, restaurantId))
        .orderBy(desc(orders.createdAt))
        .limit(limit);
    },

    /** Orders with their lines joined in — the dashboard board view. */
    async listWithItems(limit = 50): Promise<OrderWithItems[]> {
      const recent = await this.list(limit);
      if (recent.length === 0) return [];
      const lines = await db
        .select()
        .from(orderItems)
        .where(
          and(
            eq(orderItems.restaurantId, restaurantId),
            inArray(
              orderItems.orderId,
              recent.map((o) => o.id)
            )
          )
        )
        .orderBy(asc(orderItems.nameSnapshotAr));
      return recent.map((order) => ({
        order,
        items: lines.filter((line) => line.orderId === order.id)
      }));
    },

    /**
     * Move an order along its lifecycle. Illegal transitions are rejected
     * (spec §6); every accepted move writes an `order_events` audit row. A
     * foreign-tenant (or unknown) id is a no-op returning `missing` (ADR-002).
     */
    async setStatus(id: string, status: OrderStatus, cancelReason?: string) {
      const current = await this.findById(id);
      if (!current) return {ok: false as const, reason: 'missing' as const};
      if (!canTransition(current.status as OrderLifecycleStatus, status as OrderLifecycleStatus)) {
        return {ok: false as const, reason: 'illegal' as const};
      }
      await db.transaction(async (tx) => {
        await tx
          .update(orders)
          .set({
            status,
            cancelReason: status === 'cancelled' ? (cancelReason ?? null) : current.cancelReason,
            statusUpdatedAt: new Date(),
            updatedAt: new Date()
          })
          .where(and(eq(orders.id, id), eq(orders.restaurantId, restaurantId)));
        await tx
          .insert(orderEvents)
          .values({
            restaurantId,
            orderId: id,
            fromStatus: current.status,
            toStatus: status
          });
      });
      return {ok: true as const};
    }
  };
}

/** One dashboard order card: the order header plus its snapshotted lines. */
export type OrderWithItems = {
  order: typeof orders.$inferSelect;
  items: (typeof orderItems.$inferSelect)[];
};

/** The status page payload: order + lines + the lifecycle audit trail. */
export type OrderWithEvents = OrderWithItems & {
  events: (typeof orderEvents.$inferSelect)[];
};

export type OrdersRepo = ReturnType<typeof createOrdersRepo>;
