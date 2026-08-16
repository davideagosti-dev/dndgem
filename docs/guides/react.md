# React Guide

`@dndgem/react` is a **thin lifecycle adapter** over `@dndgem/dom` `createLayoutSession`. Solver semantics stay in `@dndgem/core`. DnDGem is not React-specific; React is the first framework adapter.

## Public API

| Export               | Role                                           |
| -------------------- | ---------------------------------------------- |
| `DnDGemProvider`     | Owns the DOM layout session; client mount only |
| `useDnDGemContainer` | Callback ref for the positioned container      |
| `useDnDGemItem`      | `{ ref, style }` for one item id               |
| `useDnDGem`          | `{ state, ready }` session snapshot            |

All three hooks throw if used outside `DnDGemProvider`.

Internal React contexts are **not** public API.

## Setup

```tsx
import { DnDGemProvider, useDnDGem, useDnDGemContainer, useDnDGemItem } from '@dndgem/react';

function Board() {
  const containerRef = useDnDGemContainer();
  const { state, ready } = useDnDGem();
  const revenue = useDnDGemItem('revenue');

  return (
    <div ref={containerRef} style={{ position: 'relative', width: 640, height: 360 }}>
      <article ref={revenue.ref} style={{ ...revenue.style }}>
        Revenue · {ready ? state?.solver.evaluation.state : '…'}
      </article>
    </div>
  );
}

export function App() {
  return (
    <DnDGemProvider
      items={[{ id: 'revenue', constraints: { minWidth: 96, preferredWidth: 180 } }]}
      desiredPlacements={{ revenue: { x: 12, y: 12, width: 180, height: 88 } }}
    >
      <Board />
    </DnDGemProvider>
  );
}
```

### Provider props

| Prop                  | Required | Notes                                                              |
| --------------------- | -------- | ------------------------------------------------------------------ |
| `items`               | yes      | `{ id, constraints? }[]`                                           |
| `desiredPlacements`   | no       | Explicit author placements; omit `previous` semantics when changed |
| `autoLayout`          | no       | Opt-in (`true`); default / omitted = explicit-only (mirrors DOM)   |
| `children`            | yes      | Must register container + items via hooks                          |
| `onChange`            | no       | `LayoutSessionState` updates                                       |
| `onDrop` / `onCancel` | no       | Drag outcomes                                                      |
| `mechanics`           | no       | **Advanced / tests** — replace drag mechanics                      |
| `ResizeObserver`      | no       | **Advanced / tests** — inject observer constructor                 |

## Opt-in Auto-Layout

Available on published npm `@alpha` (`0.1.0-alpha.1`). Pass `autoLayout`:

```tsx
<DnDGemProvider
  autoLayout
  items={[
    { id: 'revenue', constraints: { minWidth: 96, preferredWidth: 180 } },
    { id: 'cashflow', constraints: { minWidth: 96, preferredWidth: 160 } },
  ]}
  // Partial or omitted Source Intent — remaining items are proposed automatically
  desiredPlacements={{ revenue: { x: 12, y: 12, width: 180, height: 88 } }}
>
  <Board />
</DnDGemProvider>
```

When Auto-Layout is on:

- `desiredPlacements` may be **partial or absent** (Source Intent)
- Accepted drag promotes **only** the active item to Source Intent (strong persistent intent — not a pin)
- Passive resize may use previous-layout stability; previous is never Source Intent
- Read `state.autoLayout?.proposalUnplacedItemIds` for Auto-Layout **proposal** completeness (not solver INVALID; not “absent from ResolvedLayout”)

Omit `autoLayout` (or leave it false) to keep the explicit-only path as the default.

## Lifecycle and ownership

1. Provider waits until the container and every configured item element are registered.
2. It creates one `createLayoutSession` and applies resolved placements as absolute geometry.
3. ResizeObserver-driven measurement updates reflow with previous-layout stability when appropriate.
4. Pointer drag proposes new intent **without** reusing stale `previous` (explicit user intent wins). With `autoLayout`, an accepted drop promotes only the active item to Source Intent.
5. Unmount calls `session.dispose()` — observers and drag bindings are released.

Layout inline styles are **not** restored to pre-session values on dispose.

## Style merging

```tsx
style={{ background: '…', color: '…', ...item.style }}
```

Put visual styles first; spread `item.style` last so DnDGem owns `position`, `left`, `top`, `width`, `height`, `boxSizing`.

## SSR / client mount

- `import '@dndgem/react'` is safe without `window` (covered by package tests).
- Rendering `DnDGemProvider` requires a browser DOM (client mount).
- Next.js / Remix are **not** claimed.

## Validated example

`examples/react` — dashboard-scale board with constraints, status (`VALID` / `DEGRADED` / …), resize, and pointer drag.

```bash
pnpm --filter @dndgem/example-react dev
```
