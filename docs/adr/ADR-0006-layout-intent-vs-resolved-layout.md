# ADR-0006: Layout Intent vs Resolved Layout

- **Status:** Accepted (foundational types established in DND-1.2; persistence I/O deferred)
- **Date:** 2026-08-12
- **Sprint:** Decision recorded in DND-1.1; Core types in DND-1.2

## Context

Authors express desired layout structure; the engine may adapt positions/sizes to preserve content validity. Confusing intent with resolved output breaks persistence and debugging.

## Decision

Separate:

1. **Layout intent** — author/desired structure and constraints (`LayoutIntent`).
2. **Resolved layout** — deterministic output after validation/solving/reflow (`ResolvedLayout`).

Saved formats must eventually include `schemaVersion` because layouts may be persisted outside DnDGem. DND-1.2 introduces `LAYOUT_SCHEMA_VERSION` on these shapes; persistence I/O remains deferred.

See `docs/architecture/core-domain.md`.

## Consequences

- APIs and persistence should distinguish intent from resolved state.
- No persistence implementation in DND-1.2; solvers must not treat intent as resolved output.
