<script lang="ts">
  import type { DragMechanicsAdapter, ResizeObserverConstructor } from '@dndgem/dom';
  import { DnDGemProvider, type DnDGemItemConfig } from '../../src/index.js';
  import NestedBoard from './NestedBoard.svelte';

  let {
    items,
    desiredPlacements,
    mechanics,
    ResizeObserver,
  }: {
    items: readonly DnDGemItemConfig[];
    desiredPlacements: Readonly<
      Record<string, { x: number; y: number; width: number; height: number }>
    >;
    mechanics?: DragMechanicsAdapter;
    ResizeObserver?: ResizeObserverConstructor;
  } = $props();
</script>

<DnDGemProvider {items} {desiredPlacements} {mechanics} {ResizeObserver}>
  <NestedBoard />
</DnDGemProvider>
