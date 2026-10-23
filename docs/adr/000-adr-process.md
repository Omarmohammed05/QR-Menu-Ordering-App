# ADR 000: Record Architecture Decisions

## Context

The build follows a phased spec where every non-obvious choice must be traceable.

## Decision

Non-obvious decisions get one file `docs/adr/NNN-title.md` with three short
sections — Context, Decision, Consequences — under 15 lines total. Obvious
spec-mandated choices (framework, DB, i18n) are not re-documented here.

## Consequences

Future phases and reviewers can audit deviations from the spec against the
ADR list; a missing ADR for a deviation is a review blocker.
