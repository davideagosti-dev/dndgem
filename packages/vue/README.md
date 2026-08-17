# `@dndgem/vue`

Thin Vue 3 adapter for **DnDGem** by **DA62**. Layout solving stays in `@dndgem/core`; measurement, drag, and style application stay in `@dndgem/dom`.

## Status

```text
IMPLEMENTED IN REPOSITORY
NOT YET PUBLISHED ON NPM
```

This package is the DND-FX.2 Framework Expansion adapter. It is **not** part of the currently published `0.1.0-alpha.1` set (`@dndgem/core`, `@dndgem/dom`, `@dndgem/react`). Do not `npm install @dndgem/vue` from the registry yet. Consume it from this workspace until DND-FX.6.

## Start here

- Website: https://dndgem.dev
- Support: https://dndgem.dev/support/
- Playground: https://playground.dndgem.dev/ (provider: https://dndgem-playground.pages.dev/)
- Feedback: `support@dndgem.dev`

## Workspace install

```bash
pnpm install
pnpm build
pnpm --filter @dndgem/example-vue dev
```

```ts
import { DnDGemProvider, useDnDGem, useDnDGemContainer, useDnDGemItem } from '@dndgem/vue';

const Board = defineComponent({
  setup() {
    const containerRef = useDnDGemContainer();
    const { state } = useDnDGem();
    const revenue = useDnDGemItem('revenue');
    return () =>
      h('div', { ref: containerRef, class: 'board', style: { position: 'relative' } }, [
        h(
          'article',
          { ref: revenue.ref, style: { background: 'var(--card)', ...revenue.style.value } },
          'Revenue',
        ),
        h('p', state.value?.solver.evaluation.state),
      ]);
  },
});
```

Template equivalent: bind `:ref="containerRef"` / `:ref="revenue.ref"` and `:style="revenue.style"` (computed unwraps in templates). Merge `item.style` after consumer visual styles so DnDGem owns layout properties.

The container must be a positioned containing block (`relative` is enough). Unmounting the provider disposes the shared DOM session. Layout inline styles are not restored. Importing this package does not require `window`; rendering `DnDGemProvider` is a client-side mount (not server-side layout solving). **Nuxt is a validated compatibility environment** (no `@dndgem/nuxt`; see [meta-frameworks](../../docs/guides/meta-frameworks.md)).

Keyboard drag is **DEFERRED**. Pointer drag and Escape cancel are supported.

`vue` is a peer dependency (`^3.5.0`). Vue 2 is not supported.

License: MIT.
