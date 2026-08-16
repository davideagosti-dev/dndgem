# `@dndgem/react`

Thin React adapter for **DnDGem** by **DA62**. Layout solving stays in `@dndgem/core`; measurement, drag, and style application stay in `@dndgem/dom`.

## Start here

- Website: https://dndgem.dev
- Quick Start: https://dndgem.dev/docs/quick-start/
- Support: https://dndgem.dev/support/

Public Alpha version: **`0.1.0-alpha.1`** (official npm dist-tag **`alpha`**).

```bash
npm install @dndgem/react@alpha
```

Always use `@alpha`. Feedback: `support@dndgem.dev`. Playground: https://playground.dndgem.dev/ (provider: https://dndgem-playground.pages.dev/).

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

Keyboard drag is **DEFERRED** for Public Alpha. Pointer drag and Escape cancel are supported.

`react` is a peer dependency (`^18 || ^19`). This package does not import `react-dom`; applications that render still provide it themselves.

License: MIT.
