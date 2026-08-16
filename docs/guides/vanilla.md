# Vanilla / DOM Guide

Recommended public path for browser apps without React:

```ts
import { createLayoutSession } from '@dndgem/dom';
```

`createLayoutSession` measures the container, builds Core intent, solves, applies placements, observes resize, and wires pointer drag. Prefer this over assembling advanced primitives yourself.

## Minimal session

```ts
import { createLayoutSession } from '@dndgem/dom';

const container = document.querySelector('#board');
const revenueEl = document.querySelector('#revenue');
if (!(container instanceof HTMLElement) || !(revenueEl instanceof HTMLElement)) {
  throw new Error('Missing nodes');
}

const session = createLayoutSession({
  container,
  items: [
    {
      id: 'revenue',
      element: revenueEl,
      constraints: {
        minWidth: 96,
        minHeight: 64,
        minUsefulWidth: 140,
        preferredWidth: 180,
        preferredHeight: 88,
      },
    },
  ],
  desiredPlacements: {
    revenue: { x: 12, y: 12, width: 180, height: 88 },
  },
  onChange: (state) => {
    console.log(state.solver.evaluation.state, state.phase);
  },
});

// Always dispose when the page/view goes away.
window.addEventListener('pagehide', () => {
  session.dispose();
});
```

Container must be a positioned containing block. Items become absolutely positioned from resolved geometry.

## What the session does

```text
register container + item elements
        ↓
measureLayout (space)
        ↓
solveLayout (Core)
        ↓
apply placements (left/top/width/height)
        ↓
observe resize → reflow (previous may be supplied)
        ↓
pointer drag → proposal intent (previous omitted)
        ↓
dispose → disconnect observers / drag
```

## Session API

| Member       | Role                                      |
| ------------ | ----------------------------------------- |
| `getState()` | Current `LayoutSessionState`              |
| `dispose()`  | Cleanup ResizeObserver, drag, internal UI |

### Useful state fields

- `state.resolved` — placements to understand geometry
- `state.solver.evaluation.state` — `VALID` / `DEGRADED` / `INVALID`
- `state.phase` — drag phase
- `state.proposal` / `state.lastDrop` — interaction outcomes
- `state.autoLayout` — present only when `autoLayout: true` (`enabled` + `proposalUnplacedItemIds`)

## Input notes

| Field               | Notes                                                                |
| ------------------- | -------------------------------------------------------------------- |
| `container`         | Required `HTMLElement`                                               |
| `items`             | Non-empty; unique string ids; each has an `element`                  |
| `desiredPlacements` | Explicit author intent — do not also pass `previous` for that change |
| `previous`          | Optional continuation stability; **omit** for new desired intent     |
| `autoLayout`        | Opt-in (`true`); default / omitted = explicit-only path (unchanged)  |
| `onChange`          | Fired on solve / interaction updates                                 |
| `mechanics`         | Advanced test seam                                                   |
| `ResizeObserver`    | Advanced test / environment injection                                |

## Opt-in Auto-Layout

Available on published npm `@alpha` (`0.1.0-alpha.1`). Default remains off. Set `autoLayout: true`:

```ts
const session = createLayoutSession({
  container,
  items: [/* … */],
  // Partial or omitted Source Intent — remaining items are proposed automatically
  desiredPlacements: {
    revenue: { x: 12, y: 12, width: 180, height: 88 },
  },
  autoLayout: true,
  onChange: (state) => {
    // Proposal completeness (not solver INVALID):
    console.log(state.autoLayout?.proposalUnplacedItemIds);
  },
});
```

When Auto-Layout is on:

- `desiredPlacements` may be **partial or absent** (Source Intent); other items are generated
- Accepted drag promotes **only** the active item to Source Intent (strong persistent intent — not a pin)
- Passive resize may pass `previous` for stability; previous is never Source Intent
- `state.autoLayout` is `{ enabled: true; proposalUnplacedItemIds }` when enabled (proposal completeness only — the solver may still place those ids)

Keep the explicit path (omit `autoLayout` / leave it false) as the default for complete rectangles.

## Advanced DOM APIs (escape hatches)

Supported public primitives — **not** the default app path:

| API                                                                         | Use when                                             |
| --------------------------------------------------------------------------- | ---------------------------------------------------- |
| `measureLayout`                                                             | Custom measurement without the session               |
| `observeLayout`                                                             | Custom resize loop                                   |
| `createDragInteraction`                                                     | Custom drag orchestration                            |
| `applyLayoutPlacements` / `layoutPlacementStyle` / `prepareLayoutContainer` | Manual apply                                         |
| `DragMechanicsAdapter`                                                      | Tests / provider replacement (no dnd-kit types leak) |

Application code should prefer `createLayoutSession`.

## Cleanup

Always call `session.dispose()` when tearing down the view. Dispose does **not** restore pre-session inline styles.

## Validated example

`examples/vanilla`

```bash
pnpm --filter @dndgem/example-vanilla dev
```
