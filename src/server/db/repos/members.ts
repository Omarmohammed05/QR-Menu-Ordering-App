import {and, asc, eq, ne} from 'drizzle-orm';
import {db} from '@/server/db';
import {membershipRole, restaurantMembers, restaurants, users} from '@/server/db/schema';

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
  },

  /**
   * The team page seats existing accounts (sign-up is closed, so there are no
   * invite emails): resolve the typed address to a user row, or null.
   */
  async findUserByEmail(email: string) {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return row ?? null;
  }
};

/** A seat as the team page shows it — the member's account plus their role. */
export type TeamMember = {
  userId: string;
  name: string;
  email: string;
  role: MembershipRole;
  createdAt: Date;
};

/**
 * Team repo scoped to one restaurant (ADR-002): seats of THIS tenant only.
 * Built by the factory; callers never pass the restaurant id.
 */
export function createTeamRepo(restaurantId: string) {
  return {
    /** This restaurant's seats, oldest first — the team page list. */
    list(): Promise<TeamMember[]> {
      return db
        .select({
          userId: restaurantMembers.userId,
          name: users.name,
          email: users.email,
          role: restaurantMembers.role,
          createdAt: restaurantMembers.createdAt
        })
        .from(restaurantMembers)
        .innerJoin(users, eq(users.id, restaurantMembers.userId))
        .where(eq(restaurantMembers.restaurantId, restaurantId))
        .orderBy(asc(restaurantMembers.createdAt));
    },

    /** Owners in this restaurant other than the target member. */
    async countOtherOwners(excludeUserId: string): Promise<number> {
      const rows = await db
        .select({userId: restaurantMembers.userId})
        .from(restaurantMembers)
        .where(
          and(
            eq(restaurantMembers.restaurantId, restaurantId),
            eq(restaurantMembers.role, 'owner'),
            ne(restaurantMembers.userId, excludeUserId)
          )
        );
      return rows.length;
    },

    /** Seat an existing account into this restaurant. */
    async addSeat(userId: string, role: MembershipRole) {
      const [row] = await db
        .insert(restaurantMembers)
        .values({restaurantId, userId, role})
        .returning();
      if (!row) throw new Error('membership insert returned no row');
      return row;
    },

    /** Returns false when the user has no seat in this restaurant. */
    async setRole(userId: string, role: MembershipRole) {
      const rows = await db
        .update(restaurantMembers)
        .set({role})
        .where(
          and(
            eq(restaurantMembers.restaurantId, restaurantId),
            eq(restaurantMembers.userId, userId)
          )
        )
        .returning({id: restaurantMembers.id});
      return rows.length > 0;
    },

    /** Returns false when the user has no seat in this restaurant. */
    async removeSeat(userId: string) {
      const rows = await db
        .delete(restaurantMembers)
        .where(
          and(
            eq(restaurantMembers.restaurantId, restaurantId),
            eq(restaurantMembers.userId, userId)
          )
        )
        .returning({id: restaurantMembers.id});
      return rows.length > 0;
    }
  };
}

export type TeamRepo = ReturnType<typeof createTeamRepo>;
