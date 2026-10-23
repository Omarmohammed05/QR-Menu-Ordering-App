import { and, asc, count, eq, max } from "drizzle-orm";
import { db, type DbExecutor } from "@/server/db/client";
import { invitations, menuCategories, menuItems, restaurantMembers, restaurants } from "@/server/db/tenant-tables";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type Invitation = InferSelectModel<typeof invitations>;
export type NewInvitation = InferInsertModel<typeof invitations>;
export type Member = InferSelectModel<typeof restaurantMembers>;
export type MenuCategory = InferSelectModel<typeof menuCategories>;
export type NewMenuCategory = InferInsertModel<typeof menuCategories>;
export type MenuItem = InferSelectModel<typeof menuItems>;
export type NewMenuItem = InferInsertModel<typeof menuItems>;

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

  const categories = {
    list(): Promise<MenuCategory[]> {
      return client
        .select()
        .from(menuCategories)
        .where(eq(menuCategories.restaurantId, restaurantId))
        .orderBy(asc(menuCategories.sortOrder), asc(menuCategories.createdAt));
    },
    findById(id: string): Promise<MenuCategory | null> {
      return client
        .select()
        .from(menuCategories)
        .where(and(eq(menuCategories.restaurantId, restaurantId), eq(menuCategories.id, id)))
        .limit(1)
        .then(([row]) => row ?? null);
    },
    async nextSortOrder(): Promise<number> {
      const [row] = await client
        .select({ maxOrder: max(menuCategories.sortOrder) })
        .from(menuCategories)
        .where(eq(menuCategories.restaurantId, restaurantId));
      return (row?.maxOrder ?? -1) + 1;
    },
    create(values: Omit<NewMenuCategory, "restaurantId">) {
      return client.insert(menuCategories).values({ ...values, restaurantId }).returning();
    },
    update(id: string, values: Partial<Omit<NewMenuCategory, "restaurantId" | "id">>) {
      return client
        .update(menuCategories)
        .set({ ...values, updatedAt: new Date() })
        .where(and(eq(menuCategories.restaurantId, restaurantId), eq(menuCategories.id, id)))
        .returning({ id: menuCategories.id });
    },
    delete(id: string) {
      return client
        .delete(menuCategories)
        .where(and(eq(menuCategories.restaurantId, restaurantId), eq(menuCategories.id, id)))
        .returning({ id: menuCategories.id });
    },
  };

  const itemsApi = {
    list(): Promise<MenuItem[]> {
      return client
        .select()
        .from(menuItems)
        .where(eq(menuItems.restaurantId, restaurantId))
        .orderBy(asc(menuItems.sortOrder), asc(menuItems.createdAt));
    },
    listByCategory(categoryId: string): Promise<MenuItem[]> {
      return client
        .select()
        .from(menuItems)
        .where(and(eq(menuItems.restaurantId, restaurantId), eq(menuItems.categoryId, categoryId)))
        .orderBy(asc(menuItems.sortOrder), asc(menuItems.createdAt));
    },
    findById(id: string): Promise<MenuItem | null> {
      return client
        .select()
        .from(menuItems)
        .where(and(eq(menuItems.restaurantId, restaurantId), eq(menuItems.id, id)))
        .limit(1)
        .then(([row]) => row ?? null);
    },
    async countByCategory(categoryId: string): Promise<number> {
      const [row] = await client
        .select({ total: count() })
        .from(menuItems)
        .where(and(eq(menuItems.restaurantId, restaurantId), eq(menuItems.categoryId, categoryId)));
      return Number(row?.total ?? 0);
    },
    async nextSortOrder(categoryId: string): Promise<number> {
      const [row] = await client
        .select({ maxOrder: max(menuItems.sortOrder) })
        .from(menuItems)
        .where(and(eq(menuItems.restaurantId, restaurantId), eq(menuItems.categoryId, categoryId)));
      return (row?.maxOrder ?? -1) + 1;
    },
    create(values: Omit<NewMenuItem, "restaurantId">) {
      return client.insert(menuItems).values({ ...values, restaurantId }).returning();
    },
    update(id: string, values: Partial<Omit<NewMenuItem, "restaurantId" | "id">>) {
      return client
        .update(menuItems)
        .set({ ...values, updatedAt: new Date() })
        .where(and(eq(menuItems.restaurantId, restaurantId), eq(menuItems.id, id)))
        .returning({ id: menuItems.id });
    },
    delete(id: string) {
      return client
        .delete(menuItems)
        .where(and(eq(menuItems.restaurantId, restaurantId), eq(menuItems.id, id)))
        .returning({ id: menuItems.id });
    },
  };

  const settings = {
    /** Owner-editable restaurant settings, scoped like every other query here. */
    update(values: { whatsappNumber: string | null }) {
      return client
        .update(restaurants)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(restaurants.id, restaurantId))
        .returning({ id: restaurants.id, whatsappNumber: restaurants.whatsappNumber });
    },
  };

  return { restaurantId, members, invitations: invitationsApi, categories, items: itemsApi, settings };
}
