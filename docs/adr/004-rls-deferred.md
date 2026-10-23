# ADR 004: RLS deferred; repo layer + isolation tests are the Phase 1 boundary

## Context

Spec allows either Postgres RLS as defense in depth, or an airtight repo layer
with tests. The app's only DB clients are the server (no direct SQL anywhere).

## Decision

No RLS in v1. Every tenant query goes through `createRestaurantRepo`
(restaurant_id applied to every method) or explicitly-marked platform/public
repos; an ESLint rule blocks tenant-table imports outside repos; the
integration suite asserts cross-tenant read/update/delete is impossible.

## Consequences

Faster Phase 1 with a testable boundary. RLS can be layered in later; revisit
if any non-repo SQL path is ever added.
