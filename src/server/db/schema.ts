/**
 * Schema barrel — drizzle-kit reads every exported table from here
 * (`drizzle.config.ts → schema: './src/server/db/schema.ts'`).
 * Split by domain; every tenant table carries `restaurant_id` (ADR-002).
 */
export * from './schema/enums';
export * from './schema/auth';
export * from './schema/restaurants';
export * from './schema/menu';
export * from './schema/orders';
export * from './schema/security';
