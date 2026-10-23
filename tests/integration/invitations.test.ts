import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { like, eq, sql } from "drizzle-orm";
import { db, pool } from "@/server/db/client";
import { user } from "@/server/db/schema";
import { acceptInvitation, getInvitationContext } from "@/server/services/invitations";
import { createRestaurantWithOwnerInvite } from "@/server/services/restaurants";
import { createRestaurantRepo } from "@/server/repos/create-restaurant-repo";

const RUN = `inv-${Date.now().toString(36)}`;

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "src/server/db/migrations" });
});

afterAll(async () => {
  await db.delete(user).where(like(user.email, `%@${RUN}.test`));
  await db.execute(sql`DELETE FROM restaurants WHERE slug LIKE ${`inv-${RUN}%`}`);
  await pool.end();
});

describe("restaurant creation + owner invitation (services)", () => {
  it("creates a restaurant with owner invite, accepts it, and refuses replays", async () => {
    const ownerEmail = `owner@${RUN}.test`;
    const created = await createRestaurantWithOwnerInvite({
      nameAr: "مطعم الكشري",
      nameEn: "Koshary House",
      slug: `inv-${RUN}-koshary`,
      ownerEmail,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const { restaurantId, inviteToken } = created;

    const context = await getInvitationContext(inviteToken);
    expect(context.valid).toBe(true);

    // Accept: creates user + membership.
    const accepted = await acceptInvitation({
      token: inviteToken,
      name: "Owner One",
      password: "OwnerPass123!",
    });
    expect(accepted).toEqual({ ok: true });

    const [createdUser] = await db.select().from(user).where(eq(user.email, ownerEmail)).limit(1);
    expect(createdUser).toBeDefined();

    const members = await createRestaurantRepo(restaurantId).members.list();
    expect(members).toHaveLength(1);
    expect(members[0].role).toBe("owner");

    // Token replay is rejected — invitation was consumed.
    const replay = await acceptInvitation({
      token: inviteToken,
      name: "Owner Two",
      password: "OwnerPass123!",
    });
    expect(replay).toEqual({ ok: false, code: "invalid" });

    // Context is no longer valid either.
    expect((await getInvitationContext(inviteToken)).valid).toBe(false);
  });

  it("rejects invalid and expired tokens", async () => {
    expect(
      await acceptInvitation({ token: "x".repeat(48), name: "Nope", password: "OwnerPass123!" }),
    ).toEqual({
      ok: false,
      code: "invalid",
    });
  });

  it("rejects reserved/taken slugs and duplicate slugs", async () => {
    const reserved = await createRestaurantWithOwnerInvite({
      nameAr: "سيء",
      slug: "admin",
      ownerEmail: `x@${RUN}.test`,
    });
    expect(reserved).toEqual({ ok: false, code: "slug_invalid" });

    const taken = await createRestaurantWithOwnerInvite({
      nameAr: "مكرر",
      slug: `inv-${RUN}-koshary`,
      ownerEmail: `y@${RUN}.test`,
    });
    expect(taken).toEqual({ ok: false, code: "slug_taken" });
  });
});
