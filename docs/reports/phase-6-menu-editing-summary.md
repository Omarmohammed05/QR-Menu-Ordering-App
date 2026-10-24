# Menu Editing & Deletion Summary

Status: **complete** — verified end to end (2026-10-24). Closes the gap the Phase 4 report left open ("editing/deleting existing dishes … are later phases"). Ships on top of the public-menu/orders/QR work (commit 24c663d, which shipped without its own report).

## Delivered

| Piece | Result |
|---|---|
| Items repo (`src/server/db/repos/items.ts`) | `update` (name/description/price), `hasOrderHistory` (order-line lookup), `remove` — all tenant-scoped; a foreign id is a null/false no-op. |
| Categories repo (`src/server/db/repos/categories.ts`) | `update` (rename), `countItems` (the delete guard), `remove`. |
| Actions (`src/server/actions/menu.ts`) | `updateCategoryAction`, `deleteCategoryAction`, `updateItemAction`, `deleteItemAction` — same Zod validation and owner/manager gate as the create actions; machine-readable states map to locale strings. |
| Delete guards | A dish that ever appeared on an order is never deleted (order lines freeze its snapshot — ADR-002); the form shows a localized error suggesting hiding instead. A section still holding dishes refuses deletion (the FK cascade would silently drop them). |
| UI (`dashboard/menu/page.tsx` + 4 components) | Each section and dish row is a native `<details>` disclosure: "تحرير" opens an edit panel seeded with current values (price in EGP text) plus the delete button. Progressive-enhancement forms throughout — no JS required. |
| i18n | `edit` / `save` / `deleteItem` / `deleteCategory` + `errors.itemInUse` / `errors.categoryInUse` in ar/en. |
| Tests | Three new tenancy-isolation cases: cross-tenant update/delete no-ops, order-history delete guard, occupied-section guard. |

## Verification

- `pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm build` — all pass (43 tests, 13 tenancy).
- End-to-end via progressive action replay (temp user → onboarding → menu), 22 checks: category + dish created; dish renamed/repriced (`طبق معدّل`, 60 EGP → 6000 piastres) and re-rendered; invalid price ("abc") rejected with price unchanged; history-free dish deleted; section renamed; empty section deleted; a dish with an order line and an occupied section both refuse deletion with localized errors. Fixture (user, restaurant, categories, items, order) fully removed afterwards.
- Preview (signed-in session, demo restaurant): edit rows render per dish/section with the hide/show toggle intact; the edit panel opens seeded with the dish's current values.

## Next

Owner tooling beyond the menu: opening-hours editor (the repo is still read-only and seeded by hand), restaurant settings (WhatsApp number, names, timezone), and staff/manager invites.
