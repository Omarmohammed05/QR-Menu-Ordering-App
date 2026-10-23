import {defineConfig} from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  // Schema lands in Phase 1; wiring only for now.
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
});
