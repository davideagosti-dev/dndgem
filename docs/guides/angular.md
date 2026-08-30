# Angular Guide

`@dndgem/angular` is a **thin lifecycle adapter** over `@dndgem/dom` `createLayoutSession`. Solver semantics stay in `@dndgem/core`. Angular adds no layout, Auto-Layout, provenance, or drag policy of its own.

## Publication status

Public Alpha **`0.1.0-alpha.4`** on npm dist-tag **`alpha`**.

```bash
npm install @dndgem/angular@alpha
```

## Public API

| Export                     | Role                                                              |
| -------------------------- | ----------------------------------------------------------------- |
| `DnDGemBoardDirective`     | Board owner (`[dndgemBoard]`); provides board-local `DnDGemBoard` |
| `DnDGemContainerDirective` | Host binding for the positioned container (`[dndgemContainer]`)   |
| `DnDGemItemDirective`      | Host binding for one item id (`dndgemItem="revenue"`)             |
| `DnDGemBoard`              | Board-scoped injectable; `state` / `ready` signals                |
| `injectDnDGem()`           | Inject `DnDGemBoard`; throws outside `dndgemBoard`                |
| `DNDGEM_BOARD_IMPORTS`     | Convenience standalone import array                               |

Internal DI tokens/helpers besides `DnDGemBoard` are **not** public API.

Directives attach to **consumer-owned** elements. They do not insert wrapper DOM. Multiple independent boards on one page are supported (one `dndgemBoard` per board). There is no `providedIn: 'root'` session.

## Angular version

Peer: **`@angular/core@^20.0.0 \|\| ^21.0.0 \|\| ^22.0.0`**. Standalone / signals / zoneless-compatible. ViewEngine is not supported.

Workspace tests compile and run against **Angular 21** because this monorepo uses TypeScript 5.9. Angular 22’s compiler requires TypeScript 6, which this repository does not use. Partial compilation keeps the shipped library consumable by Angular 20–22 apps.

Zone.js is **not** a required peer. The adapter updates Angular signals from DOM session callbacks.

## Setup

```ts
import { Component } from '@angular/core';
import { DNDGEM_BOARD_IMPORTS, type DnDGemItemConfig } from '@dndgem/angular';

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

`dndgemBoard` and `dndgemContainer` may share the same host. Child components under that host can `inject(DnDGemBoard)` or `injectDnDGem()`.

`state` is a signal of frozen `LayoutSessionState`. Do not deep-mutate it. Validity remains `VALID` / `DEGRADED` / `INVALID` from Core — Angular does not translate those enums.

### Board inputs / outputs

| Binding                       | Required | Notes                                                              |
| ----------------------------- | -------- | ------------------------------------------------------------------ |
| `dndgemItems`                 | yes      | `{ id, constraints? }[]`                                           |
| `dndgemDesiredPlacements`     | no       | Explicit author placements; omit `previous` semantics when changed |
| `dndgemAutoLayout`            | no       | Opt-in (`true`); default / omitted = explicit-only (mirrors DOM)   |
| `dndgemChange`                | no       | `LayoutSessionState` updates                                       |
| `dndgemDrop` / `dndgemCancel` | no       | Drag outcomes                                                      |
| `dndgemMechanics`             | no       | **Advanced / tests** — replace drag mechanics                      |
| `dndgemResizeObserver`        | no       | **Advanced / tests** — inject observer constructor                 |

## Container and item registration

Bind the consumer’s existing nodes. DnDGem does not wrap or replace them.

- Exactly one container per board
- Item ids must match declared `items` (the attribute value, not the component instance)
- Registration may happen in any order
- The session starts only when the container **and every declared item** exist
- Unregister on teardown (`DestroyRef` / directive destroy)
- No `querySelector` / `MutationObserver` auto-discovery

Layout styles are applied by the DOM session to the registered `HTMLElement`s.

## Opt-in Auto-Layout

Default is **off**. Pass `[dndgemAutoLayout]="true"` for the automatic / hybrid path.

When Auto-Layout is on:

- `dndgemDesiredPlacements` may be **partial or absent** (Source Intent)
- Angular must not fabricate missing placements
- Accepted drag promotes **only** the active item to Source Intent (strong persistent intent — not a pin)
- Read `state().autoLayout?.proposalUnplacedItemIds` for Auto-Layout **proposal** completeness

```text
proposalUnplacedItemIds  ≠  solver INVALID
proposal completeness    ≠  “absent from ResolvedLayout”
```

## Optional advisory planner

Pass board `planner` / `onPlannerEvent` or `dndgemPlanner` / `dndgemPlannerEvent`; call `replan()`. Shared contract: [Advisory Planner](./advisory-planner.md).

## Session recreation

There is no `session.update()`. Meaningful config changes dispose and recreate the DOM session (same policy as React/Vue):

| Change                                                      | Recreate? |
| ----------------------------------------------------------- | --------- |
| Declared item set / item constraints                        | yes       |
| `desiredPlacements`                                         | yes       |
| `autoLayout` enablement                                     | yes       |
| `mechanics` / `ResizeObserver` identity                     | yes       |
| Callback / output identity (`dndgemChange` / drop / cancel) | **no**    |

Signatures are JSON snapshots of item ids+constraints and `desiredPlacements`, not deep watchers over mutated objects. Ordinary change detection and drag `onChange` emissions do not recreate the session.

With Auto-Layout **off**, a `desiredPlacements` change omits Core `previous` so ADR-0010 cannot suppress new author intent. With Auto-Layout **on**, `previous` is kept as a stability signal only.

## Cleanup

Board destruction calls `session.dispose()`. Observers and drag bindings are released. Layout inline styles are **not** restored. Returning to the page creates one new session after nodes re-register.

## SSR / client mount

- `import '@dndgem/angular'` is safe without `window` / `document` (package test). Import does not create a session.
- Do **not** call `createLayoutSession` during server render. The board creates the session only after real HTMLElements exist (`afterRenderEffect`).
- The component may render before DnDGem is `ready` (empty layout styles are allowed). This is **not** server-side resolved-layout hydration.
- **Angular Universal is not validated.** DND-FX.5 covers Next.js, Nuxt, and SvelteKit only. Do not claim full SSR or isomorphic geometry hydration.

## Accessibility

Preserved Alpha baseline: pointer drag, Escape cancel, consumer `aria-*` / `tabindex` / descendants, no required wrapper, no DOM reorder. Deferred: keyboard drag product, screen-reader drag announcements, mobile/touch, full WCAG.

## Validated example

`examples/angular` — dashboard-scale board with constraints, status (`VALID` / `DEGRADED` / `INVALID`), resize, pointer drag, partial Source Intent, and `proposalUnplacedItemIds`. Zoneless bootstrap (`provideZonelessChangeDetection`).

```bash
pnpm --filter @dndgem/example-angular dev
```
