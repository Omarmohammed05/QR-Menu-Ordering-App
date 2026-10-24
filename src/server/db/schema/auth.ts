import {boolean, pgTable, text, timestamp} from 'drizzle-orm/pg-core';

/**
 * Better Auth core tables — canonical shape from its Postgres/Drizzle adapter,
 * using its default singular table names so the Phase 2 auth wiring needs no
 * renames. Land them now so `restaurant_members` can reference `user`.
 *
 * Deviation from the CLI-generated schema: timestamptz instead of plain
 * timestamp (project convention — UTC everywhere). Better Auth reads and
 * writes Date objects either way.
 */
export const users = pgTable('user', {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
  updatedAt: timestamp({withTimezone: true}).notNull().defaultNow()
});

export const sessions = pgTable('session', {
  id: text().primaryKey(),
  userId: text().notNull().references(() => users.id, {onDelete: 'cascade'}),
  token: text().notNull().unique(),
  expiresAt: timestamp({withTimezone: true}).notNull(),
  ipAddress: text(),
  userAgent: text(),
  createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
  updatedAt: timestamp({withTimezone: true}).notNull().defaultNow()
});

export const accounts = pgTable('account', {
  id: text().primaryKey(),
  userId: text().notNull().references(() => users.id, {onDelete: 'cascade'}),
  accountId: text().notNull(),
  providerId: text().notNull(),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp({withTimezone: true}),
  refreshTokenExpiresAt: timestamp({withTimezone: true}),
  scope: text(),
  password: text(),
  createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
  updatedAt: timestamp({withTimezone: true}).notNull().defaultNow()
});

export const verifications = pgTable('verification', {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp({withTimezone: true}).notNull(),
  createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
  updatedAt: timestamp({withTimezone: true}).notNull().defaultNow()
});
