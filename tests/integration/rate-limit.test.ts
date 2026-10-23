import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { like } from "drizzle-orm";
import { db, pool } from "@/server/db/client";
import { rateLimits } from "@/server/db/schema";
import { rateLimit } from "@/server/security/rate-limit";

const KEY = `test-rl-${Date.now().toString(36)}`;
const WINDOW_MS = 2000;
const LIMIT = 2;

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "src/server/db/migrations" });
});

afterAll(async () => {
  await db.delete(rateLimits).where(like(rateLimits.key, `${KEY}%`));
  await pool.end();
});

describe("postgres-backed rate limiter", () => {
  it("allows up to the limit then blocks", async () => {
    expect((await rateLimit({ key: KEY, limit: LIMIT, windowMs: WINDOW_MS })).ok).toBe(true);
    expect((await rateLimit({ key: KEY, limit: LIMIT, windowMs: WINDOW_MS })).ok).toBe(true);
    const blocked = await rateLimit({ key: KEY, limit: LIMIT, windowMs: WINDOW_MS });
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("opens a fresh window after the fixed window passes", async () => {
    const waitMs = WINDOW_MS - (Date.now() % WINDOW_MS) + 50;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    const fresh = await rateLimit({ key: KEY, limit: LIMIT, windowMs: WINDOW_MS });
    expect(fresh.ok).toBe(true);
    expect(fresh.remaining).toBe(LIMIT - 1);
  });

  it("counts keys independently", async () => {
    const other = await rateLimit({ key: `${KEY}-other`, limit: LIMIT, windowMs: WINDOW_MS });
    expect(other.ok).toBe(true);
    expect(other.remaining).toBe(LIMIT - 1);
  });
});
