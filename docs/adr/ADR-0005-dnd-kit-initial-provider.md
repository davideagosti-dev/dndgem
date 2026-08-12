# ADR-0005: dnd-kit Initial Provider

- **Status:** Accepted (selection approved; dependency deferred)
- **Date:** 2026-08-12
- **Sprint:** Recorded in DND-1.1; runtime integration in DND-1.6

## Context

Phase 0 selected an initial web DnD provider to avoid building a custom native engine in Phase 1.

## Decision

Initial planned web provider: `@dnd-kit/dom`.

Status for DND-1.1:

- Not installed as a runtime dependency.
- Deferred until DND-1.6.
- Treated as an internal implementation detail.
- Never exposed through DnDGem public types.
- Controlled upgrades, contract tests, and rollback must remain possible.

## Consequences

- No custom native DnD engine in Phase 1.
- Core remains free of dnd-kit forever.
- Documentation may reference the planned provider without installing it early.
