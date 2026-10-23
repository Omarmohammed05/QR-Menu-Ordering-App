import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { like, sql } from "drizzle-orm";
import { db, pool } from "@/server/db/client";
import {
  createRestaurant,
  getRestaurantBySlug,
  restaurantSlugExists,
} from "@/server/repos/restaurants";
import { createRestaurantRepo } from "@/server/repos/create-restaurant-repo";
import { user } from "@/server/db/schema";

const SUFFIX = `iso-${Date.now().toString(36)}`;

async function seedUser(email: string) {
  const [row] = await db
    .insert(user)
    .values({
      id: `u_${SUFFIX}_${email}`,
      name: email,
      email: `${email}@${SUFFIX}.test`,
      emailVerified: true,
    })
    .returning();
  return row;
}

async function seedRestaurant(key: string) {
  return createRestaurant({
    slug: `${SUFFIX}-${key}`,
    name: { ar: `مطعم ${key}` },
  });
}

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "src/server/db/migrations" });
});

afterAll(async () => {
  // Tenant rows are created fresh each run; cascade deletes clean members/invites.
  await db.delete(user).where(like(user.id, `u_${SUFFIX}%`));
  await db.execute(sql`DELETE FROM restaurants WHERE slug LIKE ${`${SUFFIX}%`}`);
  await pool.end();
});

describe("tenant isolation (two-restaurant assertions, spec 3.2)", () => {
  it("members are scoped to the restaurant", async () => {
    const restaurantA = await seedRestaurant("a");
    const restaurantB = await seedRestaurant("b");
    const userA = await seedUser("alice");
    const userB = await seedUser("bob");

    const repoA = createRestaurantRepo(restaurantA.id);
    const repoB = createRestaurantRepo(restaurantB.id);

    await repoA.members.add(userA.id, "owner");
    await repoB.members.add(userB.id, "owner");

    const membersA = await repoA.members.list();
    expect(membersA).toHaveLength(1);
    expect(membersA[0].userId).toBe(userA.id);

    // Cross-tenant read is impossible through the scoped repo.
    expect(await repoA.members.getByUserId(userB.id)).toBeNull();
    expect(await repoB.members.getByUserId(userA.id)).toBeNull();

    // Cross-tenant delete affects nothing.
    const removed = await repoB.members.remove(userA.id);
    expect(removed).toHaveLength(0);
    expect(await repoA.members.list()).toHaveLength(1);
  });

  it("invitations are scoped to the restaurant", async () => {
    const restaurantA = await seedRestaurant("inv-a");
    const restaurantB = await seedRestaurant("inv-b");

    const repoA = createRestaurantRepo(restaurantA.id);
    const repoB = createRestaurantRepo(restaurantB.id);

    const [invitationA] = await repoA.invitations.create({
      email: `owner@${SUFFIX}.test`,
      role: "owner",
      tokenHash: `${SUFFIX}-hash-a`,
      expiresAt: new Date(Date.now() + 3600_000),
    });

    // Cross-tenant reads return nothing.
    expect(await repoB.invitations.findById(invitationA.id)).toBeNull();
    expect(await repoB.invitations.list()).toHaveLength(0);

    // Cross-tenant update and delete affect nothing.
    expect(await repoB.invitations.markAccepted(invitationA.id)).toHaveLength(0);
    expect(await repoB.invitations.delete(invitationA.id)).toHaveLength(0);

    const stillOpen = await repoA.invitations.findById(invitationA.id);
    expect(stillOpen?.acceptedAt ?? null).toBeNull();
  });

  it("slug uniqueness is enforced", async () => {
    const restaurant = await seedRestaurant("uniq");
    expect(await restaurantSlugExists(restaurant.slug)).toBe(true);
    expect(await restaurantSlugExists(`${restaurant.slug}-x`)).toBe(false);
  });

  it("public slug lookup returns only that restaurant", async () => {
    const restaurantA = await seedRestaurant("sl-a");
    const fetched = await getRestaurantBySlug(restaurantA.slug);
    expect(fetched?.id).toBe(restaurantA.id);
    expect(await getRestaurantBySlug(`${restaurantA.slug}-nope`)).toBeNull();
  });
});
