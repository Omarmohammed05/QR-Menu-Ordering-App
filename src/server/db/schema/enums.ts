import {pgEnum} from 'drizzle-orm/pg-core';

/** Roles a user can hold inside a restaurant tenant. */
export const membershipRole = pgEnum('membership_role', ['owner', 'manager', 'staff']);

/**
 * How the customer settles the order. `cash` is the default; `instapay`
 * appears on the public checkout only while the restaurant has a handle
 * configured in settings.
 */
export const paymentMethod = pgEnum('payment_method', ['cash', 'instapay']);

/**
 * Order lifecycle. Orders are saved to the DB first, then handed to the
 * customer as a WhatsApp link; these statuses are what the dashboard tracks.
 */
export const orderStatus = pgEnum('order_status', [
  'pending',
  'accepted',
  'ready',
  'completed',
  'cancelled'
]);

/**
 * How an item option group is chosen on the customer sheet (feature: sizes,
 * modifiers & add-ons). `size` and required `modifier` groups render as
 * radio choices; `addon` groups are checkboxes.
 */
export const menuOptionKind = pgEnum('menu_option_kind', ['size', 'modifier', 'addon']);

/**
 * Where the order is consumed. Dine-in comes from a table QR (`?t=`);
 * delivery and takeaway are the customer's toggle on the checkout sheet.
 */
export const orderType = pgEnum('order_type', ['dine_in', 'delivery', 'takeaway']);

/**
 * Subscription plan — the platform owner picks it when creating the
 * restaurant (see src/lib/plans.ts for what each tier gates). Rows that
 * predate plans default to `pro`, so no existing restaurant regresses.
 */
export const restaurantPlan = pgEnum('restaurant_plan', ['basic', 'pro', 'chain']);
