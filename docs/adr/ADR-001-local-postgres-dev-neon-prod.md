# ADR-001: Local Postgres in dev/tests, Neon serverless in production

- Status: Accepted
- Date: 2026-10-24
- Phase: 0 (foundation; drives Phase 1 schema work)

## Context

The product targets Egyptian restaurants and will run its production database on
[Neon](https://neon.tech) (serverless Postgres). Developers and CI, however, need a
disposable, zero-cost Postgres that boots in seconds offline of any cloud account.

Two databases with different drivers historically meant two code paths: migrations
that pass locally but fail in prod, connection handling that differs per environment,
and duplicated schema tooling.

## Decision

Use **one database: Postgres**. Run it as a plain `postgres:16` container locally
(`docker-compose.base44.yml`) and in CI (service container); use Neon in production.

- **Same migrations everywhere.** Drizzle Kit generates SQL migrations; they run
  identically against local Postgres and Neon. No environment-specific SQL.
- **One driver everywhere: `postgres-js`** (`postgres` npm package) over TCP. Neon
  exposes standard Postgres over TCP (with SSL from the connection string), so the
  driver — and therefore all query code — is chosen by the `DATABASE_URL`
  environment variable, not by a code path.
- **Connection pooling is a config concern, not a code concern.** Locally the pool
  is a single small app-level pool (`max: 5`); in production Neon's pooler endpoint
  can be used via the connection string host, with the same code.
- The Neon serverless HTTP driver is **not** adopted: it would fork the runtime code
  path between environments for marginal benefit.

## Consequences

- Dev/test/prod divergence risk is limited to Postgres version drift; both sides are
  pinned to Postgres 16.
- CI runs the same migrations against a real Postgres, catching schema issues before
  they reach Neon.
- If Neon-specific features (e.g. branching) are adopted later, they stay in
  provisioning tooling, never in application code.
