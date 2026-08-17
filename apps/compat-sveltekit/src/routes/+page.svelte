<script lang="ts">
  import { DnDGemProvider, type DnDGemItemConfig } from '@dndgem/svelte';
  import type { LayoutSessionState } from '@dndgem/svelte';
  import { createCountingResizeObserver, ensureProbe } from '$lib/probe';

  const ITEMS: readonly DnDGemItemConfig[] = [
    {
      id: 'revenue',
      constraints: {
        minWidth: 96,
        minHeight: 64,
        minUsefulWidth: 140,
        minUsefulHeight: 72,
        preferredWidth: 180,
        preferredHeight: 88,
      },
    },
    {
      id: 'expenses',
      constraints: {
        minWidth: 96,
        minHeight: 64,
        minUsefulWidth: 140,
        minUsefulHeight: 72,
        preferredWidth: 180,
        preferredHeight: 88,
      },
    },
  ];

  const DESIRED = {
    revenue: { x: 12, y: 12, width: 180, height: 88 },
  };

  const CountingResizeObserver = createCountingResizeObserver();

  function onChange(state: LayoutSessionState): void {
    const probe = ensureProbe();
    probe.ready = true;
    probe.phase = state.phase;
    probe.validity = state.solver.evaluation.state;
    probe.lastDropAccepted = state.lastDrop?.accepted;
    probe.spaceWidth = state.resolved.space.width;
    probe.proposalUnplaced = state.autoLayout?.proposalUnplacedItemIds.length;
  }

  function onCancel(): void {
    const probe = ensureProbe();
    probe.cancelCount += 1;
  }
</script>

<svelte:head>
  <title>DnDGem SvelteKit Compat</title>
</svelte:head>

<DnDGemProvider
  items={ITEMS}
  desiredPlacements={DESIRED}
  autoLayout={true}
  ResizeObserver={CountingResizeObserver}
  {onChange}
  {onCancel}
>
  {#snippet children({ dndgemContainer, dndgemItem, state: layoutState, ready })}
    {@const snapshot = layoutState}
    {@const status = snapshot
      ? `${snapshot.solver.evaluation.state} · ${snapshot.phase}${
          snapshot.autoLayout
            ? ` · auto proposal unresolved: ${snapshot.autoLayout.proposalUnplacedItemIds.length}`
            : ''
        }`
      : 'starting'}
    <main>
      <h1>DnDGem SvelteKit Compat</h1>
      <p>
        SvelteKit route over <code>@dndgem/svelte</code>. Session starts after client mount.
      </p>
      <p data-testid="status">{ready ? status : 'starting'}</p>
      <div class="board" data-testid="board" use:dndgemContainer>
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <article
          class="item revenue"
          data-testid="item-revenue"
          aria-label="Revenue"
          tabindex="0"
          use:dndgemItem={'revenue'}
        >
          <h2>Revenue</h2>
          <p>Explicit Source Intent</p>
          <button type="button" data-testid="item-revenue-action">Details</button>
        </article>
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <article
          class="item expenses"
          data-testid="item-expenses"
          aria-label="Expenses"
          tabindex="0"
          use:dndgemItem={'expenses'}
        >
          <h2>Expenses</h2>
          <p>Auto-Layout generated</p>
        </article>
      </div>
    </main>
  {/snippet}
</DnDGemProvider>
