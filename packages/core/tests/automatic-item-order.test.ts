import { describe, expect, it } from 'vitest';
import {
  createAutoLayoutProposal,
  createContentConstraints,
  createLayoutIntent,
  createLayoutItem,
  solveLayout,
} from '../src/index.js';
import { listAutomaticItemIds, normalizeAutomaticItemOrder } from '../src/automatic-item-order.js';

function intentWith(
  space: { width: number; height: number },
  items: Array<{
    id: string;
    constraints?: Parameters<typeof createContentConstraints>[0];
  }>,
  desiredPlacements?: Record<string, { x: number; y: number; width: number; height: number }>,
) {
  return createLayoutIntent({
    space,
    items: items.map((item) =>
      createLayoutItem({
        id: item.id,
        constraints: createContentConstraints(item.constraints ?? {}),
      }),
    ),
    desiredPlacements,
  });
}

describe('normalizeAutomaticItemOrder (Core defensive)', () => {
  const intent = intentWith({ width: 400, height: 300 }, [{ id: 'a' }, { id: 'b' }]);

  it('falls back to declaration order for unusable proposals', () => {
    expect(normalizeAutomaticItemOrder(intent, ['unknown'])).toEqual(['a', 'b']);
  });

  it('lists automatic ids in declaration order', () => {
    const hybrid = intentWith({ width: 400, height: 300 }, [{ id: 'source' }, { id: 'a' }], {
      source: { x: 0, y: 0, width: 10, height: 10 },
    });
    expect(listAutomaticItemIds(hybrid)).toEqual(['a']);
  });
});

describe('createAutoLayoutProposal — automaticItemOrder', () => {
  const baseIntent = () =>
    intentWith({ width: 200, height: 100 }, [
      {
        id: 'blocker',
        constraints: { preferredWidth: 120, preferredHeight: 100, minWidth: 40 },
      },
      {
        id: 'first',
        constraints: { preferredWidth: 90, preferredHeight: 100, minWidth: 40 },
      },
      {
        id: 'second',
        constraints: { preferredWidth: 90, preferredHeight: 100, minWidth: 40 },
      },
    ]);

  it('default path without automaticItemOrder matches Phase 3 declaration-order behavior', () => {
    const intent = baseIntent();
    const baseline = createAutoLayoutProposal({ intent });
    const explicitDeclaration = createAutoLayoutProposal({
      intent,
      automaticItemOrder: ['blocker', 'first', 'second'],
    });
    expect(explicitDeclaration).toEqual(baseline);
    expect(baseline.unplacedItemIds).toEqual(['first', 'second']);
  });

  it('respects a valid automaticItemOrder', () => {
    const intent = baseIntent();
    const guided = createAutoLayoutProposal({
      intent,
      automaticItemOrder: ['first', 'second', 'blocker'],
    });
    expect(guided.unplacedItemIds).toEqual(['blocker']);
    expect(guided.placementOrigins.first).toBe('generated');
    expect(guided.placementOrigins.second).toBe('generated');
  });

  it('handles partial order safely by appending omitted ids', () => {
    const intent = baseIntent();
    const partial = createAutoLayoutProposal({
      intent,
      automaticItemOrder: ['second'],
    });
    const guided = createAutoLayoutProposal({
      intent,
      automaticItemOrder: ['second', 'blocker', 'first'],
    });
    expect(partial.unplacedItemIds).toEqual(['blocker']);
    expect(guided.unplacedItemIds).toEqual(['blocker']);
  });

  it('ignores unknown and source ids in automaticItemOrder', () => {
    const intent = intentWith(
      { width: 200, height: 100 },
      [
        {
          id: 'pinned',
          constraints: { preferredWidth: 100, preferredHeight: 100, minWidth: 40 },
        },
        {
          id: 'auto',
          constraints: { preferredWidth: 90, preferredHeight: 90, minWidth: 40 },
        },
      ],
      { pinned: { x: 0, y: 0, width: 100, height: 100 } },
    );
    const proposal = createAutoLayoutProposal({
      intent,
      automaticItemOrder: ['pinned', 'ghost', 'auto', 'auto'],
    });
    expect(proposal.placementOrigins.pinned).toBe('source');
    expect(proposal.generatedPlacements.auto).toEqual({ x: 100, y: 0, width: 90, height: 90 });
  });

  it('does not mutate caller intent or order array', () => {
    const intent = baseIntent();
    const order = Object.freeze(['first', 'second', 'blocker']);
    createAutoLayoutProposal({ intent, automaticItemOrder: order });
    expect(order).toEqual(['first', 'second', 'blocker']);
    expect(intent.items).toHaveLength(3);
  });
});

describe('createAutoLayoutProposal — provenance with automaticItemOrder', () => {
  it('never introduces planner/intelligence placement origins', () => {
    const intent = intentWith({ width: 200, height: 100 }, [
      { id: 'a', constraints: { preferredWidth: 90, preferredHeight: 90, minWidth: 40 } },
      { id: 'b', constraints: { preferredWidth: 90, preferredHeight: 90, minWidth: 40 } },
    ]);
    const proposal = createAutoLayoutProposal({
      intent,
      automaticItemOrder: ['b', 'a'],
    });
    for (const origin of Object.values(proposal.placementOrigins)) {
      expect(origin === 'source' || origin === 'generated').toBe(true);
    }
  });

  it('does not promote generated placements into Source Intent input', () => {
    const intent = intentWith({ width: 400, height: 300 }, [
      { id: 'a', constraints: { preferredWidth: 80, preferredHeight: 40, minWidth: 20 } },
      { id: 'b', constraints: { preferredWidth: 80, preferredHeight: 40, minWidth: 20 } },
    ]);
    const originalDesired = intent.desiredPlacements;
    const proposal = createAutoLayoutProposal({
      intent,
      automaticItemOrder: ['b', 'a'],
    });
    expect(intent.desiredPlacements).toBe(originalDesired);
    expect(proposal.effectiveIntent.desiredPlacements?.a).toBeDefined();
  });
});

describe('createAutoLayoutProposal — automaticItemOrder determinism', () => {
  it('repeated runs with the same input stay identical (50×)', () => {
    const intent = intentWith(
      { width: 250, height: 120 },
      [
        { id: 'pinned', constraints: { preferredWidth: 100, preferredHeight: 120, minWidth: 40 } },
        { id: 'a', constraints: { preferredWidth: 100, preferredHeight: 70, minWidth: 40 } },
        { id: 'b', constraints: { preferredWidth: 100, preferredHeight: 60, minWidth: 40 } },
        { id: 'c', constraints: { preferredWidth: 100, preferredHeight: 50, minWidth: 40 } },
      ],
      { pinned: { x: 0, y: 0, width: 100, height: 120 } },
    );

    const input = { intent, automaticItemOrder: ['b', 'c', 'a'] as const };
    const firstProposal = createAutoLayoutProposal(input);
    const firstSolve = solveLayout({ intent: firstProposal.effectiveIntent });

    for (let i = 0; i < 50; i += 1) {
      const proposal = createAutoLayoutProposal(input);
      expect(proposal).toEqual(firstProposal);
      expect(solveLayout({ intent: proposal.effectiveIntent })).toEqual(firstSolve);
    }
  });
});
