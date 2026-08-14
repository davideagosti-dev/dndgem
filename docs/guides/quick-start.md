# Quick Start

Goal: reach a **first working DnDGem layout** as a React developer in about **10–15 minutes** once packages are available to your app.

Primary path: **React** via `@dndgem/react` (thin adapter over `@dndgem/dom` → `@dndgem/core`).

```text
@dndgem/core      renderer-agnostic constraints, validity, solver
      ▲
@dndgem/dom       measurement, resize, drag, layout session
      ▲
@dndgem/react     React provider + hooks
```

For Vanilla DOM, use the [Vanilla guide](./vanilla.md) (`createLayoutSession`).

## 1. Choose packages

| App type | Depend on                                        |
| -------- | ------------------------------------------------ |
| React    | `@dndgem/react` (pulls `dom` + `core`)           |
| Vanilla  | `@dndgem/dom` (+ `@dndgem/core` types as needed) |

See [Packages](./packages.md).

## 2. Install (current vs future)

### Current — monorepo / local validation

From this repository:

```bash
pnpm install
pnpm build
pnpm --filter @dndgem/example-react dev
```

The React example under `examples/react` is the validated Quick Start companion.

### Public Alpha installation — available after DND-2.5

```bash
# Not published yet — do not expect this to work today
npm install @dndgem/react@alpha
```

Until DND-2.5, consume packages from the workspace (or packed tarballs via `pnpm test:pack`).

## 3. Minimal React board

```tsx
import { DnDGemProvider, useDnDGem, useDnDGemContainer, useDnDGemItem } from '@dndgem/react';

const ITEMS = [
  {
    id: 'revenue',
    constraints: {
      minWidth: 96,
      minHeight: 64,
      minUsefulWidth: 140,
      preferredWidth: 180,
      preferredHeight: 88,
    },
  },
  {
    id: 'cashflow',
    constraints: {
      minWidth: 160,
      minHeight: 96,
      minUsefulWidth: 220,
      minUsefulHeight: 120,
      preferredWidth: 280,
      preferredHeight: 160,
    },
  },
] as const;

const DESIRED = {
  revenue: { x: 12, y: 12, width: 180, height: 88 },
  cashflow: { x: 204, y: 12, width: 280, height: 160 },
};

function Board() {
  const containerRef = useDnDGemContainer();
  const { state, ready } = useDnDGem();
  const revenue = useDnDGemItem('revenue');
  const cashflow = useDnDGemItem('cashflow');

  return (
    <main>
      <p>{ready && state ? `${state.solver.evaluation.state} · ${state.phase}` : 'measuring…'}</p>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: 520,
          height: 280,
          resize: 'both',
          overflow: 'hidden',
        }}
      >
        <article
          ref={revenue.ref}
          style={{ background: '#2f6f5e', color: '#fff', ...revenue.style }}
        >
          Revenue
        </article>
        <article
          ref={cashflow.ref}
          style={{ background: '#3d5a80', color: '#fff', ...cashflow.style }}
        >
          Cash Flow
        </article>
      </div>
    </main>
  );
}

export function App() {
  return (
    <DnDGemProvider items={ITEMS} desiredPlacements={DESIRED}>
      <Board />
    </DnDGemProvider>
  );
}
```

### Rules that make this work

1. Wrap the board in `DnDGemProvider` with `items` and `desiredPlacements`.
2. Attach `useDnDGemContainer()` to a **positioned** containing block (`position: relative` is enough).
3. For each item id, call `useDnDGemItem(id)` and merge `…item.style` **after** your visual styles so DnDGem owns `left` / `top` / `width` / `height`.
4. Mount on the client (browser). Importing `@dndgem/react` is safe without `window`; rendering the provider is not a full SSR path.
5. Unmounting the provider disposes the session (ResizeObserver + drag bindings).

## 4. What you should see

- Items absolutely positioned from the resolved layout
- Status text showing `VALID` (or `DEGRADED` if you shrink the board past usefulness thresholds)
- Pointer drag that proposes a new layout through the Core solver
- Resize of the container triggering measurement → reflow

## 5. Next

| Topic                       | Guide                                            |
| --------------------------- | ------------------------------------------------ |
| Mental model                | [Core Concepts](./core-concepts.md)              |
| Constraints / VALID states  | [Constraints](./constraints.md)                  |
| Full React API              | [React Guide](./react.md)                        |
| Vanilla path                | [Vanilla Guide](./vanilla.md)                    |
| Drag vs resize / `previous` | [Drag, Resize & Reflow](./drag-resize-reflow.md) |
| Validated dashboard example | `examples/react`                                 |

## Validation

This Quick Start mirrors the public API used by `examples/react`, which typechecks and builds in the local quality gate (`pnpm --filter @dndgem/example-react build`).
