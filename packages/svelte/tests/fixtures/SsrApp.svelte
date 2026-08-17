<script lang="ts">
  import { DnDGemProvider, type DnDGemItemConfig } from '../../src/index.js';

  const items: readonly DnDGemItemConfig[] = [
    { id: 'chart', constraints: { minWidth: 40, preferredWidth: 120 } },
  ];
</script>

<DnDGemProvider {items}>
  {#snippet children({ dndgemContainer, dndgemItem })}
    <div data-testid="ssr-board" use:dndgemContainer>
      <article data-testid="ssr-item" use:dndgemItem={'chart'}>chart</article>
    </div>
  {/snippet}
</DnDGemProvider>
