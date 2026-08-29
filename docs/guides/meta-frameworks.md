# Meta-framework compatibility

Next.js, Nuxt, and SvelteKit are **compatibility environments** for existing DnDGem adapters. They are not DnDGem packages.

```text
@dndgem/react   → Next.js App Router
@dndgem/vue     → Nuxt
@dndgem/svelte  → SvelteKit
```

There is no `@dndgem/next`, `@dndgem/nuxt`, or `@dndgem/sveltekit`. Validated fixtures live in `apps/compat-next`, `apps/compat-nuxt`, and `apps/compat-sveltekit` (private, unpublished).

Related: [ADR-0017](../adr/ADR-0017-ssr-browser-runtime-boundary.md), [React](./react.md), [Vue](./vue.md), [Svelte](./svelte.md).

## What is validated

Each environment was checked for:

- production build
- server import / server render of the route shell
- **no** DnDGem session on the server
- client hydration
- one client session after mount (`ready`)
- opt-in Auto-Layout with partial Source Intent
- pointer drag, idle resize, Escape cancel
- consumer `aria-label` / `tabindex` / interactive child preservation
- route leave disposes the session; route return creates exactly one new session

## Advisory planner

Optional `planner` / `replan` capability is **inherited through the underlying framework adapter** (`@dndgem/react` / `@dndgem/vue` / `@dndgem/svelte`). Meta-frameworks do not add a dedicated planner runtime. See [Advisory Planner](./advisory-planner.md).

## What is not claimed

- server-side DnDGem layout solving
- server-precomputed geometry
- isomorphic / universal DnD runtime
- every SSR mode or hosting adapter
- Angular Universal (not part of this validation)
- published Vue / Angular / Svelte adapters on npm `@alpha` (`0.1.0-alpha.3`)
- a meta-framework-specific planner implementation beyond adapter pass-through

```text
MODULE IMPORT SAFE  ≠  SERVER-SIDE DNDGEM SESSION
```

Empty layout styles until the client session is `ready` are expected.

## Next.js + `@dndgem/react`

Put `'use client'` on the **DnDGem integration root** (`DnDGemProvider` and the hooks that register hosts). The page and layout may remain Server Components.

```tsx
'use client';

import { DnDGemProvider, useDnDGemContainer, useDnDGemItem } from '@dndgem/react';

function Board() {
  const containerRef = useDnDGemContainer();
  const revenue = useDnDGemItem('revenue');
  return (
    <div ref={containerRef} style={{ position: 'relative', width: 640, height: 360 }}>
      <article ref={revenue.ref} style={revenue.style}>
        Revenue
      </article>
    </div>
  );
}

export function ClientBoard() {
  return (
    <DnDGemProvider
      autoLayout
      items={[{ id: 'revenue' }, { id: 'expenses' }]}
      desiredPlacements={{ revenue: { x: 12, y: 12, width: 180, height: 88 } }}
    >
      <Board />
    </DnDGemProvider>
  );
}
```

The rest of the app does **not** need to be client-only. React Strict Mode is enabled in the Next fixture; production routing still creates one live session.

## Nuxt + `@dndgem/vue`

Use `@dndgem/vue` on the page as a normal Vue component. A Nuxt plugin is **not** required. `<ClientOnly>` is not required when the Vue adapter is import-safe (the session still starts only after real elements exist on the client).

```ts
h(DnDGemProvider, { items, desiredPlacements, autoLayout: true }, { default: () => h(Board) });
```

Navigate with `NuxtLink` so leaving the board route disposes the session.

## SvelteKit + `@dndgem/svelte`

Render `DnDGemProvider` in a route. Markup may SSR; `onMount` plus actions keep `createLayoutSession` on the client. No SvelteKit plugin or adapter package.

Route leave destroys the provider and calls `session.dispose()`. Returning to the board creates one new session after hosts re-register.

## Angular

Angular Universal is **not** validated here. Angular SSR module import-safety is covered by the Angular adapter tests, not by a meta-framework fixture.
