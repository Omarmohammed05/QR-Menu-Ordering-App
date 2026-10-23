# ADR-002 — Tenant isolation: shared schema, composite FKs, scoped repo factory

Status: accepted (2026-10-24)

## Context

The product is multi-tenant SaaS: thousands of restaurants share one
PostgreSQL database (Neon in production). Leaking one restaurant's menu or
orders into another's dashboard is the worst possible failure mode, so tenant
isolation must hold even when application code has a bug.

## Decision

1. **Shared database, shared schema.** Every tenant table carries a
   non-null `restaurant_id` referencing `restaurants(id)` with
   `ON DELETE CASCADE`. No tenant-specific databases or schemas.

2. **Composite foreign keys for same-tenant references.** Whenever a tenant
   table references another tenant table (item → category, order item →
   order/item, order → table), the FK is the composite
   `(restaurant_id, target_id)` pointing at a `UNIQUE (restaurant_id, id)` on
   the parent. Cross-tenant references are then impossible at the **database
   level** — even raw SQL cannot wire tenant B's order to tenant A's item.
   `MATCH SIMPLE` keeps nullable participants (e.g. `orders.table_id`)
   unfetched when NULL.

3. **Scoped repo factory.** All tenant data access goes through
   `createRestaurantRepos(restaurantId)` (`src/server/db/repos/`). The factory
   injects `restaurantId` on every insert and filters every read by it;
   callers never pass a tenant id, so scoping cannot be forgotten or forged.
   Tenant-root lookups (login, QR slug resolution) use `restaurantsRepo`.
   The UI never imports the SQL client directly (ADR-001 rule).

4. **Deletion policy.** Composite `ON DELETE SET NULL` would null the tenant
   column too, so it is banned. History-bearing FKs (`order_items → menu_items`,
   `orders → restaurant_tables`) use the default `NO ACTION`: rows with
   history are archived, not deleted (`is_available` / `is_active = false`).

## Consequences

- Schemas of parent tenant tables carry an extra `UNIQUE (restaurant_id, id)`
  (also a useful index for scoped primary-key lookups).
- Deleting a category cascades its items, which is blocked while any order
  history references them — the app must archive instead; this is correct,
  order history is immutable (prices/names are snapshotted on `order_items`).
- Tenant isolation is enforced twice (repo layer + DB constraints) and test-
  enforced: `src/server/db/repos.tenant-isolation.test.ts` runs against real
  Postgres and must keep passing for every future repo method.
