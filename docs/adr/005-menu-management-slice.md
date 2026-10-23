# ADR-005 — Menu management slice (Phase 2)

Date: 2026-10-23

## Context

Phase 2 starts with restaurant menu management (categories + items). The RBAC
matrix already defines `menu.edit` (manager + owner); owners need a
per-restaurant management surface behind the dashboard.

## Decision

- `menu_categories` and `menu_items` both denormalize `restaurant_id`, so every
  query stays inside `createRestaurantRepo()` tenant scoping (ADR-004 stance).
- Management lives at `/[locale]/dashboard/[slug]`, gated to `menu.edit`;
  non-members are redirected — no existence leak via slug probing.
- Every mutating service returns the full menu snapshot; the client replaces
  state with it. Menus are small — no optimistic updates, no cache layer.
- Deleting a category is rejected while it holds items (`CATEGORY_NOT_EMPTY`)
  instead of cascading silently. Ordering swaps run in a transaction.

## Consequences

- Server actions stay thin; ordering is server-computed (`sortOrder` swap),
  never client-trusted.
- Snapshot-per-mutation costs one extra read per mutation — acceptable at menu
  scale, revisit if menus grow past a few hundred items.
