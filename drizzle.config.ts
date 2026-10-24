import {defineConfig} from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  // Schema lands in Phase 1; wiring only for now.
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  // Column keys are written camelCase in schema files; snake_case is applied
  // identically here (drizzle-kit) and in the runtime client (src/server/db).
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
});
