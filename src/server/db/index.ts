import {drizzle} from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {env} from '@/server/env';

type SqlClient = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as {postgresClient?: SqlClient};

export const client: SqlClient = globalForDb.postgresClient ?? postgres(env.DATABASE_URL, {
  max: 5
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.postgresClient = client;
}

export const db = drizzle({client, casing: 'snake_case'});
