# ADR-0012: Vendor-Isolated Drag Interaction

- **Status:** Accepted
- **Date:** 2026-08-13
- **Sprint:** DND-1.6

## Context

DND-1.5 feeds Core with normalized DOM geometry. DND-1.6 must convert browser drag interaction into author intent without making `@dnd-kit/dom` (or any provider) part of DnDGem’s public language.

Core already owns validity, scoring, candidate generation, ranking, stability, and unsatisfiable results (ADR-0002, ADR-0003, ADR-0009, ADR-0010). LayoutIntent is author/user intent; ResolvedLayout is solver output (ADR-0006). Coordinates are container-relative (ADR-0011). The provider must remain replaceable (ADR-0004, ADR-0005).

## Decision

1. **Ownership:** Drag interaction lives in `@dndgem/dom`. Core remains renderer-agnostic and never imports DOM, pointer events, or `@dnd-kit/*`.
2. **Public seam:** `createDragInteraction` is the DnDGem-owned API (`start` / `proposal` / `drop` / `cancel` / `dispose`). Public types use `ItemId` strings, `Rect`, `Point`, `LayoutIntent`, and `SolverResult`. No dnd-kit classes, events, sensors, or collision types are exported.
3. **Provider:** `@dnd-kit/dom` 0.5.0 is the default internal mechanics adapter. It may be replaced via the optional `mechanics` callback seam without changing public types. Provider collision/hit-testing is interaction targeting only — never Core validity or ranking.
4. **Coordinates:** Provider `operation.transform` is a cumulative client-space translation in the same CSS-pixel space as `getBoundingClientRect()`. DnDGem proposals are:

   ```text
   x = dragStartBaseline.x + translation.x
   y = dragStartBaseline.y + translation.y
   width  = dragStartBaseline.width
   height = dragStartBaseline.height
   ```

   `dragStartBaseline` is the ADR-0011 container-relative item `Rect` from the latest DND-1.5 snapshot **at drag start**. Fractions are preserved. No extra `scrollX`/`scrollY`, padding, or device-pixel conversion.

5. **Measurement:** Interaction consumes `observeLayout` / `measureLayout`. It does not re-read `getBoundingClientRect()` on every move. Resize during drag updates `intent.space` from the latest snapshot but does **not** restamp the active item’s drag-start baseline (live item boxes may include provider transforms).
6. **Solver composition:** Each proposal builds a new `LayoutIntent` whose `desiredPlacements` overlay the dragged item and seed siblings from **previous resolved placements first**, then original intent desired, then the measurement snapshot.

   `solveLayout({ intent })` is called **without** Core `previous`. ADR-0010 ranks validity → score → **stability vs previous** → ordinal. Supplying the last commit as `previous` generates `preserve-previous` with `stabilityDistance = 0`, which beats an equally valid `preserve-desired` that contains the user’s new placement — the drag would be ignored. Sibling stability is instead encoded in `desiredPlacements`, so `preserve-desired` keeps unaffected items at their last committed positions. Packing candidates still compete on validity and score (ADR-0010); they do not override a valid preserve-desired layout merely because they exist.

7. **Drop policy:** `VALID` or `DEGRADED` solver results are accepted (the resolved layout may reflow away from the exact pointer placement). `INVALID` / `UNSATISFIABLE` rejects the commit, preserves the previous authoritative intent and resolved layout, and still surfaces the solver result. Rejection is not `DomainError` or `DomAdapterError`.
8. **Cancel / dispose:** Cancel discards the transient proposal and commits nothing. `dispose()` is idempotent, disconnects the provider and observer, drops retained element references, and ignores later callbacks. `getState()` after dispose throws `DomAdapterError` (`INTERACTION_DISPOSED`).
9. **Accessibility:** The default provider includes `PointerSensor`, `KeyboardSensor`, and an Accessibility plugin. DND-1.6 implements and tests the pointer path. Keyboard/ARIA behaviour is not claimed as a tested DnDGem product path; the public API is not pointer-event-specific so a later keyboard path can attach to the same seam.
10. **Non-goals:** React/vanilla consumer APIs (DND-1.7), applying final layout styles, custom native DnD engines, animation/scheduler frameworks, AI.

## Consequences

- Replacing `@dnd-kit/dom` must not change Core or the public interaction types.
- Future `@dndgem/react` consumes `createDragInteraction` semantics, not dnd-kit hooks.
- Changing coordinate conversion, drop acceptance, or solver composition is an ADR-level change.
