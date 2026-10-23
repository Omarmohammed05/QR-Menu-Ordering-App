/**
 * Development seed: creates the platform super admin (invite-only everywhere
 * else — ADR-002). Run inside the app environment: pnpm db:seed
 * Credentials come from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (dev defaults
 * documented in .env.example). Local development only.
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, pool } from "../src/server/db/client";
import { user } from "../src/server/db/schema";
import { auth } from "../src/server/auth";
import { logger } from "../src/server/logger";

const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@qrmenu.test").toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!dev";

const [existing] = await db.select().from(user).where(eq(user.email, email)).limit(1);
if (existing) {
  logger.info({ email }, "seed: platform admin already exists");
  await pool.end();
  process.exit(0);
}

const signUp = await auth.api.signUpEmail({
  body: { email, password, name: "Platform Admin" },
});
if ("error" in signUp && signUp.error) {
  logger.error({ code: (signUp.error as { code?: string }).code }, "seed: could not create platform admin");
  process.exit(1);
}

await db.update(user).set({ superAdmin: true, emailVerified: true }).where(eq(user.email, email));

logger.info(
  { email },
  "seed: platform admin created (password from SEED_ADMIN_PASSWORD or the documented dev default)",
);
await pool.end();
