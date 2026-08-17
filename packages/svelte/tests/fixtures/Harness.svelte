<script lang="ts">
  import type {
    DragCancelEvent,
    DragDropResult,
    DragMechanicsAdapter,
    LayoutSessionState,
    ResizeObserverConstructor,
  } from '@dndgem/dom';
  import { DnDGemProvider, type DnDGemItemConfig } from '../../src/index.js';
  import { hostAction, type FakeBox } from '../helpers.js';

  const CONTAINER_BOX: FakeBox = { left: 0, top: 0, width: 400, height: 200 };
  const CHART_BOX: FakeBox = { left: 8, top: 8, width: 120, height: 60 };
  const TABLE_BOX: FakeBox = { left: 140, top: 8, width: 80, height: 60 };

  let {
    items = $bindable(),
    desiredPlacements = $bindable(),
    autoLayout = $bindable(false),
    mechanics = $bindable(),
    ResizeObserver = $bindable(),
    onChange,
    onDrop = $bindable(),
    onCancel,
    showTable = $bindable(true),
    accessible = false,
  }: {
    items: readonly DnDGemItemConfig[];
    desiredPlacements?: Readonly<
      Record<string, { x: number; y: number; width: number; height: number }>
    >;
    autoLayout?: boolean;
    mechanics?: DragMechanicsAdapter;
    ResizeObserver?: ResizeObserverConstructor;
    onChange?: (state: LayoutSessionState) => void;
    onDrop?: (event: { readonly result: DragDropResult }) => void;
    onCancel?: (event: DragCancelEvent) => void;
    showTable?: boolean;
    accessible?: boolean;
  } = $props();

  export function setShowTable(next: boolean): void {
    showTable = next;
  }

  export function setItems(next: readonly DnDGemItemConfig[]): void {
    items = next;
  }

  export function setDesiredPlacements(
    next:
      Readonly<Record<string, { x: number; y: number; width: number; height: number }>> | undefined,
  ): void {
    desiredPlacements = next;
  }

  export function setAutoLayout(next: boolean): void {
    autoLayout = next;
  }

  export function setOnDrop(
    next: ((event: { readonly result: DragDropResult }) => void) | undefined,
  ): void {
    onDrop = next;
  }

  export function setMechanics(next: DragMechanicsAdapter | undefined): void {
    mechanics = next;
  }

  export function setResizeObserver(next: ResizeObserverConstructor | undefined): void {
    ResizeObserver = next;
  }
</script>

<DnDGemProvider
  {items}
  {desiredPlacements}
  {autoLayout}
  {mechanics}
  {ResizeObserver}
  {onChange}
  {onDrop}
  {onCancel}
>
  {#snippet children({ dndgemContainer, dndgemItem, state: layoutState, ready })}
    <div>
      <div data-testid="board" use:hostAction={{ box: CONTAINER_BOX, action: dndgemContainer }}>
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <article
          data-testid="item-chart"
          aria-label={accessible ? 'Chart card' : undefined}
          tabindex={accessible ? 0 : undefined}
          use:hostAction={{ box: CHART_BOX, action: dndgemItem, arg: 'chart' }}
        >
          {#if accessible}
            <button type="button" data-testid="chart-action">Open</button>
          {:else}
            chart
          {/if}
        </article>
        {#if showTable}
          <article
            data-testid="item-table"
            use:hostAction={{ box: TABLE_BOX, action: dndgemItem, arg: 'table' }}
          >
            table
          </article>
        {/if}
      </div>
      <div data-testid="ready">{ready ? 'yes' : 'no'}</div>
      <div data-testid="phase">{layoutState?.phase ?? 'none'}</div>
      <div data-testid="chart-x">{layoutState?.resolved.placements.chart?.x ?? ''}</div>
      <div data-testid="validity">{layoutState?.solver.evaluation.state ?? ''}</div>
      <div data-testid="auto-layout">
        {layoutState?.autoLayout
          ? JSON.stringify({
              enabled: layoutState.autoLayout.enabled,
              proposalUnplacedItemIds: layoutState.autoLayout.proposalUnplacedItemIds,
            })
          : ''}
      </div>
      <div data-testid="resolved-json">
        {layoutState
          ? JSON.stringify({
              space: layoutState.resolved.space,
              placements: layoutState.resolved.placements,
            })
          : ''}
      </div>
      <div data-testid="source-table">
        {layoutState?.intent.desiredPlacements?.table ? 'yes' : 'no'}
      </div>
      <div data-testid="drop-accepted">
        {layoutState?.lastDrop === undefined ? '' : String(layoutState.lastDrop.accepted)}
      </div>
    </div>
  {/snippet}
</DnDGemProvider>
