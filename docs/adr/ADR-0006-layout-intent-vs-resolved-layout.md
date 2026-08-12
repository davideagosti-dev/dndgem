# ADR-0006: Layout Intent vs Resolved Layout

- **Status:** Accepted (concept approved; schema deferred)
- **Date:** 2026-08-12
- **Sprint:** Decision recorded in DND-1.1; types in later Phase 1 sprints

## Context

Authors express desired layout structure; the engine may adapt positions/sizes to preserve content validity. Confusing intent with resolved output breaks persistence and debugging.

## Decision

Separate:

1. **Layout intent** — author/desired structure and constraints.
2. **Resolved layout** — deterministic output after validation/solving/reflow.

Saved formats must eventually include `schemaVersion` because layouts may be persisted outside DnDGem.

## Consequences

- APIs and persistence should distinguish intent from resolved state.
- No persistence implementation or final schema in DND-1.1.
