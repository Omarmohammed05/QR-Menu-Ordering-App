# Phase 3 — Tenant Scoping Summary

Status: **complete** — verified end to end (2026-10-23). Scope: resolve the signed-in user's restaurant tenant (onboarding → membership → scoped dashboard). Menu management itself is the next phase.

## Delivered

| Piece | Result |
|---|---|
| `membersRepo` (`src/server/db/repos/members.ts`) | Session→tenant resolution: `listForUser(userId)` joins memberships with their restaurant rows. Keyed by the session's own user id; not part of the ADR-002 factory (no caller-supplied tenant ids involved). |
| Onboarding (`/ar/onboarding`) | Session-guarded page: a user with a membership is bounced to the dashboard; otherwise the create-restaurant form renders. |
| Create-restaurant action (`src/server/actions/create-restaurant.ts`) | Zod-validated (Arabic name required, English optional, E.164 WhatsApp), creates restaurant + owner membership in one transaction, retries the slug on a unique-violation race, then redirects to the dashboard. Machine-readable error codes; the form maps them to locale strings. |
| Slug (`src/server/restaurants/slug.ts`) | `<latin-base>-<6 hex>` (`koshary-house-9f3ab1`), generic `menu` base for Arabic-only names; 7 unit tests. |
| Dashboard (`/ar/dashboard`) | Now tenant-scoped: shows the member's restaurant name, public slug (`/r/<slug>`), WhatsApp number, and role. Users without a restaurant are sent to onboarding. |
| i18n | New `onboarding` + `dashboard` namespaces in ar/en; phase chips say "Phase 3 · Tenant scoping". |

## Verification

- `pnpm typecheck` / `pnpm lint` / `pnpm test` — pass (20/20, tenancy isolation still green).
- `pnpm build` — pass; `/[locale]/onboarding` correctly dynamic (session-dependent).
- End-to-end via server-side curl (same endpoints the forms call; progressive-enhancement POST of the server action):
  - Signed-up user without a restaurant: `/ar/dashboard` → 307 `/ar/onboarding`; form renders.
  - Valid submit → 303 `/ar/dashboard`; dashboard shows the created restaurant (name, slug `phase-three-grill-…`, WhatsApp, role "مالك").
  - Revisit `/ar/onboarding` → 307 back to the dashboard (already an owner).
  - Invalid submit (empty Arabic name + `whatsappNumber=0100`) → 200 re-render with `اكتب اسم المطعم بالعربية` in the alert (first zod issue wins).
- All test fixtures (2 users, 1 restaurant) deleted afterwards — DB back to 0 rows.

## Issues hit

- Server Actions CSRF: `Origin` must match the request host (`localhost` when curling directly); Better Auth endpoints want the *preview* origin (trusted). Two different origins for two different layers — see AGENTS.md.
- Progressive-enhancement action POSTs must replay React's rendered hidden fields (`$ACTION_REF_1`, `$ACTION_1:0`, `$ACTION_1:1`, `$ACTION_KEY`), not a plain `$ACTION_ID_…`.

## Next

Phase 4 — menu management (categories/items CRUD in the scoped dashboard) on top of the now-resolved tenant context.
