import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";
import * as schema from "./schema";

export const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool, { schema });

/** Either the pool-backed db or an in-flight transaction executor. */
export type DbExecutor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
