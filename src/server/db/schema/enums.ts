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
