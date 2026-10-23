import { lt, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { rateLimits } from "@/server/db/schema";

export type RateLimitResult = {
  ok: boolean;
  /** Hits remaining in the current window after this one. */
  remaining: number;
};

/**
 * Postgres-backed fixed-window rate limiter (spec section 11).
 * Atomic via INSERT .. ON CONFLICT DO UPDATE, safe under concurrency.
 */
export async function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const windowStart = new Date(Math.floor(Date.now() / opts.windowMs) * opts.windowMs);
  const [row] = await db
    .insert(rateLimits)
    .values({ key: opts.key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.key, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });

  // Opportunistic cleanup of stale windows (keeps the table small).
  if (Math.random() < 0.05) {
    await db.delete(rateLimits).where(lt(rateLimits.windowStart, new Date(Date.now() - 3_600_000)));
  }

  return { ok: row.count <= opts.limit, remaining: Math.max(0, opts.limit - row.count) };
}
