# ADR-0002: Content Constraint Validity Model

- **Status:** Accepted (constraint types in DND-1.2; validity engine in DND-1.3)
- **Date:** 2026-08-12
- **Sprint:** Decision recorded in DND-1.1; constraint domain in DND-1.2; evaluation in DND-1.3

## Context

DnDGem’s differentiator is content-aware layout validity, not free-form drag alone. Layouts must be judged against content constraints.

## Decision

Layouts are evaluated against content constraints producing validity states (`VALID` / `DEGRADED` / `INVALID`) plus scoring.

- **DND-1.2:** constraint domain types and `ValidityState` vocabulary (no evaluation).
- **DND-1.3:** validity engine, scoring, and degradation algorithms (`evaluateItemPlacement`, `evaluateLayout`). Scoring convention: [ADR-0009](./ADR-0009-validity-scoring-convention.md).

See `docs/architecture/core-domain.md`.

## Consequences

- Interaction and rendering must not invent independent validity semantics.
- Persistence and solver inputs/outputs will reference this model later.
- Evaluation is pure and deterministic; it does not generate or optimize placements (DND-1.4).
