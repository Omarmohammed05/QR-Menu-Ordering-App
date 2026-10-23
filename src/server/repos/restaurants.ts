import { desc, eq } from "drizzle-orm";
import { db, type DbExecutor } from "@/server/db/client";
import { restaurants } from "@/server/db/tenant-tables";
import type { InferInsertModel } from "drizzle-orm";

export type NewRestaurant = InferInsertModel<typeof restaurants>;

// Platform-level restaurant queries (not tenant-scoped). Cross-tenant use is
// restricted to the platform admin and the public slug lookup (spec 3.2).

export async function getRestaurantBySlug(slug: string) {
  const [row] = await db.select().from(restaurants).where(eq(restaurants.slug, slug)).limit(1);
  return row ?? null;
}

export async function getRestaurantById(id: string, client: DbExecutor = db) {
  const [row] = await client.select().from(restaurants).where(eq(restaurants.id, id)).limit(1);
  return row ?? null;
}

export async function listRestaurants() {
  return db.select().from(restaurants).orderBy(desc(restaurants.createdAt));
}

export async function restaurantSlugExists(slug: string) {
  const [row] = await db
    .select({ id: restaurants.id })
    .from(restaurants)
    .where(eq(restaurants.slug, slug))
    .limit(1);
  return row !== undefined;
}

export async function createRestaurant(values: NewRestaurant, client: DbExecutor = db) {
  const [row] = await client.insert(restaurants).values(values).returning();
  return row;
}
