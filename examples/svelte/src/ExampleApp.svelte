<script lang="ts">
  import { DnDGemProvider, type DnDGemItemConfig } from '@dndgem/svelte';
  import type { LayoutSessionState } from '@dndgem/svelte';

  /**
   * Representative dashboard board: heterogeneous content needs.
   * Shrink the board to observe VALID → DEGRADED when minUseful* is missed.
   */
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
    {
      id: 'cashflow',
      constraints: {
        minWidth: 160,
        minHeight: 96,
        minUsefulWidth: 220,
        minUsefulHeight: 120,
        preferredWidth: 280,
        preferredHeight: 160,
      },
    },
    {
      id: 'transactions',
      constraints: {
        minWidth: 180,
        minHeight: 120,
        minUsefulWidth: 240,
        minUsefulHeight: 160,
        preferredWidth: 300,
        preferredHeight: 200,
      },
    },
    {
      id: 'alerts',
      constraints: {
        minWidth: 72,
        minHeight: 64,
        minUsefulWidth: 96,
        minUsefulHeight: 72,
        preferredWidth: 120,
        preferredHeight: 80,
      },
    },
    {
      id: 'notes',
      constraints: {
        minWidth: 100,
        minHeight: 80,
        minUsefulWidth: 140,
        minUsefulHeight: 100,
        preferredWidth: 200,
        preferredHeight: 140,
      },
    },
  ];

  const DESIRED = {
    // Partial Source Intent — remaining cards are Auto-Layout generated (opt-in).
    revenue: { x: 12, y: 12, width: 180, height: 88 },
  };

  const COPY: Record<string, { title: string; body: string; className: string }> = {
    revenue: {
      title: 'Revenue',
      body: 'KPI · compact OK · useful ≥ 140',
      className: 'item revenue',
    },
    expenses: {
      title: 'Expenses',
      body: 'KPI · compact OK · useful ≥ 140',
      className: 'item expenses',
    },
    cashflow: {
      title: 'Cash Flow',
      body: 'Chart · needs meaningful width',
      className: 'item cashflow',
    },
    transactions: {
      title: 'Transactions',
      body: 'Table · needs vertical space',
      className: 'item transactions',
    },
    alerts: {
      title: 'Alerts',
      body: 'Tolerates a smaller slot',
      className: 'item alerts',
    },
    notes: {
      title: 'Notes',
      body: 'Text · prefers readable height',
      className: 'item notes',
    },
  };

  interface SvelteProbe {
    phase?: string;
    validity?: string;
    lastDropAccepted?: boolean;
    spaceWidth?: number;
    cancelCount?: number;
    proposalUnplaced?: number;
  }

  function onChange(state: LayoutSessionState): void {
    const probe: SvelteProbe = ((
      window as unknown as { __DNDGEM_SVELTE?: SvelteProbe }
    ).__DNDGEM_SVELTE ??= {});
    probe.phase = state.phase;
    probe.validity = state.solver.evaluation.state;
    probe.lastDropAccepted = state.lastDrop?.accepted;
    probe.spaceWidth = state.resolved.space.width;
    probe.proposalUnplaced = state.autoLayout?.proposalUnplacedItemIds.length;
    if (state.phase === 'idle' && state.lastDrop === undefined && probe.cancelCount === undefined) {
      probe.cancelCount = 0;
    }
  }

  function onCancel(): void {
    const probe: SvelteProbe = ((
      window as unknown as { __DNDGEM_SVELTE?: SvelteProbe }
    ).__DNDGEM_SVELTE ??= {});
    probe.cancelCount = (probe.cancelCount ?? 0) + 1;
  }
</script>

<DnDGemProvider items={ITEMS} desiredPlacements={DESIRED} autoLayout={true} {onChange} {onCancel}>
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
      <h1>DnDGem Svelte Example</h1>
      <p>
        Opt-in Auto-Layout (<code>autoLayout</code>): one explicit Source Intent card; DnDGem places
        the rest. Resize to see adaptive retention; drag an automatic card to promote it to Source
        Intent. This package is implemented in the repository and is
        <strong>not yet published on npm</strong>.
      </p>
      <p data-testid="status">{status}</p>
      <div class="board" data-testid="board" use:dndgemContainer>
        {#each ITEMS as item (item.id)}
          {@const copy = COPY[item.id]}
          {#if copy}
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <article
              class={copy.className}
              data-testid={`item-${item.id}`}
              aria-label={copy.title}
              tabindex="0"
              use:dndgemItem={item.id}
            >
              <h2>{copy.title}</h2>
              <p>{copy.body}</p>
            </article>
          {/if}
        {/each}
      </div>
      {#if !ready}
        <p>starting</p>
      {/if}
    </main>
  {/snippet}
</DnDGemProvider>
