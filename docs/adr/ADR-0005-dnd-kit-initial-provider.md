# ADR-0005: dnd-kit Initial Provider

- **Status:** Accepted (installed as internal `@dndgem/dom` implementation detail in DND-1.6)
- **Date:** 2026-08-12
- **Sprint:** Recorded in DND-1.1; runtime integration in DND-1.6

## Context

Phase 0 selected an initial web DnD provider to avoid building a custom native engine in Phase 1.

## Decision

Initial planned web provider: `@dnd-kit/dom`.

Status for DND-1.6:

- Installed only on `@dndgem/dom` as `@dnd-kit/dom` 0.5.0.
- Treated as an internal implementation detail behind `createDragInteraction`.
- Never exposed through DnDGem public types.
- Controlled upgrades, contract tests, and rollback must remain possible.

See ADR-0012.

## Consequences

- No custom native DnD engine in Phase 1.
- Core remains free of dnd-kit forever.
- `@dndgem/dom` may depend on `@dnd-kit/dom`; public types must not.
