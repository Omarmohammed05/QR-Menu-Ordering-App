import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { restaurantMembers, restaurants } from "@/server/db/tenant-tables";
import type { LocalizedText } from "@/lib/localized-text";
import type { MemberRole } from "@/server/auth/rbac";

export type Membership = {
  restaurantId: string;
  slug: string;
  name: LocalizedText;
  role: MemberRole;
};

/** User-scoped (cross-tenant by nature): used by the dashboard to list access. */
export async function listMembershipsForUser(userId: string): Promise<Membership[]> {
  const rows = await db
    .select({
      restaurantId: restaurantMembers.restaurantId,
      slug: restaurants.slug,
      name: restaurants.name,
      role: restaurantMembers.role,
    })
    .from(restaurantMembers)
    .innerJoin(restaurants, eq(restaurantMembers.restaurantId, restaurants.id))
    .where(eq(restaurantMembers.userId, userId));
  return rows as Membership[];
}
