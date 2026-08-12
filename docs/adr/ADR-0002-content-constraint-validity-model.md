# ADR-0002: Content Constraint Validity Model

- **Status:** Accepted (constraint types in DND-1.2; validity engine deferred to DND-1.3)
- **Date:** 2026-08-12
- **Sprint:** Decision recorded in DND-1.1; constraint domain in DND-1.2; evaluation in DND-1.3

## Context

DnDGem’s differentiator is content-aware layout validity, not free-form drag alone. Layouts must be judged against content constraints.

## Decision

Layouts are evaluated against content constraints producing validity states (planned: `VALID` / `DEGRADED` / `INVALID`) plus scoring.

- **DND-1.2:** constraint domain types and `ValidityState` vocabulary (no evaluation).
- **DND-1.3:** validity engine, scoring, and degradation algorithms.

See `docs/architecture/core-domain.md`.

## Consequences

- Interaction and rendering must not invent independent validity semantics.
- Persistence and solver inputs/outputs will reference this model later.
- No validity engine / scoring implementation in DND-1.2.
