import { and, eq } from "drizzle-orm";
import { db, type DbExecutor } from "@/server/db/client";
import { invitations, restaurantMembers } from "@/server/db/tenant-tables";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type Invitation = InferSelectModel<typeof invitations>;
export type NewInvitation = InferInsertModel<typeof invitations>;
export type Member = InferSelectModel<typeof restaurantMembers>;

/**
 * Scoped repo factory (spec 3.2): every method already applies
 * restaurant_id = <restaurantId>. Tenant queries are ONLY allowed here.
 */
export function createRestaurantRepo(restaurantId: string, client: DbExecutor = db) {
  const members = {
    list(): Promise<Member[]> {
      return client
        .select()
        .from(restaurantMembers)
        .where(eq(restaurantMembers.restaurantId, restaurantId));
    },
    getByUserId(userId: string): Promise<Member | null> {
      return client
        .select()
        .from(restaurantMembers)
        .where(
          and(
            eq(restaurantMembers.restaurantId, restaurantId),
            eq(restaurantMembers.userId, userId),
          ),
        )
        .limit(1)
        .then(([row]) => row ?? null);
    },
    add(userId: string, role: Member["role"]) {
      return client.insert(restaurantMembers).values({ restaurantId, userId, role }).returning();
    },
    remove(userId: string) {
      return client
        .delete(restaurantMembers)
        .where(
          and(
            eq(restaurantMembers.restaurantId, restaurantId),
            eq(restaurantMembers.userId, userId),
          ),
        )
        .returning({ id: restaurantMembers.id });
    },
  };

  const invitationsApi = {
    list(): Promise<Invitation[]> {
      return client.select().from(invitations).where(eq(invitations.restaurantId, restaurantId));
    },
    create(values: Omit<NewInvitation, "restaurantId">) {
      return client
        .insert(invitations)
        .values({ ...values, restaurantId })
        .returning();
    },
    findById(id: string): Promise<Invitation | null> {
      return client
        .select()
        .from(invitations)
        .where(and(eq(invitations.restaurantId, restaurantId), eq(invitations.id, id)))
        .limit(1)
        .then(([row]) => row ?? null);
    },
    markAccepted(id: string) {
      return client
        .update(invitations)
        .set({ acceptedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(invitations.restaurantId, restaurantId), eq(invitations.id, id)))
        .returning({ id: invitations.id });
    },
    delete(id: string) {
      return client
        .delete(invitations)
        .where(and(eq(invitations.restaurantId, restaurantId), eq(invitations.id, id)))
        .returning({ id: invitations.id });
    },
  };

  return { restaurantId, members, invitations: invitationsApi };
}
