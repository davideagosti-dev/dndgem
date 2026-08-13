import { describe, expect, it } from 'vitest';
import {
  createLayoutIntent,
  createResolvedLayout,
  type LayoutIntent,
  type ResolvedLayout,
} from '@dndgem/core';
import {
  DomAdapterError,
  createDragInteraction,
  type DragCancelEvent,
  type DragDropResult,
  type DragMechanicsAdapter,
  type DragMechanicsContext,
  type DragProposal,
} from '../src/index.js';
import {
  FakeResizeObserver,
  createFakeDragMechanics,
  fakeElement,
  resetFakeResizeObservers,
  type FakeBox,
} from './helpers.js';

function validIntent(): LayoutIntent {
  return createLayoutIntent({
    space: { width: 800, height: 600 },
    items: [
      {
        id: 'card',
        measuredSize: { width: 200, height: 100 },
        constraints: {
          minWidth: 40,
          minHeight: 20,
          preferredWidth: 200,
          preferredHeight: 100,
        },
      },
      {
        id: 'panel',
        measuredSize: { width: 120, height: 80 },
        constraints: {
          minWidth: 40,
          minHeight: 20,
          preferredWidth: 120,
          preferredHeight: 80,
        },
      },
    ],
    desiredPlacements: {
      card: { x: 40, y: 40, width: 200, height: 100 },
      panel: { x: 280, y: 40, width: 120, height: 80 },
    },
  });
}

function previousFromIntent(intent: LayoutIntent): ResolvedLayout {
  return createResolvedLayout({
    space: intent.space,
    placements: intent.desiredPlacements ?? {},
  });
}

function setup(options?: { intent?: LayoutIntent; previous?: ResolvedLayout }) {
  resetFakeResizeObservers();
  const containerBox: FakeBox = { left: 100, top: 50, width: 800, height: 600 };
  const cardBox: FakeBox = { left: 140, top: 90, width: 200, height: 100 };
  const panelBox: FakeBox = { left: 380, top: 90, width: 120, height: 80 };
  const intent = options?.intent ?? validIntent();
  const previous = options?.previous ?? previousFromIntent(intent);
  const mechanics = createFakeDragMechanics();
  const proposals: DragProposal[] = [];
  const drops: DragDropResult[] = [];
  const cancels: DragCancelEvent[] = [];
  const starts: string[] = [];

  const interaction = createDragInteraction({
    container: fakeElement(containerBox),
    items: {
      card: fakeElement(cardBox),
      panel: fakeElement(panelBox),
    },
    intent,
    previous,
    mechanics: mechanics.adapter,
    ResizeObserver: FakeResizeObserver,
    onStart: (event) => {
      starts.push(event.itemId);
    },
    onProposal: (event) => {
      proposals.push(event.proposal);
    },
    onDrop: (event) => {
      drops.push(event.result);
    },
    onCancel: (event) => {
      cancels.push(event);
    },
  });

  return {
    interaction,
    mechanics,
    proposals,
    drops,
    cancels,
    starts,
    intent,
    previous,
    containerBox,
    cardBox,
    panelBox,
  };
}

describe('createDragInteraction', () => {
  it('starts idle with no active item or proposal', () => {
    const { interaction } = setup();
    const state = interaction.getState();
    expect(state.phase).toBe('idle');
    expect(state.activeItemId).toBeUndefined();
    expect(state.proposal).toBeUndefined();
    expect(state.lastDrop).toBeUndefined();
    interaction.dispose();
  });

  it('maps ItemId to the dragged item and emits a start proposal at the baseline', () => {
    const { interaction, mechanics, starts, proposals } = setup();
    mechanics.start('card');
    expect(starts).toEqual(['card']);
    expect(interaction.getState().phase).toBe('dragging');
    expect(interaction.getState().activeItemId).toBe('card');
    expect(proposals[0]?.desiredPlacement).toEqual({ x: 40, y: 40, width: 200, height: 100 });
    expect(proposals[0]?.translation).toEqual({ x: 0, y: 0 });
    interaction.dispose();
  });

  it('produces a container-relative proposal from the provider translation', () => {
    const { mechanics, proposals, interaction } = setup();
    mechanics.start('card');
    mechanics.move('card', { x: 15.5, y: -8.25 });
    const proposal = proposals.at(-1);
    expect(proposal?.desiredPlacement).toEqual({
      x: 55.5,
      y: 31.75,
      width: 200,
      height: 100,
    });
    expect(proposal?.translation).toEqual({ x: 15.5, y: -8.25 });
    interaction.dispose();
  });

  it('does not mutate caller-owned intent or previous layout', () => {
    const intent = validIntent();
    const previous = previousFromIntent(intent);
    const frozenDesired = intent.desiredPlacements;
    const { mechanics, interaction } = setup({ intent, previous });
    mechanics.start('card');
    mechanics.move('card', { x: 40, y: 10 });
    mechanics.drop('card', { x: 40, y: 10 });
    expect(intent.desiredPlacements).toBe(frozenDesired);
    expect(intent.desiredPlacements?.card).toEqual({ x: 40, y: 40, width: 200, height: 100 });
    expect(previous.placements.card).toEqual({ x: 40, y: 40, width: 200, height: 100 });
    interaction.dispose();
  });

  it('accepts a valid drop and returns idle with a committed result', () => {
    const { mechanics, drops, interaction, previous } = setup();
    mechanics.start('card');
    mechanics.move('card', { x: 20, y: 10 });
    mechanics.drop('card', { x: 20, y: 10 });
    expect(drops).toHaveLength(1);
    expect(drops[0]?.accepted).toBe(true);
    expect(drops[0]?.itemId).toBe('card');
    expect(drops[0]?.intent.desiredPlacements?.card).toEqual({
      x: 60,
      y: 50,
      width: 200,
      height: 100,
    });
    expect(drops[0]?.previousResolved).toBe(previous);
    expect(interaction.getState().phase).toBe('idle');
    expect(interaction.getState().proposal).toBeUndefined();
    expect(interaction.getState().lastDrop?.accepted).toBe(true);
    interaction.dispose();
  });

  it('cancels without committing and returns idle with the proposal cleared', () => {
    const { mechanics, drops, cancels, interaction, intent } = setup();
    mechanics.start('card');
    mechanics.move('card', { x: 80, y: 40 });
    mechanics.cancel('card');
    expect(cancels).toEqual([{ itemId: 'card' }]);
    expect(drops).toEqual([]);
    expect(interaction.getState().phase).toBe('idle');
    expect(interaction.getState().proposal).toBeUndefined();
    expect(interaction.getState().lastDrop).toBeUndefined();
    expect(intent.desiredPlacements?.card).toEqual({ x: 40, y: 40, width: 200, height: 100 });
    interaction.dispose();
  });

  it('rejects starting a drag for a disconnected mapped item', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const intent = createLayoutIntent({
      space: { width: 200, height: 100 },
      items: [{ id: 'gone', measuredSize: { width: 40, height: 20 } }],
    });
    const interaction = createDragInteraction({
      container: fakeElement({ left: 0, top: 0, width: 200, height: 100 }),
      items: {
        gone: fakeElement({ left: 0, top: 0, width: 40, height: 20, connected: false }),
      },
      intent,
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    expect(() => mechanics.start('gone')).toThrow(DomAdapterError);
    expect(() => mechanics.start('gone')).toThrow(/no current measurement/);
    interaction.dispose();
  });

  it('rejects an unknown intent item without inventing a Core item', () => {
    const { mechanics, interaction } = setup();
    expect(() => mechanics.start('ghost')).toThrow(DomAdapterError);
    expect(() => mechanics.start('ghost')).toThrow(/not present in the LayoutIntent/);
    expect(interaction.getState().phase).toBe('idle');
    interaction.dispose();
  });

  it('rejects a mapped element that is not in the LayoutIntent', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const intent = createLayoutIntent({
      space: { width: 200, height: 100 },
      items: [{ id: 'only' }],
    });
    const interaction = createDragInteraction({
      container: fakeElement({ left: 0, top: 0, width: 200, height: 100 }),
      items: {
        only: fakeElement({ left: 0, top: 0, width: 40, height: 20 }),
        extra: fakeElement({ left: 50, top: 0, width: 40, height: 20 }),
      },
      intent,
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    expect(() => mechanics.start('extra')).toThrow(DomAdapterError);
    expect(() => mechanics.start('extra')).toThrow(/not present in the LayoutIntent/);
    interaction.dispose();
  });

  it('throws INTERACTION_DISPOSED after dispose and is idempotent', () => {
    const { interaction, mechanics } = setup();
    interaction.dispose();
    interaction.dispose();
    expect(() => interaction.getState()).toThrow(DomAdapterError);
    expect(() => interaction.getState()).toThrow(/disposed/);
    expect(mechanics.isConnected()).toBe(false);
  });

  it('does not emit callbacks after dispose', () => {
    const { interaction, mechanics, proposals, drops, starts } = setup();
    interaction.dispose();
    expect(mechanics.isConnected()).toBe(false);
    expect(() => mechanics.start('card')).toThrow(/not connected/);
    expect(starts).toEqual([]);
    expect(proposals).toEqual([]);
    expect(drops).toEqual([]);
  });

  it('ignores late mechanics callbacks after dispose', () => {
    resetFakeResizeObservers();
    let context: DragMechanicsContext | undefined;
    const adapter: DragMechanicsAdapter = {
      connect(next) {
        context = next;
        return {
          dispose() {
            return;
          },
        };
      },
    };
    const starts: string[] = [];
    const interaction = createDragInteraction({
      container: fakeElement({ left: 0, top: 0, width: 200, height: 100 }),
      items: { card: fakeElement({ left: 10, top: 10, width: 40, height: 20 }) },
      intent: validIntent(),
      mechanics: adapter,
      ResizeObserver: FakeResizeObserver,
      onStart: (event) => {
        starts.push(event.itemId);
      },
    });
    interaction.dispose();
    context?.onStart({ itemId: 'card' });
    context?.onMove({ itemId: 'card', translation: { x: 1, y: 1 } });
    context?.onDrop({ itemId: 'card', translation: { x: 1, y: 1 } });
    context?.onCancel({ itemId: 'card' });
    expect(starts).toEqual([]);
  });

  it('supports drag → drop → drag again without stale active state', () => {
    const { mechanics, drops, interaction } = setup();
    mechanics.start('card');
    mechanics.move('card', { x: 10, y: 0 });
    mechanics.drop('card', { x: 10, y: 0 });
    expect(interaction.getState().phase).toBe('idle');
    mechanics.start('card');
    expect(interaction.getState().phase).toBe('dragging');
    expect(interaction.getState().lastDrop).toBeUndefined();
    mechanics.move('card', { x: 30, y: 5 });
    mechanics.drop('card', { x: 30, y: 5 });
    expect(drops).toHaveLength(2);
    expect(drops[0]?.accepted).toBe(true);
    expect(drops[1]?.accepted).toBe(true);
    expect(drops[1]?.intent.desiredPlacements?.card).toEqual({
      x: 70,
      y: 45,
      width: 200,
      height: 100,
    });
    interaction.dispose();
  });

  it('supports drag → cancel → drag again', () => {
    const { mechanics, drops, interaction } = setup();
    mechanics.start('card');
    mechanics.move('card', { x: 99, y: 99 });
    mechanics.cancel('card');
    expect(interaction.getState().phase).toBe('idle');
    mechanics.start('panel');
    mechanics.move('panel', { x: 8, y: 4 });
    mechanics.drop('panel', { x: 8, y: 4 });
    expect(drops).toHaveLength(1);
    expect(drops[0]?.itemId).toBe('panel');
    expect(drops[0]?.accepted).toBe(true);
    interaction.dispose();
  });

  it('is deterministic for a repeated event sequence', () => {
    const first = setup();
    first.mechanics.start('card');
    first.mechanics.move('card', { x: 12.25, y: 3.5 });
    first.mechanics.drop('card', { x: 12.25, y: 3.5 });
    const second = setup();
    second.mechanics.start('card');
    second.mechanics.move('card', { x: 12.25, y: 3.5 });
    second.mechanics.drop('card', { x: 12.25, y: 3.5 });
    expect(first.proposals.map((p) => p.desiredPlacement)).toEqual(
      second.proposals.map((p) => p.desiredPlacement),
    );
    expect(first.drops[0]?.solver.resolved).toEqual(second.drops[0]?.solver.resolved);
    expect(first.drops[0]?.accepted).toBe(second.drops[0]?.accepted);
    first.interaction.dispose();
    second.interaction.dispose();
  });

  it('rejects invalid interaction configuration', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    expect(() =>
      createDragInteraction(null as unknown as Parameters<typeof createDragInteraction>[0]),
    ).toThrow(DomAdapterError);
    expect(() =>
      createDragInteraction({
        container: fakeElement({ left: 0, top: 0, width: 10, height: 10 }),
        items: { a: fakeElement({ left: 0, top: 0, width: 4, height: 4 }) },
        intent: validIntent(),
        mechanics: { connect: 'nope' } as unknown as (typeof mechanics)['adapter'],
        ResizeObserver: FakeResizeObserver,
      }),
    ).toThrow(DomAdapterError);
  });
});
