import {asc, eq} from 'drizzle-orm';
import {db} from '@/server/db';
import {membershipRole, restaurantMembers, restaurants} from '@/server/db/schema';

export type MembershipRole = (typeof membershipRole.enumValues)[number];
export type Restaurant = typeof restaurants.$inferSelect;

/** A user's seat in a restaurant tenant: their role plus the tenant root. */
export type Membership = {
  role: MembershipRole;
  restaurant: Restaurant;
};

/**
 * Membership repo — resolves which restaurants the signed-in user can act in.
 * Not built by the ADR-002 factory: queries are keyed by the session's own
 * user id (never caller-supplied input), and membership creation happens in
 * the onboarding action's transaction, right after its restaurant insert.
 */
export const membersRepo = {
  /** All memberships of this user, oldest first — Phase 3 owners have one. */
  listForUser(userId: string): Promise<Membership[]> {
    return db
      .select({role: restaurantMembers.role, restaurant: restaurants})
      .from(restaurantMembers)
      .innerJoin(restaurants, eq(restaurantMembers.restaurantId, restaurants.id))
      .where(eq(restaurantMembers.userId, userId))
      .orderBy(asc(restaurantMembers.createdAt));
  }
};
