# Phase 4 — Menu Management Summary

Status: **complete** — verified end to end (2026-10-23). Scope: dashboard shell + menu management (sections/categories, dishes, availability) for the tenant resolved in Phase 3. Editing/deleting existing dishes and the public menu page are later phases.

## Delivered

| Piece | Result |
|---|---|
| Dashboard guard (`src/server/dashboard.ts`) | `requireMember(locale)` — request-cached (`react/cache`), session + membership in one place; unauthenticated → login, memberless → onboarding. |
| Dashboard shell (`dashboard/layout.tsx`) | Shared header: restaurant name, nav (Overview / Menu), sign-out. Runs the guard once per request. |
| Overview (`dashboard/page.tsx`) | Now a left-aligned overview (phase chip, restaurant, public slug, WhatsApp, role) inside the shell. |
| Menu management (`dashboard/menu/page.tsx`) | Sections with their dishes, grouped via the scoped repo factory; price formatted with `Intl.NumberFormat` (`EGP 85` / `٨٥٫٥٠ ج.م.`); sold-out dishes render muted. |
| Actions (`src/server/actions/menu.ts`) | `createCategoryAction`, `createItemAction` (Zod: Arabic name required, price as EGP text → integer piastres), `toggleItemAvailabilityAction` (plain no-JS form). Owner/manager can manage; staff gets a localized `forbidden` error. Categories resolved through the scoped repo — a foreign tenant's id is simply null (ADR-002). `revalidatePath` refreshes the page after each write. |
| Items repo | New `setAvailable(id, isAvailable)` — cross-tenant toggle returns false (no-op); tenancy test added. |
| Price format (`src/lib/format.ts`) | `formatPrice(piastres, locale)` — whole-EGP prices drop the fraction; unit tests pin the exact `en-EG` output (incl. the NBSP ICU inserts). |
| i18n | `menuManagement` namespace + dashboard `nav` in ar/en; zero hardcoded strings. |

## Verification

- `pnpm typecheck` / `pnpm lint` / `pnpm test` — pass (23/23; tenancy isolation green, incl. the new cross-tenant availability test).
- `pnpm build` — pass; both dashboard routes dynamic (session-dependent).
- End-to-end via server-side curl + progressive-enhancement action replay (fresh user → onboarding → menu):
  - Category "المشويات" created → section renders with its empty state + add-dish form.
  - Dish "كفتة مشوية" (EGP 85.50 → 8550 piastres) created → renders with description and Arabic-formatted price.
  - Invalid price ("abc") → page re-renders with `سعر غير صالح — مثل 85.50` in the alert.
  - Availability toggled off → DB `is_available=f`, name muted, button flips to "إظهار"; toggled back on → `is_available=t`.
- All fixtures (1 user, 1 restaurant, 1 category, 1 dish) deleted afterwards — DB back to 0 rows.

## Issues hit

- Stale `.next/dev/types/validator.ts` after adding a nested layout produced internal TS2344 errors; fixed by deleting `.next/dev/types` and re-requesting a route to regenerate. Noted in AGENTS.md.
- ICU uses a non-breaking space in currency output (`EGP\u00A085`) — pinned in the format tests.

## Next

Phase 5 — the public menu page (`/r/<slug>`): reads the tenant by slug through `restaurantsRepo`, renders the active categories/items for customers (RTL, Arabic-first), and opens the phase for QR + ordering.
