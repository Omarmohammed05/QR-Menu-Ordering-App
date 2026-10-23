# AGENTS.md

## Stack

Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict, `noUncheckedIndexedAccess`), Tailwind v4 (CSS-first, tokens in `src/styles/tokens.css`), next-intl (`ar` default/RTL + `en`), Drizzle ORM over postgres-js, Vitest, pnpm (version pinned in `packageManager` — never `latest`).

## Environment

- Dev runs via `docker compose -f docker-compose.base44.yml up -d`: `db` (postgres:16) + `web` (node:22, source bind-mounted, `pnpm install --frozen-lockfile && pnpm dev`). Web is on http://localhost:3000; `pnpm dev` binds 0.0.0.0.
- `NODE_ENV` must never be set in compose or CI: `next dev` and `next build` set it correctly per mode, and a leaked `NODE_ENV=development` crashes `pnpm build` inside the container (`/_global-error` prerender, vercel/next.js#86178).
- `DATABASE_URL` and Postgres credentials are local-infra values set in the compose file — not secrets.
- `BETTER_AUTH_SECRET` comes from the platform-managed env file; never commit secrets.
- `HUSKY=0` is set in compose and CI so hook installation is skipped where git runs outside the container — do not remove it; husky hooks are for developers' local clones.
- `next.config.ts` adds `allowedDevOrigins` **only** when `BASE44_PREVIEW_MODE === "1"` (sandbox preview). Keep that gating.
- `src/components/base44-preview-hmr-shim.tsx` (rendered by the root layout, same flag gating): the sandbox preview gateway cannot upgrade WebSockets (502), so the dev server's HMR socket (`/_next/hmr`) can never connect through it. The shim swaps in an idle fake WebSocket for HMR URLs only — without it every preview load logs a WebSocket error. Live reload in the sandbox degrades to a manual page refresh (the upgrade was always blocked, so nothing is lost); outside the sandbox it renders nothing and HMR works normally.
- Platform preview browser (sandbox only): client-side navigations through the preview proxy hard-load the document (the platform's pushState `navigate()` helper never re-renders in the Next App Router, and clicking the app's own `<Link>`s replaces the document). Hard loads are user-fine — pages render at their destination — but a preview script cannot cross a navigation. Verify multi-page flows server-side (curl with a cookie jar hits the same endpoints the forms call; e.g. Phase 2 auth was verified this way) and keep preview scripts to a single page.
- Server-side curl verification needs TWO different `Origin` headers: Better Auth endpoints (`/api/auth/*`) want the preview origin (`https://3000-$BASE44_PUBLIC_HOST_SUFFIX` — it is in `trustedOrigins`, and `localhost` gets 403); Next Server Actions want `Origin` matching the request host (`http://localhost:3000` when curling directly) or the action aborts as invalid.
- Replaying a Server Action as a no-JS progressive-enhancement POST (Phase 3 onboarding was verified this way): fetch the page HTML, replay ALL rendered hidden fields (`$ACTION_REF_1`, `$ACTION_1:0`, `$ACTION_1:1`, `$ACTION_KEY` — bound-args encoding, not a bare `$ACTION_ID_…`) plus the form's own fields.
- Adding a route or layout can leave a stale `.next/dev/types/validator.ts` whose internal TS2344 errors fail `pnpm typecheck` before the dev server recompiles that route. Fix: `rm -rf .next/dev/types`, request any route once, re-run typecheck.

## Conventions

- i18n: Arabic is the default locale; every user-facing string goes through `src/i18n/messages/{ar,en}.json` — zero hardcoded strings. Layout reads `dir` from `src/i18n/locale.ts#directionFor`; Arabic body line-height is 1.7 (set in `globals.css`).
- Locale routing: `src/proxy.ts` (Next 16's renamed middleware) + `src/i18n/routing.ts` + `next/root-params` in `src/i18n/request.ts`.
- DB: schema (Phase 1+) lives in `src/server/db/schema/` (split by domain, barreled via `src/server/db/schema.ts`); every query goes through `src/server/db` — the UI never imports `postgres` directly. See `docs/adr/ADR-001` (same migrations locally and on Neon; driver selected by env).
- Tenancy (ADR-002): every tenant table carries `restaurant_id`; same-tenant references use composite FKs `(restaurant_id, target_id)` so cross-tenant rows cannot exist even via raw SQL. All tenant data access goes through `createRestaurantRepos(restaurantId)` in `src/server/db/repos/` — it injects and filters by the tenant id; callers never pass it. Column keys are camelCase; `snake_case` casing is set in BOTH `drizzle.config.ts` and the runtime client. `repos.tenant-isolation.test.ts` applies the committed `drizzle/` migrations itself and must stay green.
- Money: integers (piastres) in DB. Time: UTC timestamptz + IANA timezone logic.
- Imports use the `@/` alias → `src/`.

## Verify

- `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build`
- Health: `GET /api/health` pings the DB (503 when the DB is down — a constant 200 means it's broken).
- Run these inside the compose web container: `docker compose -f docker-compose.base44.yml exec web pnpm <script>`.
- Tenancy isolation is test-enforced; Phase 1 schema work must ship with those tests.
