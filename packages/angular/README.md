# `@dndgem/angular`

Thin Angular adapter for **DnDGem** by **DA62**. Layout solving stays in `@dndgem/core`; measurement, drag, and style application stay in `@dndgem/dom`.

## Install (Public Alpha)

Published version: **`0.1.0-alpha.4`** on npm `@alpha`.

```bash
npm install @dndgem/angular@alpha
```

Always use `@alpha`. Feedback: `support@dndgem.dev`.

## Start here

- Website: https://dndgem.dev
- Support: https://dndgem.dev/support/
- Playground: https://playground.dndgem.dev/
- Guide: [docs/guides/angular.md](../../docs/guides/angular.md)

```ts
import { DNDGEM_BOARD_IMPORTS, type DnDGemItemConfig } from '@dndgem/angular';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  imports: [...DNDGEM_BOARD_IMPORTS],
  template: `
    <div
      class="board"
      dndgemBoard
      dndgemContainer
      #board="dndgemBoard"
      [dndgemItems]="items"
      [dndgemDesiredPlacements]="desired"
    >
      <article dndgemItem="revenue">Revenue</article>
      <p>{{ board.ready() ? board.state()?.solver.evaluation.state : '…' }}</p>
    </div>
  `,
})
export class App {
  readonly items: readonly DnDGemItemConfig[] = [
    { id: 'revenue', constraints: { minWidth: 96, preferredWidth: 180 } },
  ];
  readonly desired = { revenue: { x: 12, y: 12, width: 180, height: 88 } };
}
```

The container must be a positioned containing block (`relative` is enough). Destroying the board host disposes the shared DOM session. Layout inline styles are not restored. Importing this package does not require `window`; `createLayoutSession` runs only after real host elements exist (not full SSR/hydration). **Angular Universal is not validated**.

Keyboard drag is **DEFERRED**. Pointer drag and Escape cancel are supported.

`@angular/core` is a peer dependency (`^20 || ^21 || ^22`). Zone.js is **not** required; the adapter updates Angular signals from session callbacks.

License: MIT.
