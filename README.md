# قائمة — QR Menu Ordering for Restaurants

Arabic-first, multi-tenant QR-code menu platform. Guests scan a table QR, browse a bilingual (Arabic RTL default + English) menu, and place their order through WhatsApp. Restaurant owners manage everything from a monochrome, Apple-grade dashboard; the platform owner administers tenants through an invite-only claim flow — there is no public sign-up.

## Features

- **Public menu** — clean hashless slugs (`/demo` in Arabic, `/en/demo` in English), printed QR codes keep working forever via 301 redirects from retired slugs
- **Ordering** — cart → Apple-style bottom-sheet checkout → order persisted with sequential per-tenant numbers, unguessable public IDs and idempotency keys, then handed off to WhatsApp (cash / InstaPay with optional proof upload)
- **Dashboard** — menu management (categories, dishes, options, images via imgbb), live order status board with polling, QR table cards, opening hours, branch addresses, team seats, menu analytics (views + dish impressions)
- **Multi-tenancy** — shared database with `restaurant_id` on every tenant row, composite FKs and tenant-scoped repos (ADR-002); cross-tenant rows cannot exist even via raw SQL
- **Platform admin** — restaurant creation, invite/claim codes, plan configuration, gated on the platform owner email

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind v4 (CSS-first tokens) · next-intl (`ar` default + `en`) · PostgreSQL (Neon in production, docker compose locally) · Drizzle ORM · Better Auth · Vitest · Playwright (e2e)

## Getting started

Requirements: Docker + pnpm (Node ≥ 22).

```bash
cp .env.example .env          # fill BETTER_AUTH_SECRET (openssl rand -base64 32)
docker compose -f docker-compose.base44.yml up -d   # Postgres + dev server on :3000
pnpm exec drizzle-kit migrate                        # apply migrations
pnpm seed                                            # idempotent demo restaurant
```

Open http://localhost:3000 — the landing links to the demo menu (`/demo`) and the login. In the sandbox preview the same compose file is the environment; source is bind-mounted so edits hot-reload.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server (`next dev`, binds 0.0.0.0) |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm typecheck` · `pnpm lint` | TypeScript strict + ESLint |
| `pnpm test` | Vitest — unit + tenancy-isolation integration (applies `drizzle/` migrations itself) |
| `pnpm e2e` | Playwright smoke suite (`e2e/`) — reuses a server on :3000 or starts `pnpm start` |
| `pnpm seed` | Idempotent demo restaurant (`scripts/seed-demo.ts`) |
| `pnpm exec drizzle-kit generate` / `migrate` | Create / apply DB migrations |

CI runs both jobs on every PR: `verify` (typecheck, lint, tests, build) and `e2e` (migrate → seed → build → Playwright against a fresh Postgres).

## Conventions

- Zero hardcoded user-facing strings — everything through `src/i18n/messages/{ar,en}.json`
- Money as integer piastres; timestamps as UTC `timestamptz`; opening hours evaluated in the restaurant's IANA timezone
- The UI never imports the DB driver; all tenant access via `createRestaurantRepos(restaurantId)`
- Public URLs (QR, sitemap, OG) are built exclusively from `NEXT_PUBLIC_APP_URL`

## Docs

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Neon + Vercel production setup
- [docs/adr/](docs/adr/) — ADR-001 (local Postgres / Neon prod), ADR-002 (tenant isolation)
