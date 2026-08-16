# DOM Adapter

Authoritative semantics for `@dndgem/dom` measurement, resize observation (DND-1.5), vendor-isolated drag interaction (DND-1.6), and Vanilla layout session / geometry application (DND-1.7).

Related: [ADR-0001](../adr/ADR-0001-renderer-agnostic-core.md), [ADR-0004](../adr/ADR-0004-interaction-provider-boundary.md), [ADR-0005](../adr/ADR-0005-dnd-kit-initial-provider.md), [ADR-0011](../adr/ADR-0011-dom-measurement-resize.md), [ADR-0012](../adr/ADR-0012-vendor-isolated-drag-interaction.md), [ADR-0013](../adr/ADR-0013-react-vanilla-integration-boundary.md), [core-domain.md](./core-domain.md).

## Responsibility

```text
Browser / DOM
    ↓
@dndgem/dom
measurement, normalization, resize observation, drag mechanics adaptation
    ↓
renderer-neutral geometry + LayoutIntent proposals
    ↓
@dndgem/core
validity, scoring, solver, reflow
```

Core never reads the DOM. Measurement never writes layout styles. Interaction composes with `solveLayout`; it does not rank layouts or expose the drag provider. DND-1.7 `createLayoutSession` applies resolved geometry and is the Vanilla consumer entry. React wraps that session.

## Public entry points

| API                                              | Role                                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `measureLayout`                                  | One-shot read: container + item map → `DomMeasurementSnapshot`                              |
| `observeLayout`                                  | Initial snapshot + `ResizeObserver` updates; `measure()` / `dispose()`                      |
| `createDragInteraction`                          | Pointer mechanics → container-relative `LayoutIntent` proposal → Core solve → accept/reject |
| `createLayoutSession`                            | Vanilla orchestration: measure → solve → apply; drag preview/drop/cancel; idle resize       |
| `layoutPlacementStyle` / `applyLayoutPlacements` | `ResolvedLayout` Rect → absolute border-box `left/top/width/height`                         |
| `DomAdapterError`                                | Adapter usage / environment failures (not Core `DomainError` or solver `UNSATISFIABLE`)     |

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

Measurement composition (owned by the consumer):

```text
measureLayout({ container, items })
  → snapshot.space + snapshot.measurements
  → createLayoutIntent({ space, items: [... measuredSize ...], desiredPlacements? })
  → solveLayout({ intent }) / evaluateLayout(intent, resolved)
```

## Drag interaction (DND-1.6)

```text
browser pointer / keyboard sensors (provider)
        ↓
createDragInteraction (DnDGem-owned)
        ↓
container-relative proposed Rect + LayoutIntent.desiredPlacements
        ↓
solveLayout({ intent })
        ↓
accepted VALID/DEGRADED  |  rejected INVALID/UNSATISFIABLE
```

`createDragInteraction` maps `ItemId` strings to elements. Provider identifiers are not canonical Core ids. Unknown ids throw `DomAdapterError` (`UNKNOWN_ITEM`) and never become new Core items.

### Coordinates

Provider translation (`operation.transform`) is cumulative client-space CSS pixels. Combined with the drag-start ADR-0011 baseline:

```text
proposed.x = baseline.x + translation.x
proposed.y = baseline.y + translation.y
```

Width/height come from the start baseline, not live transformed boxes. Fractions are preserved.

### Measurement during interaction

`observeLayout` supplies the authoritative snapshot. Moves do not re-query geometry. A ResizeObserver emission during drag updates `intent.space` from the latest snapshot and re-runs the current proposal; the active item’s start baseline is not replaced.

### Solver and drop

Each proposal seeds sibling `desiredPlacements` from the last committed resolved layout first (then original intent desired, then snapshot) and overlays the dragged item. Core is invoked as `solveLayout({ intent })` **without** `previous`.

ADR-0010 would otherwise keep the last commit: `preserve-previous` has stability distance 0 and outranks an equally valid `preserve-desired` that holds the new drag placement. Sibling stability is the seeded desired placements, not Core `previous`. Preview during move uses the same path.

- `VALID` / `DEGRADED` → accept; new intent + `solver.resolved` become authoritative
- `INVALID` / `UNSATISFIABLE` → reject; previous intent/resolved preserved; solver result still returned
- Cancel → discard proposal; commit nothing; return idle
- Unsatisfiable is a solver condition, not `DomAdapterError` / `DomainError`

Caller-owned `LayoutIntent` / `ResolvedLayout` objects are never mutated. Interaction does not write final layout styles; `createLayoutSession` does (DND-1.7).

### Provider isolation

`@dnd-kit/dom` is the default internal adapter (pointer + keyboard sensors, Accessibility plugin). Public types do not mention it. Optional `mechanics` replaces the provider. Provider collision detection is targeting mechanics only.

### Accessibility status

Pointer drag and Escape cancel are Alpha-supported across Chromium / Firefox / WebKit. The internal provider may enable keyboard sensors and ARIA plugins by default; those remain **provider capabilities**, not a DnDGem-productized keyboard or screen-reader drag path. DnDGem does not overwrite consumer `aria-*` / `tabIndex` in its apply/binding path. See [Accessibility](../guides/accessibility.md).

### Cleanup

`dispose()` is idempotent: provider destroy, observer disconnect, dropped element refs, no further callbacks. `getState()` after dispose throws `INTERACTION_DISPOSED`.

## Layout session (DND-1.7)

```text
createLayoutSession
  → measure + solveLayout
  → applyLayoutPlacements
  → createDragInteraction
        ↓
  proposal preview (skip active item)
  accepted drop → commit + apply
  rejected drop / cancel → restore committed
  idle resize → solveLayout({ intent, previous }) → apply if changed
```

Positioning model:

- Container: positioned containing block (`relative` if it was `static`)
- Items: `position: absolute; box-sizing: border-box; left; top; width; height`
- Values are CSS pixels matching Core `Rect`
- Committed layout does not use `transform` (the drag provider may transform the active item during a drag)
- Library styles do not set colors, fonts, or z-index

Idle resize and constraint-driven session recreation may pass Core `previous` for ADR-0010 stability. Drag proposals and **explicit new `desiredPlacements`** do **not**. Passing `previous` while also supplying a new equally-valid desired placement lets `preserve-previous` win (the DND-1.6 class of bug).

### Opt-in Auto-Layout (DND-3.4)

`createLayoutSession({ autoLayout?: boolean })` — default / omitted = off (explicit-only path unchanged).

When `autoLayout: true`:

- `desiredPlacements` may be partial or absent (Source Intent); Core `createAutoLayoutProposal` fills the rest before `solveLayout`
- Session retains Source Intent separately from generated placements
- Accepted drag promotes **only** the active item to Source Intent (strong persistent intent — not a pin)
- `LayoutSessionState.autoLayout` is `{ enabled: true; proposalUnplacedItemIds }` (proposal completeness ≠ solver INVALID; ≠ final placement absence)
- Passive resize may pass `previous` as stability input only — never as Source Intent

Available on published npm `@alpha` (`0.1.0-alpha.1`). React mirrors it via `DnDGemProvider` prop `autoLayout?: boolean`.

`dispose()` disconnects interaction and observers and is idempotent. Layout-related inline styles are left in place; the consumer resets them if a pre-session look is required. Unrelated visual styles (color, font, z-index, …) are never written by the library.

React (`@dndgem/react`) wraps this session. It does not add a second ResizeObserver or a second solver. Importing the React package is SSR-safe; rendering the provider requires a client-side mount.

## Explicit non-goals

- Vue / Angular / Svelte / Flutter adapters
- Animation / spring / FLIP engines
- Custom native DnD engine; leaking dnd-kit types
- `MutationObserver`, auto child discovery, `querySelector` scanning
- AI, cloud, claiming production-ready or fully accessible drag
