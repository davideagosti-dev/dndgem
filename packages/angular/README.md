# `@dndgem/angular`

Thin Angular adapter for **DnDGem** by **DA62**. Layout solving stays in `@dndgem/core`; measurement, drag, and style application stay in `@dndgem/dom`.

## Status

```text
IMPLEMENTED IN REPOSITORY
NOT YET PUBLISHED ON NPM
```

This package is the DND-FX.3 Framework Expansion adapter. It is **not** part of the currently published `0.1.0-alpha.1` set (`@dndgem/core`, `@dndgem/dom`, `@dndgem/react`). Do not `npm install @dndgem/angular` from the registry yet. Consume it from this workspace until DND-FX.6.

## Start here

- Website: https://dndgem.dev
- Support: https://dndgem.dev/support/
- Playground: https://playground.dndgem.dev/ (provider: https://dndgem-playground.pages.dev/)
- Feedback: `support@dndgem.dev`

## Workspace install

```bash
pnpm install
pnpm build
pnpm --filter @dndgem/example-angular dev
```

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

The container must be a positioned containing block (`relative` is enough). Destroying the board host disposes the shared DOM session. Layout inline styles are not restored. Importing this package does not require `window`; `createLayoutSession` runs only after real host elements exist (not full SSR/hydration). **Angular Universal is not validated** (DND-FX.5).

Keyboard drag is **DEFERRED**. Pointer drag and Escape cancel are supported.

`@angular/core` is a peer dependency (`^20 || ^21 || ^22`). Zone.js is **not** required; the adapter updates Angular signals from session callbacks.

License: MIT.
