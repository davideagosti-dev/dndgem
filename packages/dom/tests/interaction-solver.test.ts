import { describe, expect, it } from 'vitest';
import {
  createLayoutIntent,
  createResolvedLayout,
  solveLayout,
  type LayoutIntent,
  type ResolvedLayout,
} from '@dndgem/core';
import { createDragInteraction, type DragDropResult, type DragProposal } from '../src/index.js';
import {
  FakeResizeObserver,
  createFakeDragMechanics,
  fakeElement,
  resetFakeResizeObservers,
} from './helpers.js';

function interactionFor(intent: LayoutIntent, previous?: ResolvedLayout) {
  resetFakeResizeObservers();
  const mechanics = createFakeDragMechanics();
  const proposals: DragProposal[] = [];
  const drops: DragDropResult[] = [];
  const items: Record<string, ReturnType<typeof fakeElement>> = {};
  for (const item of intent.items) {
    const key = String(item.id);
    const desired = intent.desiredPlacements?.[key];
    items[key] = fakeElement({
      left: desired?.x ?? 0,
      top: desired?.y ?? 0,
      width: desired?.width ?? item.measuredSize?.width ?? 40,
      height: desired?.height ?? item.measuredSize?.height ?? 20,
    });
  }

  const created = createDragInteraction({
    container: fakeElement({
      left: 0,
      top: 0,
      width: intent.space.width,
      height: intent.space.height,
    }),
    items,
    intent,
    previous,
    mechanics: mechanics.adapter,
    ResizeObserver: FakeResizeObserver,
    onProposal: (event) => {
      proposals.push(event.proposal);
    },
    onDrop: (event) => {
      drops.push(event.result);
    },
  });

  return { interaction: created, mechanics, proposals, drops };
}

describe('drag → LayoutIntent → solveLayout', () => {
  it('composes a valid drop through the Core solver', () => {
    const intent = createLayoutIntent({
      space: { width: 400, height: 200 },
      items: [
        {
          id: 'a',
          measuredSize: { width: 80, height: 40 },
          constraints: {
            minWidth: 40,
            minHeight: 20,
            preferredWidth: 80,
            preferredHeight: 40,
          },
        },
      ],
      desiredPlacements: { a: { x: 0, y: 0, width: 80, height: 40 } },
    });
    const previous = createResolvedLayout({
      space: intent.space,
      placements: { a: { x: 0, y: 0, width: 80, height: 40 } },
    });
    const { mechanics, drops, proposals, interaction } = interactionFor(intent, previous);
    mechanics.start('a');
    mechanics.move('a', { x: 30, y: 10 });
    expect(proposals.at(-1)?.preview.evaluation.state).toBe('VALID');
    mechanics.drop('a', { x: 30, y: 10 });
    expect(drops[0]?.accepted).toBe(true);
    expect(drops[0]?.solver.evaluation.state).toBe('VALID');
    expect(drops[0]?.intent.desiredPlacements?.a).toEqual({ x: 30, y: 10, width: 80, height: 40 });
    expect(drops[0]?.resolved?.placements.a).toBeDefined();
    interaction.dispose();
  });

  it('keeps sibling placements stable while the dragged item moves', () => {
    const intent = createLayoutIntent({
      space: { width: 400, height: 200 },
      items: [
        {
          id: 'a',
          measuredSize: { width: 80, height: 40 },
          constraints: { minWidth: 20, minHeight: 10, preferredWidth: 80, preferredHeight: 40 },
        },
        {
          id: 'b',
          measuredSize: { width: 60, height: 40 },
          constraints: { minWidth: 20, minHeight: 10, preferredWidth: 60, preferredHeight: 40 },
        },
      ],
      desiredPlacements: {
        a: { x: 0, y: 0, width: 80, height: 40 },
        b: { x: 120, y: 0, width: 60, height: 40 },
      },
    });
    const previous = createResolvedLayout({
      space: intent.space,
      placements: intent.desiredPlacements ?? {},
    });
    const { mechanics, drops, interaction } = interactionFor(intent, previous);
    mechanics.start('a');
    mechanics.drop('a', { x: 15, y: 8 });
    expect(drops[0]?.accepted).toBe(true);
    expect(drops[0]?.intent.desiredPlacements?.b).toEqual({ x: 120, y: 0, width: 60, height: 40 });
    expect(drops[0]?.solver.resolved.placements.b).toEqual({ x: 120, y: 0, width: 60, height: 40 });
    expect(drops[0]?.solver.resolved.placements.a).toEqual({ x: 15, y: 8, width: 80, height: 40 });
    expect(drops[0]?.solver.winnerId).toContain('preserve-desired');
    const packing = drops[0]?.solver.candidates.filter(
      (candidate) =>
        candidate.strategy.startsWith('row-') || candidate.strategy.startsWith('column-'),
    );
    expect(packing?.some((candidate) => candidate.state === 'VALID')).toBe(true);
    interaction.dispose();
  });

  it('seeds siblings from last committed resolved layout, not stale author desired', () => {
    const intent = createLayoutIntent({
      space: { width: 400, height: 200 },
      items: [
        {
          id: 'a',
          measuredSize: { width: 80, height: 40 },
          constraints: { minWidth: 20, minHeight: 10, preferredWidth: 80, preferredHeight: 40 },
        },
        {
          id: 'b',
          measuredSize: { width: 60, height: 40 },
          constraints: { minWidth: 20, minHeight: 10, preferredWidth: 60, preferredHeight: 40 },
        },
      ],
      desiredPlacements: {
        a: { x: 0, y: 0, width: 80, height: 40 },
        b: { x: 280, y: 80, width: 60, height: 40 },
      },
    });
    const previous = createResolvedLayout({
      space: intent.space,
      placements: {
        a: { x: 0, y: 0, width: 80, height: 40 },
        b: { x: 120, y: 0, width: 60, height: 40 },
      },
    });
    const { mechanics, drops, interaction } = interactionFor(intent, previous);
    mechanics.start('a');
    mechanics.drop('a', { x: 12, y: 4 });
    expect(drops[0]?.accepted).toBe(true);
    expect(drops[0]?.intent.desiredPlacements?.b).toEqual({ x: 120, y: 0, width: 60, height: 40 });
    expect(drops[0]?.solver.resolved.placements.b).toEqual({ x: 120, y: 0, width: 60, height: 40 });
    expect(drops[0]?.solver.resolved.placements.a).toEqual({ x: 12, y: 4, width: 80, height: 40 });
    interaction.dispose();
  });

  it('does not pass Core previous, because ADR-0010 stability would keep the last commit', () => {
    const intent = createLayoutIntent({
      space: { width: 400, height: 200 },
      items: [
        {
          id: 'a',
          measuredSize: { width: 80, height: 40 },
          constraints: { minWidth: 20, minHeight: 10, preferredWidth: 80, preferredHeight: 40 },
        },
        {
          id: 'b',
          measuredSize: { width: 60, height: 40 },
          constraints: { minWidth: 20, minHeight: 10, preferredWidth: 60, preferredHeight: 40 },
        },
      ],
      desiredPlacements: {
        a: { x: 40, y: 8, width: 80, height: 40 },
        b: { x: 120, y: 0, width: 60, height: 40 },
      },
    });
    const previous = createResolvedLayout({
      space: intent.space,
      placements: {
        a: { x: 0, y: 0, width: 80, height: 40 },
        b: { x: 120, y: 0, width: 60, height: 40 },
      },
    });

    const withPrevious = solveLayout({ intent, previous });
    expect(withPrevious.evaluation.state).toBe('VALID');
    expect(withPrevious.resolved.placements.a).toEqual(previous.placements.a);
    expect(withPrevious.candidates[0]?.strategy).toBe('preserve-previous');

    const withoutPrevious = solveLayout({ intent });
    expect(withoutPrevious.evaluation.state).toBe('VALID');
    expect(withoutPrevious.resolved.placements.a).toEqual(intent.desiredPlacements?.a);
    expect(withoutPrevious.resolved.placements.b).toEqual(intent.desiredPlacements?.b);
    expect(withoutPrevious.winnerId).toContain('preserve-desired');
  });

  it('accepts a DEGRADED but solvable drop', () => {
    const intent = createLayoutIntent({
      space: { width: 80, height: 80 },
      items: [
        {
          id: 'a',
          measuredSize: { width: 80, height: 40 },
          constraints: {
            minWidth: 40,
            minHeight: 20,
            minUsefulWidth: 100,
            preferredWidth: 120,
            preferredHeight: 40,
          },
        },
      ],
      desiredPlacements: { a: { x: 0, y: 0, width: 80, height: 40 } },
    });
    const { mechanics, drops, interaction } = interactionFor(intent);
    mechanics.start('a');
    mechanics.drop('a', { x: 4, y: 0 });
    expect(drops[0]?.accepted).toBe(true);
    expect(drops[0]?.solver.evaluation.state).toBe('DEGRADED');
    expect(drops[0]?.solver.selection.code).not.toBe('UNSATISFIABLE');
    interaction.dispose();
  });

  it('rejects an unsatisfiable drop and preserves the previous authoritative layout', () => {
    const previousIntent = createLayoutIntent({
      space: { width: 400, height: 400 },
      items: [
        {
          id: 'a',
          measuredSize: { width: 80, height: 80 },
          constraints: { minWidth: 200, minHeight: 200 },
        },
      ],
      desiredPlacements: { a: { x: 0, y: 0, width: 80, height: 80 } },
    });
    const previous = createResolvedLayout({
      space: { width: 400, height: 400 },
      placements: { a: { x: 10, y: 10, width: 80, height: 80 } },
    });
    const cramped = createLayoutIntent({
      space: { width: 50, height: 50 },
      items: previousIntent.items.map((item) => ({
        id: item.id,
        constraints: { ...item.constraints },
        measuredSize: item.measuredSize,
      })),
      desiredPlacements: { a: { x: 0, y: 0, width: 80, height: 80 } },
    });
    const { mechanics, drops, interaction } = interactionFor(cramped, previous);
    mechanics.start('a');
    mechanics.drop('a', { x: 5, y: 5 });
    expect(drops[0]?.accepted).toBe(false);
    expect(drops[0]?.solver.evaluation.state).toBe('INVALID');
    expect(drops[0]?.solver.selection.code).toBe('UNSATISFIABLE');
    expect(drops[0]?.intent).toBe(cramped);
    expect(drops[0]?.resolved).toBe(previous);
    expect(drops[0]?.previousIntent).toBe(cramped);
    expect(drops[0]?.previousResolved).toBe(previous);
    expect(interaction.getState().lastDrop?.accepted).toBe(false);
    interaction.dispose();
  });
});
