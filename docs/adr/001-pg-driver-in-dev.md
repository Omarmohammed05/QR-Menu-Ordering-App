# ADR 001: pg driver in dev, Neon driver decided at deploy time

## Context

Spec fixes Neon (serverless driver) for production. Local dev, tests, CI, and
the Base44 sandbox run a plain Postgres container; the Neon serverless driver
cannot connect to it directly.

## Decision

Use `drizzle-orm/node-postgres` (`pg` pool) for dev/test/CI now. At Phase 8
(deploy) the client is swapped to the Neon serverless driver — a single-file
change behind `DATABASE_URL`, same drizzle SQL surface. No app code touches the
pool beyond `src/server/db/client.ts`.

## Consequences

Dev parity today at zero integration cost; Phase 8 carries one documented
driver swap. Transactions and prepared statements must stay drizzle-level so
the swap stays trivial.
