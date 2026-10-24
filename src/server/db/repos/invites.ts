import {randomInt} from 'node:crypto';
import {and, eq, isNull} from 'drizzle-orm';
import {db} from '@/server/db';
import {restaurantInvites, restaurants} from '@/server/db/schema';

/** Unambiguous alphabet — codes are read out loud and retyped by hand. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * Owner invites — not a scoped tenant repo: the public claim page resolves the
 * tenant BY the secret code (same trust model as a QR table token). Only the
 * platform owner's admin page issues these; sign-up is closed everywhere else.
 */
export const invitesRepo = {
  /**
   * Issues (or renews) the restaurant's single invite with a fresh code —
   * reissuing revokes the previous link/code instantly.
   */
  async issueFor(restaurantId: string) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const [row] = await db
          .insert(restaurantInvites)
          .values({
            restaurantId,
            code: generateInviteCode(),
            claimedByUserId: null,
            claimedAt: null
          })
          .onConflictDoUpdate({
            target: restaurantInvites.restaurantId,
            set: {code: generateInviteCode(), claimedByUserId: null, claimedAt: null}
          })
          .returning();
        if (row) return row;
      } catch (error) {
        // code unique-collision (astronomically rare) — retry with a new code
        if (attempt === 2) throw error;
      }
    }
    throw new Error('invite upsert returned no row');
  },

  /** Unclaimed invite for one restaurant (admin list shows it as a claim link). */
  async findActiveFor(restaurantId: string) {
    const [row] = await db
      .select()
      .from(restaurantInvites)
      .where(
        and(
          eq(restaurantInvites.restaurantId, restaurantId),
          isNull(restaurantInvites.claimedAt)
        )
      )
      .limit(1);
    return row ?? null;
  },

  /** All invite rows (admin screen joins them onto the restaurant list). */
  async listAll() {
    return db.select().from(restaurantInvites);
  },

  /** Unclaimed invite + its restaurant, resolved by the claim code. */
  async findUnclaimedByCode(code: string) {
    const [row] = await db
      .select({invite: restaurantInvites, restaurant: restaurants})
      .from(restaurantInvites)
      .innerJoin(restaurants, eq(restaurants.id, restaurantInvites.restaurantId))
      .where(and(eq(restaurantInvites.code, code), isNull(restaurantInvites.claimedAt)))
      .limit(1);
    return row ?? null;
  },

  /** Marks the invite consumed — one code can ever create one account. */
  async markClaimed(id: string, userId: string) {
    const rows = await db
      .update(restaurantInvites)
      .set({claimedByUserId: userId, claimedAt: new Date()})
      .where(and(eq(restaurantInvites.id, id), isNull(restaurantInvites.claimedAt)))
      .returning({id: restaurantInvites.id});
    return rows.length > 0;
  }
};
