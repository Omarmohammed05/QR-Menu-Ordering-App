import {check, integer, pgTable, smallint, timestamp, uuid} from 'drizzle-orm/pg-core';
import {sql} from 'drizzle-orm';

/**
 * Platform-wide subscription billing durations (1/3/6/12 months seeded —
 * custom ones the owner adds from the admin page). Each carries a discount
 * applied to every plan's total price on the landing page. Deliberately NOT
 * a tenant table: it configures the platform, not one restaurant.
 */
export const subscriptionDurations = pgTable(
  'subscription_durations',
  {
    id: uuid().primaryKey().defaultRandom(),
    /** Billing length in months — unique, so one row per length. */
    months: integer().notNull().unique(),
    /** Percent off the plan's total price for this duration. */
    discountPercent: smallint().notNull().default(0),
    createdAt: timestamp({withTimezone: true}).notNull().defaultNow()
  },
  (t) => [
    check('subscription_durations_months_check', sql`${t.months} between 1 and 60`),
    check('subscription_durations_discount_check', sql`${t.discountPercent} between 0 and 90`)
  ]
);
