# AGENTS.md

## Stack

Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict, `noUncheckedIndexedAccess`), Tailwind v4 (CSS-first, tokens in `src/styles/tokens.css`), next-intl (`ar` default/RTL + `en`), Drizzle ORM over postgres-js, Vitest, pnpm (version pinned in `packageManager` — never `latest`).

## Environment

- Dev runs via `docker compose -f docker-compose.base44.yml up -d`: `db` (postgres:16) + `web` (node:22, source bind-mounted, `pnpm install --frozen-lockfile && pnpm dev`). Web is on http://localhost:3000; `pnpm dev` binds 0.0.0.0.
- `DATABASE_URL` and Postgres credentials are local-infra values set in the compose file — not secrets.
- `BETTER_AUTH_SECRET` comes from the platform-managed env file; never commit secrets.
- `HUSKY=0` is set in compose and CI so hook installation is skipped where git runs outside the container — do not remove it; husky hooks are for developers' local clones.
- `next.config.ts` adds `allowedDevOrigins` **only** when `BASE44_PREVIEW_MODE === "1"` (sandbox preview). Keep that gating.
- `src/components/base44-preview-hmr-shim.tsx` (rendered by the root layout, same flag gating): the sandbox preview gateway cannot upgrade WebSockets (502), so the dev server's HMR socket (`/_next/hmr`) can never connect through it. The shim swaps in an idle fake WebSocket for HMR URLs only — without it every preview load logs a WebSocket error. Live reload in the sandbox degrades to a manual page refresh (the upgrade was always blocked, so nothing is lost); outside the sandbox it renders nothing and HMR works normally.

## Conventions

- i18n: Arabic is the default locale; every user-facing string goes through `src/i18n/messages/{ar,en}.json` — zero hardcoded strings. Layout reads `dir` from `src/i18n/locale.ts#directionFor`; Arabic body line-height is 1.7 (set in `globals.css`).
- Locale routing: `src/proxy.ts` (Next 16's renamed middleware) + `src/i18n/routing.ts` + `next/root-params` in `src/i18n/request.ts`.
- DB: schema (Phase 1+) lives in `src/server/db/`; every query goes through `src/server/db` — the UI never imports `postgres` directly. See `docs/adr/ADR-001` (same migrations locally and on Neon; driver selected by env).
- Money: integers (piastres) in DB. Time: UTC timestamptz + IANA timezone logic.
- Imports use the `@/` alias → `src/`.

## Verify

- `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build`
- Health: `GET /api/health` pings the DB (503 when the DB is down — a constant 200 means it's broken).
- Run these inside the compose web container: `docker compose -f docker-compose.base44.yml exec web pnpm <script>`.
- Tenancy isolation is test-enforced; Phase 1 schema work must ship with those tests.
