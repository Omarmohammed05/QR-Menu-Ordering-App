import {boolean, check, foreignKey, index, integer, pgTable, text, timestamp, unique, uuid} from 'drizzle-orm/pg-core';
import {sql} from 'drizzle-orm';
import {restaurants} from './restaurants';

const tenantId = () =>
  uuid()
    .notNull()
    .references(() => restaurants.id, {onDelete: 'cascade'});

const timestamps = () => ({
  createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
  updatedAt: timestamp({withTimezone: true}).notNull().defaultNow()
});

/**
 * Menu sections (starters, grills, …). `(restaurant_id, id)` unique is the
 * composite FK target for menu items — a category from another tenant can
 * never be referenced (ADR-002).
 */
export const menuCategories = pgTable(
  'menu_categories',
  {
    id: uuid().primaryKey().defaultRandom(),
    restaurantId: tenantId(),
    nameAr: text().notNull(),
    nameEn: text(),
    sortOrder: integer().notNull().default(0),
    isActive: boolean().notNull().default(true),
    ...timestamps()
  },
  (t) => [
    unique('menu_categories_tenant_id_unique').on(t.restaurantId, t.id),
    index('menu_categories_restaurant_idx').on(t.restaurantId)
  ]
);

/**
 * Dishes. `category_id` is referenced as `(restaurant_id, category_id)` so the
 * DB itself refuses a category belonging to another restaurant.
 */
export const menuItems = pgTable(
  'menu_items',
  {
    id: uuid().primaryKey().defaultRandom(),
    restaurantId: tenantId(),
    categoryId: uuid().notNull(),
    nameAr: text().notNull(),
    nameEn: text(),
    descriptionAr: text(),
    descriptionEn: text(),
    /** Integer piastres (1 EGP = 100 piastres) — no floats for money. */
    pricePiastres: integer().notNull(),
    imageUrl: text(),
    isAvailable: boolean().notNull().default(true),
    sortOrder: integer().notNull().default(0),
    ...timestamps()
  },
  (t) => [
    unique('menu_items_tenant_id_unique').on(t.restaurantId, t.id),
    foreignKey({
      name: 'menu_items_category_fk',
      columns: [t.restaurantId, t.categoryId],
      foreignColumns: [menuCategories.restaurantId, menuCategories.id]
    }).onDelete('cascade'),
    index('menu_items_restaurant_idx').on(t.restaurantId),
    check('menu_items_price_check', sql`${t.pricePiastres} >= 0`)
  ]
);

/** Paid extras / sizes on a dish (e.g. "extra cheese +500 piastres"). */
export const menuItemOptions = pgTable(
  'menu_item_options',
  {
    id: uuid().primaryKey().defaultRandom(),
    restaurantId: tenantId(),
    menuItemId: uuid().notNull(),
    nameAr: text().notNull(),
    nameEn: text(),
    /** Signed: a discount option would carry a negative delta. */
    priceDeltaPiastres: integer().notNull().default(0),
    sortOrder: integer().notNull().default(0),
    isActive: boolean().notNull().default(true),
    ...timestamps()
  },
  (t) => [
    unique('menu_item_options_tenant_id_unique').on(t.restaurantId, t.id),
    foreignKey({
      name: 'menu_item_options_item_fk',
      columns: [t.restaurantId, t.menuItemId],
      foreignColumns: [menuItems.restaurantId, menuItems.id]
    }).onDelete('cascade'),
    check('menu_item_options_delta_check', sql`${t.priceDeltaPiastres} >= 0`)
  ]
);
