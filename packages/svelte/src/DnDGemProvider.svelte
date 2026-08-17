<script lang="ts">
  import { onDestroy, onMount, setContext, untrack } from 'svelte';
  import type { LayoutSessionState } from '@dndgem/dom';
  import { DnDGemBoard } from './board.js';
  import { DnDGemBoardKey } from './context.js';
  import { createBoundContainerAction, createBoundItemAction } from './actions.js';
  import type { DnDGemProviderProps, DnDGemSnippetProps } from './types.js';

  let {
    items,
    desiredPlacements = undefined,
    autoLayout = false,
    onChange,
    onDrop,
    onCancel,
    mechanics = undefined,
    ResizeObserver = undefined,
    children,
  }: DnDGemProviderProps = $props();

  const board = new DnDGemBoard();
  setContext(DnDGemBoardKey, board);

  const dndgemContainer = createBoundContainerAction(board);
  const dndgemItem = createBoundItemAction(board);

  let layoutState = $state<LayoutSessionState | undefined>(undefined);
  let isReady = $state(false);
  let registryTick = $state(0);
  let clientMounted = $state(false);

  board.setRegistryListener(() => {
    registryTick += 1;
  });

  const unsubscribe = board.stateStore.subscribe((next) => {
    layoutState = next;
    isReady = next !== undefined;
  });

  onMount(() => {
    clientMounted = true;
  });

  $effect(() => {
    const change = onChange;
    const drop = onDrop;
    const cancel = onCancel;
    untrack(() => {
      board.setCallbacks({ onChange: change, onDrop: drop, onCancel: cancel });
    });
  });

  $effect(() => {
    if (!clientMounted) {
      return;
    }
    const currentItems = items;
    const currentDesired = desiredPlacements;
    const currentAuto = autoLayout;
    const currentMechanics = mechanics;
    const currentObserver = ResizeObserver;
    void registryTick;
    untrack(() => {
      board.configure({
        items: currentItems,
        desiredPlacements: currentDesired,
        autoLayout: currentAuto,
        mechanics: currentMechanics,
        ResizeObserver: currentObserver,
      });
      board.syncSession();
    });
  });

  onDestroy(() => {
    unsubscribe();
    board.dispose();
  });

  const snippetProps: DnDGemSnippetProps = {
    get state() {
      return layoutState;
    },
    get ready() {
      return isReady;
    },
    dndgemContainer,
    dndgemItem,
  };
</script>

{@render children(snippetProps)}
