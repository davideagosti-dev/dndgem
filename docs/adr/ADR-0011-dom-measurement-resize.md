# ADR-0011: DOM Measurement and Resize Observation

- **Status:** Accepted
- **Date:** 2026-08-13
- **Sprint:** DND-1.5

## Context

DND-1.4 made `solveLayout` real in `@dndgem/core`. DND-1.5 must feed that solver with real browser geometry without leaking DOM types into Core (ADR-0001).

The adapter must define a coordinate convention, box-model convention, resize lifecycle, and snapshot emission policy so later React/vanilla integrations (DND-1.7) can compose measurement → Core solve without collapsing those layers.

## Decision

1. **Ownership:** Browser/DOM APIs (`HTMLElement`, `getBoundingClientRect`, `ResizeObserver`) live only in `@dndgem/dom`. Core continues to own `Size`, `Rect`, `LayoutSpace`, validity, scoring, and solving.
2. **Coordinates:** Container origin is `(0, 0)`. Item `x`/`y` are container-relative differences of `getBoundingClientRect()` left/top. Viewport scroll cancels when both sides use the same client rects; no extra `scrollX`/`scrollY` arithmetic.
3. **Box model:** Measurements are the actual rendered border-box from `getBoundingClientRect()` (CSS pixels, including transforms). Padding/border are not subtracted. Device pixel ratio and zoom are not special-cased.
4. **Fractions and zeros:** Sub-pixel values are preserved (no rounding). `0×0` is a legitimate measurement; Core validity decides `VALID` / `DEGRADED` / `INVALID`.
5. **Missing/disconnected:** A disconnected **container** is an adapter error (`DomAdapterError`). A disconnected **item** is omitted from measurements with structured `unavailable` metadata. Adapter failures are not Core `INVALID`.
6. **Observation:** `observeLayout` measures and emits a synchronous initial snapshot **before** subscribing to `ResizeObserver`, then remeasures current DOM state on any notification. Callback entry order is not layout semantics. Exact duplicate snapshots are suppressed by structural comparison (no timers/debounce).
7. **Lifecycle:** `dispose()` disconnects the observer, drops retained element references, is idempotent, and emits no further callbacks. `measure()` after dispose throws `DomAdapterError` (`OBSERVER_DISPOSED`). `ResizeObserver` is resolved at call time (injectable constructor); missing global observer is a clear adapter error. No module-top-level DOM access.
8. **Composition:** The adapter produces Core geometry. Consumers call `evaluateLayout` / `solveLayout`. The DOM package does not own solver lifecycle, drag/drop, or layout style application.

## Consequences

- Future framework adapters consume `DomMeasurementSnapshot` rather than raw `DOMRect`.
- Changing coordinate origin, box model, or duplicate-emission policy is an ADR-level change.
- MutationObserver, auto-discovery of children, and dnd-kit remain out of this adapter.
