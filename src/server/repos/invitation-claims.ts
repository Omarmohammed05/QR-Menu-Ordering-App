import { and, eq, isNull } from "drizzle-orm";
import { db, type DbExecutor } from "@/server/db/client";
import { invitations, restaurantMembers, restaurants } from "@/server/db/tenant-tables";

/**
 * Cross-tenant invitation lookups BY CAPABILITY TOKEN (not restaurant-scoped):
 * the unguessable token hash is itself the authorization (analogous to the
 * public slug lookup, spec 3.2). Everything else goes through
 * createRestaurantRepo.
 */

export async function getInvitationContextByTokenHash(tokenHash: string) {
  const [row] = await db
    .select({
      invitationId: invitations.id,
      restaurantId: invitations.restaurantId,
      email: invitations.email,
      role: invitations.role,
      acceptedAt: invitations.acceptedAt,
      expiresAt: invitations.expiresAt,
      restaurantName: restaurants.name,
    })
    .from(invitations)
    .innerJoin(restaurants, eq(invitations.restaurantId, restaurants.id))
    .where(eq(invitations.tokenHash, tokenHash))
    .limit(1);
  return row ?? null;
}

/**
 * Atomically claims an open invitation: locks the row, adds the membership,
 * marks accepted. Throws "INVITATION_CLAIMED" if it was already claimed.
 */
export async function claimInvitationAndAddMember(
  tx: DbExecutor,
  input: { invitationId: string; userId: string },
): Promise<void> {
  const [claim] = await tx
    .select({
      id: invitations.id,
      restaurantId: invitations.restaurantId,
      role: invitations.role,
    })
    .from(invitations)
    .where(and(eq(invitations.id, input.invitationId), isNull(invitations.acceptedAt)))
    .for("update")
    .limit(1);
  if (!claim) {
    throw new Error("INVITATION_CLAIMED");
  }
  await tx
    .insert(restaurantMembers)
    .values({ restaurantId: claim.restaurantId, userId: input.userId, role: claim.role });
  await tx
    .update(invitations)
    .set({ acceptedAt: new Date(), updatedAt: new Date() })
    .where(eq(invitations.id, claim.id));
}
