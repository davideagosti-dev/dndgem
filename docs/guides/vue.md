# Vue Guide

`@dndgem/vue` is a **thin lifecycle adapter** over `@dndgem/dom` `createLayoutSession`. Solver semantics stay in `@dndgem/core`. Vue adds no layout, Auto-Layout, provenance, or drag policy of its own.

## Publication status

Public Alpha **`0.1.0-alpha.4`** on npm dist-tag **`alpha`**.

```bash
npm install @dndgem/vue@alpha
```

## Public API

| Export               | Role                                              |
| -------------------- | ------------------------------------------------- |
| `DnDGemProvider`     | Renderless board owner; one `createLayoutSession` |
| `useDnDGemContainer` | Function ref for the positioned container         |
| `useDnDGemItem`      | `{ ref, style }` for one item id                  |
| `useDnDGem`          | `{ state, ready }` session snapshot (Vue refs)    |

All three composables throw if used outside `DnDGemProvider`.

Internal provide/inject keys are **not** public API.

`DnDGemProvider` is a renderless component: it provides board scope and renders the default slot with **no wrapper DOM**. Multiple independent boards on one page are supported (one provider per board). There is no global Vue plugin.

## Vue version

Peer: **`vue@^3.5.0`**. Vue 3 Composition API + TypeScript only. Vue 2 is not supported.

`^3.5.0` matches current Vue 3 TypeScript/`defineComponent` behavior without a Vue 2 compatibility layer.

## Setup

Template (recommended app DX):

```vue
<script setup lang="ts">
import { DnDGemProvider, useDnDGem, useDnDGemContainer, useDnDGemItem } from '@dndgem/vue';

const items = [{ id: 'revenue', constraints: { minWidth: 96, preferredWidth: 180 } }];
const desiredPlacements = { revenue: { x: 12, y: 12, width: 180, height: 88 } };

function Board() {
  const containerRef = useDnDGemContainer();
  const { state, ready } = useDnDGem();
  const revenue = useDnDGemItem('revenue');
  return { containerRef, state, ready, revenue };
}
</script>
```

Workspace example (`examples/vue`) uses the same composables with render functions so it stays on the existing TypeScript/Vite toolchain (no `.vue` SFC compiler in the library package).

```ts
import { DnDGemProvider, useDnDGem, useDnDGemContainer, useDnDGemItem } from '@dndgem/vue';

const Board = defineComponent({
  setup() {
    const containerRef = useDnDGemContainer();
    const { state, ready } = useDnDGem();
    const revenue = useDnDGemItem('revenue');
    return () =>
      h('div', { ref: containerRef, style: { position: 'relative', width: 640, height: 360 } }, [
        h('article', { ref: revenue.ref, style: revenue.style.value }, [
          `Revenue · ${ready.value ? state.value?.solver.evaluation.state : '…'}`,
        ]),
      ]);
  },
});

export const App = defineComponent({
  setup() {
    return () =>
      h(
        DnDGemProvider,
        {
          items: [{ id: 'revenue', constraints: { minWidth: 96, preferredWidth: 180 } }],
          desiredPlacements: { revenue: { x: 12, y: 12, width: 180, height: 88 } },
        },
        { default: () => h(Board) },
      );
  },
});
```

In templates, computed `style` / `ready` unwrap automatically (`:style="revenue.style"`). Render functions read `.value`.

`state` is a `shallowRef` of frozen `LayoutSessionState`. Do not deep-mutate it. Validity remains `VALID` / `DEGRADED` / `INVALID` from Core — Vue does not translate those enums.

### Provider props

| Prop                  | Required | Notes                                                              |
| --------------------- | -------- | ------------------------------------------------------------------ |
| `items`               | yes      | `{ id, constraints? }[]`                                           |
| `desiredPlacements`   | no       | Explicit author placements; omit `previous` semantics when changed |
| `autoLayout`          | no       | Opt-in (`true`); default / omitted = explicit-only (mirrors DOM)   |
| default slot          | yes      | Must register container + items via composables                    |
| `onChange`            | no       | `LayoutSessionState` updates                                       |
| `onDrop` / `onCancel` | no       | Drag outcomes                                                      |
| `mechanics`           | no       | **Advanced / tests** — replace drag mechanics                      |
| `ResizeObserver`      | no       | **Advanced / tests** — inject observer constructor                 |

## Container and item registration

Bind the consumer’s existing nodes. DnDGem does not wrap or replace them.

- Exactly one container per board
- Item ids must match declared `items`
- Registration may happen in any order
- The session starts only when the container **and every declared item** exist
- Unregister on teardown (function ref receives `null`)
- No `querySelector` / `MutationObserver` auto-discovery

## Opt-in Auto-Layout

Default is **off**. Pass `autoLayout: true` for the automatic / hybrid path:

```ts
h(DnDGemProvider, {
  autoLayout: true,
  items: [
    { id: 'revenue', constraints: { minWidth: 96, preferredWidth: 180 } },
    { id: 'cashflow', constraints: { minWidth: 96, preferredWidth: 160 } },
  ],
  desiredPlacements: { revenue: { x: 12, y: 12, width: 180, height: 88 } },
});
```

When Auto-Layout is on:

- `desiredPlacements` may be **partial or absent** (Source Intent)
- Vue must not fabricate missing placements
- Accepted drag promotes **only** the active item to Source Intent (strong persistent intent — not a pin)
- Read `state.autoLayout?.proposalUnplacedItemIds` for Auto-Layout **proposal** completeness

```text
proposalUnplacedItemIds  ≠  solver INVALID
proposal completeness    ≠  “absent from ResolvedLayout”
```

## Optional advisory planner

Pass `planner` / `onPlannerEvent`; call `useDnDGem().replan()`. Shared contract: [Advisory Planner](./advisory-planner.md).

## Session recreation

There is no `session.update()`. Meaningful config changes dispose and recreate the DOM session (same policy as React):

| Change                                                 | Recreate? |
| ------------------------------------------------------ | --------- |
| Declared item set / item constraints                   | yes       |
| `desiredPlacements`                                    | yes       |
| `autoLayout` enablement                                | yes       |
| `mechanics` / `ResizeObserver` identity                | yes       |
| Callback identity (`onChange` / `onDrop` / `onCancel`) | **no**    |

Signatures are JSON snapshots of item ids+constraints and `desiredPlacements`, not Vue deep watchers over proxies. If Vue re-runs the session watcher with the same config and the same host elements, the existing session is kept. Ordinary re-renders and drag `onChange` emissions do not recreate the session.

With Auto-Layout **off**, a `desiredPlacements` change omits Core `previous` so ADR-0010 cannot suppress new author intent. With Auto-Layout **on**, `previous` is kept as a stability signal only.

## Cleanup

Unmount calls `session.dispose()`. Observers and drag bindings are released. Layout inline styles are **not** restored. Returning to the page creates one new session after nodes re-register.

## Style merging

```ts
style: { background: '…', color: '…', ...item.style.value }
```

Put visual styles first; spread `item.style` last so DnDGem owns `position`, `left`, `top`, `width`, `height`, `boxSizing`.

## SSR / client mount

- `import '@dndgem/vue'` is safe without `window` / `document` (package test). Import does not create a session.
- Do **not** call `createLayoutSession` during server render. The provider creates the session only after real HTMLElements exist on the client.
- The component may render before DnDGem is `ready` (empty layout styles are allowed). This is **not** server-side resolved-layout hydration.
- **Nuxt is a validated compatibility environment** for `@dndgem/vue` (no `@dndgem/nuxt`, no Nuxt plugin). Session creation remains client-only. Do not claim server-side layout solving. See [Meta-frameworks](./meta-frameworks.md).

## Accessibility

Preserved Alpha baseline: pointer drag, Escape cancel, consumer `aria-*` / `tabindex` / descendants, no required wrapper, no DOM reorder. Deferred: keyboard drag product, screen-reader drag announcements, mobile/touch, full WCAG.

## Validated example

`examples/vue` — dashboard-scale board with constraints, status (`VALID` / `DEGRADED` / `INVALID`), resize, pointer drag, partial Source Intent, and `proposalUnplacedItemIds`.

```bash
pnpm --filter @dndgem/example-vue dev
```
