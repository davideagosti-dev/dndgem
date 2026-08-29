# `@dndgem/svelte`

Thin Svelte 5 adapter for **DnDGem** by **DA62**. Layout solving stays in `@dndgem/core`; measurement, drag, and style application stay in `@dndgem/dom`.

## Install (Public Alpha)

Prepared source version: **`0.1.0-alpha.4`**. Current npm `@alpha`: **`0.1.0-alpha.3`** until publication.

```bash
npm install @dndgem/svelte@alpha
```

Always use `@alpha`. Feedback: `support@dndgem.dev`.

## Start here

- Website: https://dndgem.dev
- Support: https://dndgem.dev/support/
- Playground: https://playground.dndgem.dev/
- Guide: [docs/guides/svelte.md](../../docs/guides/svelte.md)

```svelte
<script lang="ts">
  import { DnDGemProvider } from '@dndgem/svelte';

  const items = [{ id: 'revenue', constraints: { minWidth: 96, preferredWidth: 180 } }];
  const desiredPlacements = { revenue: { x: 12, y: 12, width: 180, height: 88 } };
</script>

<DnDGemProvider {items} {desiredPlacements}>
  {#snippet children({ dndgemContainer, dndgemItem, state: layoutState, ready })}
    <div class="board" style="position: relative" use:dndgemContainer>
      <article use:dndgemItem={'revenue'}>Revenue</article>
    </div>
    <p>{ready ? layoutState?.solver.evaluation.state : 'starting'}</p>
  {/snippet}
</DnDGemProvider>
```

`DnDGemProvider` is renderless: it provides board scope and renders the children snippet with **no wrapper DOM**. Host registration uses Svelte actions (`use:dndgemContainer`, `use:dndgemItem={'id'}`). Multiple independent boards on one page are supported (one provider per board).

The container must be a positioned containing block (`relative` is enough). Destroying the provider disposes the shared DOM session. Layout inline styles are not restored. Importing this package does not require `window`; `createLayoutSession` runs only after real host elements exist (not server-side layout solving). **SvelteKit is a validated compatibility environment** (no `@dndgem/sveltekit`; see [meta-frameworks](../../docs/guides/meta-frameworks.md)).

Keyboard drag is **DEFERRED**. Pointer drag and Escape cancel are supported.

`svelte` is a peer dependency (`^5.0.0`). Svelte 4 is not supported.

License: MIT.
