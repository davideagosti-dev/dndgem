<script lang="ts">
  import type {
    LayoutSessionPlanner,
    LayoutSessionPlannerEvent,
    ResizeObserverConstructor,
  } from '@dndgem/dom';
  import { DnDGemProvider, type DnDGemItemConfig } from '../../src/index.js';
  import { hostAction, type FakeBox } from '../helpers.js';

  const CONTAINER_BOX: FakeBox = { left: 0, top: 0, width: 400, height: 200 };
  const CHART_BOX: FakeBox = { left: 8, top: 8, width: 120, height: 60 };

  let {
    items,
    desiredPlacements,
    planner = undefined,
    onPlannerEvent = undefined,
    ResizeObserver = undefined,
  }: {
    items: readonly DnDGemItemConfig[];
    desiredPlacements: Readonly<
      Record<string, { x: number; y: number; width: number; height: number }>
    >;
    planner?: LayoutSessionPlanner;
    onPlannerEvent?: (event: LayoutSessionPlannerEvent) => void;
    ResizeObserver?: ResizeObserverConstructor;
  } = $props();
</script>

<DnDGemProvider {items} {desiredPlacements} {planner} {onPlannerEvent} {ResizeObserver}>
  {#snippet children({ dndgemContainer, dndgemItem, ready, replan })}
    <div>
      <div data-testid="board" use:hostAction={{ box: CONTAINER_BOX, action: dndgemContainer }}>
        <article
          data-testid="item-chart"
          use:hostAction={{ box: CHART_BOX, action: dndgemItem, arg: 'chart' }}
        >
          chart
        </article>
      </div>
      <div data-testid="ready">{ready ? 'yes' : 'no'}</div>
      <div data-testid="replan-type">{typeof replan}</div>
    </div>
  {/snippet}
</DnDGemProvider>
