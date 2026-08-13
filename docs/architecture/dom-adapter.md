# DOM Adapter

Authoritative semantics for `@dndgem/dom` measurement and resize observation (DND-1.5).

Related: [ADR-0001](../adr/ADR-0001-renderer-agnostic-core.md), [ADR-0011](../adr/ADR-0011-dom-measurement-resize.md), [core-domain.md](./core-domain.md).

## Responsibility

```text
Browser / DOM
    ↓
@dndgem/dom
measurement, normalization, resize observation
    ↓
renderer-neutral geometry (Core Size / Rect / LayoutSpace)
    ↓
@dndgem/core
validity, scoring, solver, reflow
```

Core never reads the DOM. This package never calls `solveLayout` as an owned lifecycle, never writes layout styles, and never implements drag/drop or React bindings.

## Public entry points

| API               | Role                                                                   |
| ----------------- | ---------------------------------------------------------------------- |
| `measureLayout`   | One-shot read: container + item map → `DomMeasurementSnapshot`         |
| `observeLayout`   | Initial snapshot + `ResizeObserver` updates; `measure()` / `dispose()` |
| `DomAdapterError` | Adapter usage / environment failures (not Core `DomainError`)          |

Item identity remains Core `ItemId`. The adapter maps `ItemId` string keys to `HTMLElement` outside Core.

## Coordinate convention

Container origin is `(0, 0)` in layout space.

```text
itemX = itemRect.left - containerRect.left
itemY = itemRect.top  - containerRect.top
```

Both reads use `getBoundingClientRect()`. Equal viewport/scroll shifts cancel. Negative viewport coordinates are allowed; relative `x`/`y` may be negative (Core permits finite negative coordinates). Width/height stay non-negative.

## Box model

Technical MVP uses the **rendered border-box** from `getBoundingClientRect()`:

- Includes borders
- Includes CSS transforms as the actual bounding rectangle
- Does not parse matrices, subtract padding, or convert device pixels

Numeric values are CSS pixels, passed to Core as abstract layout units.

## Measurement cycle

Each `measureLayout` call:

1. Reads the container box **once**
2. Reads each mapped item box **once**
3. Derives `LayoutSpace` and container-relative `Rect`s from those snapshots

The DOM is not mutated. Caller-owned maps and Core objects are not mutated.

## Unavailable items

| Situation                       | Outcome                                               |
| ------------------------------- | ----------------------------------------------------- |
| Missing / invalid container     | `DomAdapterError` (`MISSING_CONTAINER`, …)            |
| Disconnected container          | `DomAdapterError` (`DISCONNECTED_CONTAINER`)          |
| Disconnected mapped item        | Skip; `unavailable: [{ id, reason: 'disconnected' }]` |
| Zero-sized connected item       | Normal measurement (`0×0` is valid)                   |
| Non-finite geometry             | `DomAdapterError` (`NON_FINITE_GEOMETRY`)             |
| Intent item with no DOM element | Consumer omits `measuredSize`; not an adapter error   |

Missing DOM nodes are never classified with Core `INVALID`.

## Resize observation

`observeLayout`:

1. Validates input and resolves `ResizeObserver` (global or injected constructor)
2. Measures and emits a **synchronous initial** snapshot (no resize event required)
3. Subscribes to the container and every mapped item
4. On any observer notification, **remeasures current DOM state** (entry order ignored)
5. Suppresses snapshots that are structurally identical to the last emission (no debounce/timers)
6. `dispose()` disconnects, drops retained element references, is idempotent, and prevents further callbacks. `measure()` after dispose throws `OBSERVER_DISPOSED`.

The same DOM node may be mapped to more than one item id; each id is measured independently. Duplicate `ResizeObserver.observe` of one node is a no-op.

If `ResizeObserver` is missing and no constructor is injected, observation throws `RESIZE_OBSERVER_UNAVAILABLE`. Importing `@dndgem/dom` does not touch `window` / `document` at module load.

## Core integration

Typical composition (owned by the consumer, not this package):

```text
measureLayout({ container, items })
  → snapshot.space + snapshot.measurements
  → createLayoutIntent({ space, items: [... measuredSize ...], desiredPlacements? })
  → solveLayout({ intent }) / evaluateLayout(intent, resolved)
```

## Explicit non-goals (this sprint)

- Drag/drop, pointer sensors, `@dnd-kit/*` (DND-1.6)
- React hooks, refs, components (DND-1.7)
- `MutationObserver`, auto child discovery, `querySelector` scanning
- Applying `element.style.*` / CSS transforms as a product API
- AI, Flutter, cloud
