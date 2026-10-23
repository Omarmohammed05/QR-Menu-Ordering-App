import { headers } from "next/headers";
import type { z } from "zod";
import { auth } from "@/server/auth";
import { logger } from "@/server/logger";
import { rateLimit } from "@/server/security/rate-limit";
import { clientIp } from "@/server/security/request";

export class ActionError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export type ActionResult<T> = { ok: true; data: T } | { ok: false; code: string };

export type SessionUser = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>["user"];

async function sessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/**
 * Wraps a server action with the mandatory order (spec section 5):
 * authenticate → authorize → validate → execute. Deny by default.
 */
export function secureAction<TSchema extends z.ZodType, TData>(opts: {
  schema: TSchema;
  authorize: (user: SessionUser) => Promise<void> | void;
  handler: (user: SessionUser, input: z.output<TSchema>) => Promise<TData>;
}) {
  return async (rawInput: unknown): Promise<ActionResult<TData>> => {
    try {
      const user = await sessionUser();
      if (!user) {
        return { ok: false, code: "UNAUTHENTICATED" };
      }
      await opts.authorize(user);
      const parsed = opts.schema.safeParse(rawInput);
      if (!parsed.success) {
        return { ok: false, code: "INVALID_INPUT" };
      }
      const data = await opts.handler(user, parsed.data as z.output<TSchema>);
      return { ok: true, data };
    } catch (error) {
      if (error instanceof ActionError) {
        return { ok: false, code: error.code };
      }
      logger.error({ err: error }, "server action failed");
      return { ok: false, code: "INTERNAL" };
    }
  };
}

/**
 * Public (unauthenticated) action with strict validation and a mandatory
 * Postgres rate limit per client IP (spec section 11).
 */
export function publicAction<TSchema extends z.ZodType, TData>(opts: {
  schema: TSchema;
  rateLimit: { scope: string; limit: number; windowMs: number };
  handler: (input: z.output<TSchema>) => Promise<TData>;
}) {
  return async (rawInput: unknown): Promise<ActionResult<TData>> => {
    try {
      const parsed = opts.schema.safeParse(rawInput);
      if (!parsed.success) {
        return { ok: false, code: "INVALID_INPUT" };
      }
      const rl = await rateLimit({
        key: `${opts.rateLimit.scope}:${await clientIp()}`,
        limit: opts.rateLimit.limit,
        windowMs: opts.rateLimit.windowMs,
      });
      if (!rl.ok) {
        return { ok: false, code: "RATE_LIMITED" };
      }
      const data = await opts.handler(parsed.data as z.output<TSchema>);
      return { ok: true, data };
    } catch (error) {
      logger.error({ err: error }, "public action failed");
      return { ok: false, code: "INTERNAL" };
    }
  };
}
