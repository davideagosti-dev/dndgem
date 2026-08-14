# `@dndgem/react`

Thin React adapter for **DnDGem** by **FinGem-AI**. Layout solving stays in `@dndgem/core`; measurement, drag, and style application stay in `@dndgem/dom`.

## Start here

- Guide: repository `docs/guides/react.md` and `docs/guides/quick-start.md`
- Alpha contract: `docs/architecture/alpha-api-contract.md`
- Example: `examples/react`

Public Alpha version: **`0.1.0-alpha.0`** (npm dist-tag `alpha`).

```bash
npm install @dndgem/react@alpha
```

Feedback: `support@fingem-ai.com`. Playground: https://dndgem-playground.pages.dev/

```tsx
import { DnDGemProvider, useDnDGem, useDnDGemContainer, useDnDGemItem } from '@dndgem/react';

function Board() {
  const containerRef = useDnDGemContainer();
  const { state } = useDnDGem();
  const revenue = useDnDGemItem('revenue');

  return (
    <div ref={containerRef} className="board" style={{ position: 'relative' }}>
      <article ref={revenue.ref} style={{ background: 'var(--card)', ...revenue.style }}>
        Revenue
      </article>
      <p>{state?.solver.evaluation.state}</p>
    </div>
  );
}

export function App() {
  return (
    <DnDGemProvider
      items={[{ id: 'revenue', constraints: { minWidth: 96, preferredWidth: 180 } }]}
      desiredPlacements={{ revenue: { x: 8, y: 8, width: 180, height: 80 } }}
    >
      <Board />
    </DnDGemProvider>
  );
}
```

The container must be a positioned containing block (`relative` is enough). Items receive `position: absolute` plus `left` / `top` / `width` / `height` from the resolved layout. Merge `item.style` after consumer visual styles so DnDGem owns the layout properties.

Unmounting the provider disposes the shared DOM session. Layout inline styles are not restored. Importing this package does not require `window`; rendering `DnDGemProvider` is a client-side mount (not full SSR/hydration).

Keyboard drag is **DEFERRED** for Public Alpha. Pointer drag and Escape cancel are supported. See repository `docs/guides/accessibility.md`.

`react` is a peer dependency (`^18 || ^19`). This package does not import `react-dom`; applications that render still provide it themselves.

License: MIT.
