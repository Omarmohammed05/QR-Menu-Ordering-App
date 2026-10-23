# Phase 0 — Build Foundation Summary

Status: **complete** — all gate checks pass (2026-10-23). Scope was held to `docs/plans/phase-0-plan.md`: scaffold, tooling, i18n, design tokens, DB wiring, health check, CI. No schema, no auth, no product UI.

## Delivered

| Plan item | Result |
|---|---|
| 1. Scaffold | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript strict (`noUncheckedIndexedAccess`), pnpm, `src/` layout per spec §3.1 |
| 2. Tooling | ESLint (flat config), Prettier, Husky + lint-staged (skipped via `HUSKY=0` where git runs outside the container), `.editorconfig` |
| 3. Design tokens | `src/styles/tokens.css` (light + dark, spec §14.1), `globals.css` (Arabic line-height 1.7), Tailwind v4 wired to tokens; Geist Sans/Mono + IBM Plex Sans Arabic via `next/font` |
| 4. i18n | next-intl: `ar` (default, RTL, `localeDetection: false`) + `en`; `src/proxy.ts` middleware; zero hardcoded strings — all copy in `src/i18n/messages/{ar,en}.json` |
| 5. Env validation | `src/server/env.ts` (Zod, fail-fast); `.env.example` documents every variable |
| 6. DB wiring | Drizzle + drizzle-kit; `docker-compose.base44.yml`: postgres:16 (named volume, healthcheck) + node:22 web (source bind-mounted, `pnpm install --frozen-lockfile && pnpm dev`, port 3000) |
| 7. Health check | `GET /api/health` pings the DB; 503 when it is down |
| 8. Tests | Vitest: env schema test + i18n direction test (7 tests, all passing); integration harness deferred to Phase 1 per plan |
| 9. CI | `.github/workflows/ci.yml`: install → typecheck → lint → unit → build (integration slots in at Phase 1) |
| 10. ADR | `docs/adr/ADR-001`: local Postgres in dev/tests, Neon in prod, same migrations, driver chosen by env |

## Verification (gate evidence)

All commands run inside the compose web container:

- `pnpm lint` — pass, no warnings
- `pnpm typecheck` — pass
- `pnpm test` — 7/7 passing
- `pnpm build` — pass: `/ar` + `/en` SSG via `generateStaticParams`, `/_not-found` static, `/api/health` dynamic
- Dev server serving on port 3000 with DB up

Playwright smoke suite (`research/tooling/smoke.mjs`, git-ignored research workspace — 8/8 passing):

- `/api/health` → `{"status":"ok","checks":{"database":"up"}}`
- `/ar` and `/en` render at 390px and 1280px with correct `lang`/`dir` (RTL/LTR)
- Locale toggle `ar → en` switches `dir` in place
- `/` redirects to `/ar` (Arabic-first)
- No browser console errors
- Screenshots: `research/tooling/artifacts/{ar,en}-{390,1280}.png`

## Issues hit and resolutions

1. **Sandbox preview gateway cannot upgrade WebSockets (502)** — the dev server's HMR socket could never connect through it, logging a browser error on every preview load. Fixed with a preview-only shim (`src/components/base44-preview-hmr-shim.tsx`, gated on `BASE44_PREVIEW_MODE === "1"`, inert elsewhere). In-sandbox live reload is therefore manual refresh; local dev outside the sandbox has normal HMR.
2. **`pnpm build` failed on `/_global-error` prerender** — `TypeError: Cannot read properties of null (reading 'useContext')` (cf. vercel/next.js#86178). Root cause: the compose `web` service exported `NODE_ENV=development`, which leaks into `next build` and breaks production prerendering. Fixed by removing the variable from compose (Next sets it correctly per mode). Not an app-code bug; the framework issue itself remains unfixed upstream in 16.4.3 but does not affect us with a clean environment.
3. **Playwright/Chromium would not launch on the sandbox host** (missing system libraries; container needs `--no-sandbox`, `--disable-dev-shm-usage`). Fixed by running the smoke script inside the official `mcr.microsoft.com/playwright:v1.64.1-noble` image with `--network host`; launch flags are embedded in the script.

## Known limitations / deferrals

- Integration test harness against disposable Postgres: Phase 1 (needs schema).
- `BLOB_READ_WRITE_TOKEN` (Phase 2+ file storage) documented but not consumed.
- Production deploy (Phase 8) not configured yet; Neon credentials to be supplied then.

## Next

Phase 1 — multi-tenant schema (restaurant_id on every tenant table, scoped repo factory, tenancy-isolation tests shipped with the schema work).
