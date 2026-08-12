# ADR-0002: Content Constraint Validity Model

- **Status:** Accepted (model approved; implementation deferred)
- **Date:** 2026-08-12
- **Sprint:** Decision recorded in DND-1.1; implementation starts DND-1.2 / DND-1.3

## Context

DnDGem’s differentiator is content-aware layout validity, not free-form drag alone. Layouts must be judged against content constraints.

## Decision

Layouts are evaluated against content constraints producing validity states (planned: `VALID` / `DEGRADED` / `INVALID`) plus scoring. Exact types and algorithms are defined in DND-1.2–1.3.

## Consequences

- Interaction and rendering must not invent independent validity semantics.
- Persistence and solver inputs/outputs will reference this model later.
- No validity engine code in DND-1.1.
