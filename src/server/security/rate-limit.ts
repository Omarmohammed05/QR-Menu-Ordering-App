import {createHash} from 'node:crypto';
import {sql} from 'drizzle-orm';
import {db} from '@/server/db';

/**
 * Postgres-backed fixed-window rate limiter (spec §11). One atomic upsert per
 * hit: the count increments inside the window and resets (with a new window)
 * after it expires — no read-modify-write race is possible.
 */

/** Bucket key — SHA-256 of the raw parts, so no IP sits in the table in clear. */
export function rateLimitKey(...parts: string[]): string {
  return createHash('sha256').update(parts.join('\u0000')).digest('hex');
}

/**
 * Consume one hit from the bucket. Returns true when the caller is still
 * within `limit` hits per `windowSeconds`, false once the limit is exceeded.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const result = (await db.execute(sql`
    INSERT INTO rate_limits ("key", window_start, count)
    VALUES (${key}, now(), 1)
    ON CONFLICT ("key") DO UPDATE SET
      count = CASE
        WHEN rate_limits.window_start > now() - make_interval(secs => ${windowSeconds})
        THEN rate_limits.count + 1
        ELSE 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start > now() - make_interval(secs => ${windowSeconds})
        THEN rate_limits.window_start
        ELSE now()
      END
    RETURNING count
  `)) as unknown;
  // postgres-js returns the rows array; drizzle may wrap it — handle both.
  const rows = Array.isArray(result) ? result : ((result as {rows?: {count: number}[]}).rows ?? []);
  const count = rows[0]?.count ?? 1;
  return count <= limit;
}
