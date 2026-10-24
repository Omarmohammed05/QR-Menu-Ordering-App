import {boolean, check, pgTable, smallint, text, time, timestamp, unique, uuid} from 'drizzle-orm/pg-core';
import {sql} from 'drizzle-orm';
import {users} from './auth';
import {membershipRole} from './enums';

const tenantId = () =>
  uuid()
    .notNull()
    .references(() => restaurants.id, {onDelete: 'cascade'});

const timestamps = () => ({
  createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
  updatedAt: timestamp({withTimezone: true}).notNull().defaultNow()
});

/**
 * The tenant root. One row per restaurant; every tenant table carries this
 * table's id in `restaurant_id` (ADR-002).
 */
export const restaurants = pgTable('restaurants', {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  /**
   * Slugs this restaurant used before the current one. Old printed QR
   * codes keep resolving (301 to the current slug) forever.
   */
  previousSlugs: text().array().notNull().default(sql`'{}'::text[]`),
  nameAr: text().notNull(),
  nameEn: text(),
  /** Public logo (imgbb URL) shown on the customer menu. */
  logoUrl: text(),
  /** IANA timezone — drives opening-hours evaluation. */
  timezone: text().notNull().default('Africa/Cairo'),
  /** E.164 WhatsApp number orders are handed off to. */
  whatsappNumber: text().notNull(),
  currency: text().notNull().default('EGP'),
  isActive: boolean().notNull().default(true),
  ...timestamps()
});

/** Membership join: which user can act in which restaurant, and with what role. */
export const restaurantMembers = pgTable(
  'restaurant_members',
  {
    id: uuid().primaryKey().defaultRandom(),
    restaurantId: tenantId(),
    userId: text().notNull().references(() => users.id, {onDelete: 'cascade'}),
    role: membershipRole().notNull().default('staff'),
    createdAt: timestamps().createdAt
  },
  (t) => [unique('restaurant_members_restaurant_user_unique').on(t.restaurantId, t.userId)]
);

/**
 * Weekly opening schedule; multiple rows per weekday model split shifts.
 * 0 = Sunday … 6 = Saturday (JS `Date#getDay` convention). Times are wall-clock
 * in the restaurant's IANA timezone.
 */
export const openingHours = pgTable(
  'opening_hours',
  {
    id: uuid().primaryKey().defaultRandom(),
    restaurantId: tenantId(),
    weekday: smallint().notNull(),
    opensAt: time().notNull(),
    closesAt: time().notNull()
  },
  (t) => [
    unique('opening_hours_slot_unique').on(t.restaurantId, t.weekday, t.opensAt),
    check('opening_hours_range_check', sql`${t.opensAt} < ${t.closesAt}`)
  ]
);

/**
 * Physical tables with QR codes. `(restaurant_id, id)` unique is the composite
 * FK target for orders — see ADR-002. Tables are deactivated, never deleted:
 * the orders FK is NO ACTION, and a composite SET NULL would null the tenant
 * column too.
 */
export const restaurantTables = pgTable(
  'restaurant_tables',
  {
    id: uuid().primaryKey().defaultRandom(),
    restaurantId: tenantId(),
    label: text().notNull(),
    /** Opaque token encoded in the QR URL. */
    token: uuid().notNull().defaultRandom().unique(),
    isActive: boolean().notNull().default(true),
    createdAt: timestamps().createdAt
  },
  (t) => [
    unique('restaurant_tables_tenant_id_unique').on(t.restaurantId, t.id),
    unique('restaurant_tables_restaurant_label_unique').on(t.restaurantId, t.label)
  ]
);
