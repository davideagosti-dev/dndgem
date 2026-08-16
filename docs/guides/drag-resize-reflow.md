# Drag, Resize & Reflow

## Mental model

```text
DRAG   = explicit user intent
RESIZE = environmental change
```

Both paths measure/solve/apply through the same Core solver. They differ in how **previous-layout stability** is used.

## Explicit intent wins

Invariant:

```text
EXPLICIT USER INTENT
WINS OVER
STALE PREVIOUS-LAYOUT STABILITY
```

| Situation                     | Core `previous`     |
| ----------------------------- | ------------------- |
| Explicit drag intent          | **omitted**         |
| Explicit `desiredPlacements`  | **omitted**         |
| Passive resize / idle reflow  | **may be supplied** |
| Constraints-only continuation | **may be supplied** |

Why drag does not always reuse the previous layout: a new explicit placement must not be silently defeated by stability that prefers the old geometry.

## Previous-layout stability

When `previous` **is** supplied (passive resize / continuation), the solver can prefer candidates that reduce unnecessary movement and preserve spatial continuity — while still respecting constraints and validity.

Stability never authorizes ignoring a newly supplied desired placement or drag proposal.

## Resize / reflow loop

```text
container size changes
        ↓
ResizeObserver / measurement snapshot
        ↓
new LayoutIntent (updated space)
        ↓
solveLayout (previous may be supplied)
        ↓
apply placements
```

There is **no** animation framework in Alpha. Placements update as geometry.

## Drag loop

```text
pointer drag
        ↓
normalized DragProposal (LayoutIntent)
        ↓
solveLayout (previous omitted)
        ↓
preview / accept / reject / cancel
```

- Accepted drop commits the new resolved layout
- Rejected drop preserves the previous committed layout
- Cancel restores the committed layout

Pointer drag is the validated Alpha path (Chromium / Firefox / WebKit). Full keyboard drag is **DEFERRED** — see [Accessibility](./accessibility.md). Escape cancellation during an active pointer drag is supported.

## React / Vanilla behavior

Both adapters implement the invariant above through `createLayoutSession` / `DnDGemProvider`. Application code should not pass `previous` when pushing a new `desiredPlacements` map.

## Opt-in Auto-Layout (repository / next Alpha)

Published npm `0.1.0-alpha.0` does **not** include Auto-Layout. With repository / next Alpha `autoLayout: true` (DOM) or `autoLayout` on `DnDGemProvider`:

| Path           | Behavior                                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Drag accept    | Promotes **only** the active item to Source Intent (strong persistent intent — not a pin). Sibling generated placements stay generated. |
| Passive resize | May supply `previous` for stability; previous is never Source Intent. Core proposal may retain or reflow automatic items.               |
| Partial intent | `desiredPlacements` may be incomplete; automatic items fill via `createAutoLayoutProposal` → `solveLayout`.                             |

Default remains explicit-only (Auto-Layout off). See [Vanilla](./vanilla.md) / [React](./react.md).

## Related

- [Core Concepts](./core-concepts.md)
- [Constraints](./constraints.md)
- [Alpha API Contract — explicit intent](../architecture/alpha-api-contract.md#explicit-intent-invariant)
