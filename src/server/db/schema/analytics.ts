import {foreignKey, index, pgTable, text, timestamp, uuid} from 'drizzle-orm/pg-core';

import {menuItems} from './menu';
import {restaurants, restaurantTables} from './restaurants';

/**
 * QR-menu telemetry (ADR-002 tenant table). `menu_item_id` is null for a menu
 * page view and set for a dish impression (beaconed once per dish per load);
 * `table_id` attributes the view to the scanned QR table when the URL carried
 * a token. Rows are write-only facts — nothing ever updates them.
 */
export const menuViews = pgTable(
  'menu_views',
  {
    id: uuid().primaryKey().defaultRandom(),
    restaurantId: uuid()
      .notNull()
      .references(() => restaurants.id, {onDelete: 'cascade'}),
    tableId: uuid(),
    menuItemId: uuid(),
    locale: text().notNull().default('ar'),
    viewedAt: timestamp({withTimezone: true}).notNull().defaultNow()
  },
  (t) => [
    foreignKey({
      name: 'menu_views_table_fk',
      columns: [t.restaurantId, t.tableId],
      foreignColumns: [restaurantTables.restaurantId, restaurantTables.id]
    }),
    // Cascade: the dashboard's one hard-delete path (a dish never ordered)
    // takes its telemetry with it; archived dishes keep their history.
    foreignKey({
      name: 'menu_views_item_fk',
      columns: [t.restaurantId, t.menuItemId],
      foreignColumns: [menuItems.restaurantId, menuItems.id]
    }).onDelete('cascade'),
    index('menu_views_restaurant_viewed_idx').on(t.restaurantId, t.viewedAt)
  ]
);
