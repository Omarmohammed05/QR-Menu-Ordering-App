import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { LocalizedText } from "@/lib/localized-text";

// ─── Better Auth tables (generated via `auth generate`, do not rename) ───
// BEGIN better-auth (pasted from `auth generate` output)
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  superAdmin: boolean("super_admin").default(false).notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const twoFactor = pgTable(
  "two_factor",
  {
    id: text("id").primaryKey(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    verified: boolean("verified").default(true),
    failedVerificationCount: integer("failed_verification_count").default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
  },
  (table) => [index("twoFactor_secret_idx").on(table.secret)],
);
// END better-auth

// ─── Platform enums ───

export const restaurantStatusEnum = pgEnum("restaurant_status", ["active", "suspended"]);
export const restaurantPlanEnum = pgEnum("restaurant_plan", ["free", "pro"]);
export const memberRoleEnum = pgEnum("member_role", ["owner", "manager", "staff"]);

// ─── Tenancy ───

export const restaurants = pgTable(
  "restaurants",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    slug: text("slug").notNull(),
    name: jsonb("name").$type<LocalizedText>().notNull(),
    description: jsonb("description").$type<LocalizedText>(),
    logoUrl: text("logo_url"),
    coverUrl: text("cover_url"),
    whatsappNumber: text("whatsapp_number"),
    phone: text("phone"),
    address: jsonb("address").$type<LocalizedText>(),
    timezone: text("timezone").notNull().default("Africa/Cairo"),
    currency: text("currency").notNull().default("EGP"),
    defaultLocale: text("default_locale").notNull().default("ar"),
    enabledLocales: jsonb("enabled_locales").$type<string[]>().notNull().default(["ar", "en"]),
    status: restaurantStatusEnum("status").notNull().default("active"),
    plan: restaurantPlanEnum("plan").notNull().default("free"),
    subscriptionPricePiastres: integer("subscription_price_piastres").notNull().default(0),
    paidUntil: timestamp("paid_until", { withTimezone: true }),
    orderModes: jsonb("order_modes")
      .$type<{ dineIn: boolean; pickup: boolean; delivery: boolean }>()
      .notNull()
      .default({ dineIn: true, pickup: true, delivery: false }),
    deliveryFeePiastres: integer("delivery_fee_piastres").notNull().default(0),
    minOrderPiastres: integer("min_order_piastres").notNull().default(0),
    acceptingOrders: boolean("accepting_orders").notNull().default(true),
    paymentMethods: jsonb("payment_methods").$type<string[]>().notNull().default(["cash"]),
    openingHours: jsonb("opening_hours"),
    orderCounter: integer("order_counter").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("restaurants_slug_unique").on(table.slug)],
);

export const restaurantMembers = pgTable(
  "restaurant_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("restaurant_members_restaurant_user_unique").on(table.restaurantId, table.userId),
    index("restaurant_members_restaurant_idx").on(table.restaurantId),
  ],
);

export const invitations = pgTable(
  "invitations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    restaurantId: text("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: memberRoleEnum("role").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("invitations_token_hash_unique").on(table.tokenHash),
    index("invitations_restaurant_idx").on(table.restaurantId),
  ],
);

// ─── Rate limiting (Postgres-backed fixed window) ───

export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.key, table.windowStart] })],
);

// ─── Relations (drizzle relational queries; joins stay explicit elsewhere) ───

export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  members: many(restaurantMembers),
}));

export const restaurantMembersRelations = relations(restaurantMembers, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [restaurantMembers.restaurantId],
    references: [restaurants.id],
  }),
}));
