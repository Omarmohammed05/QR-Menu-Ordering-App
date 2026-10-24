import {integer, pgTable, text, timestamp} from 'drizzle-orm/pg-core';

/**
 * Fixed-window rate-limit counters (spec §11): one row per bucket key (the
 * key is a SHA-256 of the raw inputs, so no IP or identifier is stored in
 * clear text). The window resets lazily on the first hit after it expires.
 */
export const rateLimits = pgTable('rate_limits', {
  key: text().primaryKey(),
  windowStart: timestamp({withTimezone: true}).notNull().defaultNow(),
  count: integer().notNull().default(0)
});
