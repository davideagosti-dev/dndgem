# `@dndgem/react`

Thin React adapter for DnDGem. Layout solving stays in `@dndgem/core`; measurement, drag, and style application stay in `@dndgem/dom`.

```tsx
import { DnDGemProvider, useDnDGem, useDnDGemContainer, useDnDGemItem } from '@dndgem/react';

function Board() {
  const containerRef = useDnDGemContainer();
  const { state } = useDnDGem();
  const chart = useDnDGemItem('chart');

  return (
    <div ref={containerRef} className="board">
      <article ref={chart.ref} style={{ background: 'var(--card)', ...chart.style }}>
        Chart
      </article>
      <p>{state?.solver.evaluation.state}</p>
    </div>
  );
}

export function App() {
  return (
    <DnDGemProvider
      items={[{ id: 'chart', constraints: { minWidth: 120, preferredWidth: 240 } }]}
      desiredPlacements={{ chart: { x: 8, y: 8, width: 240, height: 80 } }}
    >
      <Board />
    </DnDGemProvider>
  );
}
```

The container must be a positioned containing block (`relative` is enough). Items receive `position: absolute` plus `left` / `top` / `width` / `height` from the resolved layout. Merge `item.style` after consumer visual styles so DnDGem owns the layout properties.

Unmounting the provider disposes the shared DOM session. Layout inline styles are not restored. Importing this package does not require `window`; rendering `DnDGemProvider` is a client-side mount (not full SSR/hydration).

Keyboard drag is not a product-validated path yet. Pointer drag is.
