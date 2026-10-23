# Build — Phase 0 Plan (Foundation)

Per spec §15 Phase 0. **Do not code until this plan is approved.**

## Repo audit — what exists today

| Path | State | Verdict for the build |
|---|---|---|
| `README.md` | One-line title only | Rewrite in Phase 8; placeholder now |
| `.agents/skills/` | apple-design + REA skills (research tooling) | Keep; not app code. apple-design is referenced by spec §14.4 |
| `research/` (git-ignored) | MenuTiger competitive study | Never ships; unrelated to app |
| Everything else (`src/`, `package.json`, configs, CI, `docs/`) | **Does not exist** | Greenfield; nothing to audit/preserve — no existing auth/DB/tenancy to keep |

## Scope (exactly Phase 0, nothing more)

Scaffold + tooling + i18n + design tokens + DB wiring + health check + CI. No schema, no auth, no UI features (Phase 1+).

## Files to create, in order

1. **Scaffold** — `package.json` (pnpm), Next.js latest stable (App Router), React, `tsconfig.json` strict (incl. `noUncheckedIndexedAccess`), `next.config.ts`, `src/` layout per spec §3.1 (`app/[locale]`, `server/db`, `lib`, `i18n`, `styles`, `components/ui`).
2. **Tooling** — ESLint (`next/core-web-vitals`, strict), Prettier, Husky + lint-staged (staged lint + typecheck), `.editorconfig`.
3. **Design tokens** — `src/styles/tokens.css` (spec §14.1 verbatim, light + dark), `globals.css`, Tailwind v4 wired to the tokens; fonts: Geist Sans + Geist Mono + IBM Plex Sans Arabic via `next/font` (ar+latin subsets, `display: swap`, weights-only-what's-used).
4. **i18n** — next-intl: `ar` (default, RTL) + `en`; `src/i18n/routing.ts`, middleware, `src/i18n/messages/{ar,en}.json`; placeholder page with an AR/EN toggle proving `dir` switches and zero hardcoded strings (gate item).
5. **Env validation** — `src/server/env.ts` (Zod, fail-fast at boot); `.env.example` documenting every variable (`DATABASE_URL`, `BETTER_AUTH_SECRET` — already provisioned as an app secret in this workspace, `AUTH_URL`, `BLOB_READ_WRITE_TOKEN` marked Phase 2+).
6. **DB wiring (no schema yet)** — Drizzle + drizzle-kit config; `docker-compose.base44.yml`: `db` (postgres:16, named volume, healthcheck) + `web` (node:22, source bind-mounted, startup `pnpm install --frozen-lockfile && pnpm dev`, port 3000, `/api/health` healthcheck). Dev/tests run on this local Postgres.
7. **`/api/health`** — route handler that pings the DB (real dependency check, not a constant 200).
8. **Tests** — Vitest + a real unit test of the env schema (rejects bad input, accepts valid) and one i18n helper test; integration harness against disposable Postgres deferred to Phase 1 (needs schema).
9. **CI** — `.github/workflows/ci.yml`: pnpm install → typecheck → lint → unit → build, with a Postgres service container (integration slots in Phase 1; e2e in Phase 5).
10. **ADR folder** — `docs/adr/`; ADR-001: "Local Postgres in dev/tests, Neon serverless in prod — same migrations, driver chosen by env" (drives Phase 1 schema work).

## Key risks & mitigations

- **Version pinning**: React 19 + next-intl + Tailwind v4 compatibility → pin exact versions on day 1; no `latest` floats.
- **Neon vs local Postgres divergence**: mitigated by ADR-001 (same SQL migrations; only the driver differs).
- **Fonts/Arabic metrics**: load IBM Plex Sans Arabic now, verify line-height 1.7 rule in the placeholder.

## Verification (gate evidence, per operating rules)

Real commands run and output summarized in the report: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`; `docker compose up` serving the dev app on port 3000; placeholder page screenshotted at 390px and 1280px in **both locales** with RTL/LTR correct.

## Explicitly out of scope this phase

Schema/auth (1), menu management (2), public menu (3), orders/WhatsApp (4), board/QR (5), admin/marketing (6), polish (7), demo/docs/deploy (8).
