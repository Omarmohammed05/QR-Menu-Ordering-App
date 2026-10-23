import {check, foreignKey, index, integer, jsonb, pgTable, text, timestamp, unique, uuid} from 'drizzle-orm/pg-core';
import {sql} from 'drizzle-orm';
import {restaurants, restaurantTables} from './restaurants';
import {menuItems} from './menu';
import {orderStatus} from './enums';

const tenantId = () =>
  uuid()
    .notNull()
    .references(() => restaurants.id, {onDelete: 'cascade'});

const timestamps = () => ({
  createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
  updatedAt: timestamp({withTimezone: true}).notNull().defaultNow()
});

/**
 * Snapshot of the option(s) chosen for one order line, frozen at order time so
 * later menu edits never rewrite history.
 */
export type OrderItemOptionSnapshot = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  priceDeltaPiastres: number;
};

/**
 * An order is persisted here first, then the customer continues on WhatsApp.
 * `table_id` is nullable (takeaway); its FK uses the default NO ACTION —
 * composite SET NULL would also null the tenant column (ADR-002), so tables
 * with order history are deactivated, not deleted.
 */
export const orders = pgTable(
  'orders',
  {
    id: uuid().primaryKey().defaultRandom(),
    restaurantId: tenantId(),
    tableId: uuid(),
    status: orderStatus().notNull().default('pending'),
    customerName: text(),
    customerPhone: text(),
    note: text(),
    totalPiastres: integer().notNull(),
    ...timestamps()
  },
  (t) => [
    unique('orders_tenant_id_unique').on(t.restaurantId, t.id),
    foreignKey({
      name: 'orders_table_fk',
      columns: [t.restaurantId, t.tableId],
      foreignColumns: [restaurantTables.restaurantId, restaurantTables.id]
    }),
    index('orders_restaurant_created_idx').on(t.restaurantId, t.createdAt),
    check('orders_total_check', sql`${t.totalPiastres} >= 0`)
  ]
);

/**
 * One line per dish. Composite FKs to both the order and the menu item carry
 * `restaurant_id`, so a line can never mix rows from two tenants. Prices and
 * names are snapshots; `menu_items` uses the default NO ACTION — items with
 * order history are archived (`is_available = false`), not deleted.
 */
export const orderItems = pgTable(
  'order_items',
  {
    id: uuid().primaryKey().defaultRandom(),
    restaurantId: tenantId(),
    orderId: uuid().notNull(),
    menuItemId: uuid().notNull(),
    quantity: integer().notNull(),
    /** Unit price at order time (piastres). */
    unitPricePiastres: integer().notNull(),
    nameSnapshotAr: text().notNull(),
    options: jsonb().$type<OrderItemOptionSnapshot[]>().notNull().default(sql`'[]'::jsonb`),
    lineTotalPiastres: integer().notNull()
  },
  (t) => [
    foreignKey({
      name: 'order_items_order_fk',
      columns: [t.restaurantId, t.orderId],
      foreignColumns: [orders.restaurantId, orders.id]
    }).onDelete('cascade'),
    foreignKey({
      name: 'order_items_item_fk',
      columns: [t.restaurantId, t.menuItemId],
      foreignColumns: [menuItems.restaurantId, menuItems.id]
    }),
    index('order_items_order_idx').on(t.restaurantId, t.orderId),
    check('order_items_qty_check', sql`${t.quantity} > 0`),
    check('order_items_price_check', sql`${t.unitPricePiastres} >= 0`),
    check('order_items_line_total_check', sql`${t.lineTotalPiastres} >= 0`)
  ]
);
