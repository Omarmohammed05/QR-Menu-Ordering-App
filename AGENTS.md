# QR Menu — development notes

Multi-tenant QR menu ordering SaaS (Next.js App Router, TypeScript strict,
Tailwind v4 + CSS tokens, next-intl ar/en, Drizzle + Postgres).

## Commands

- `pnpm dev` — Next dev server (bind `0.0.0.0:3000` inside compose; compose
  passes `-H 0.0.0.0`).
- `pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm build` — gates.
- `pnpm db:generate` / `pnpm db:migrate` — drizzle-kit; `DATABASE_URL` comes
  from `.env` (host) or compose env (sandbox). Migrations are forward-only and
  committed under `src/server/db/migrations`.

## Base44 sandbox

`docker compose -f docker-compose.base44.yml up -d` starts `db` (postgres:16)
and `web` (node:22, source bind-mounted at `/app`, deps in the
`web-node-modules` named volume, `pnpm install` on boot). Health endpoint:
`GET /api/health` (checks the DB).

Sandbox-only override: `next.config.ts` appends `https://3000-$BASE44_PUBLIC_HOST_SUFFIX`
to `allowedDevOrigins` **only** when `BASE44_PREVIEW_MODE === "1"`; with the
flag unset the config is untouched.

## Quirks

- Money is integer piastres everywhere (`src/lib/money.ts`); formatting uses
  ICU `ar-EG`/`en-EG` — exact expected strings live in `tests/unit/money.test.ts`.
- `env` validation runs at module import (`src/lib/env.ts`); any new secret
  must be added to `.env.example` too.
- Husky runs `lint-staged` on commit; CI enforces typecheck/lint/test/build.
