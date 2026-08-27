import { describe, expect, it } from 'vitest';
import { createContentConstraints, createLayoutIntent, createLayoutItem } from '@dndgem/core';
import { createDeterministicPlanningProposal } from '../src/planner.js';
import { rankAutomaticItemsByProminence } from '../src/normalize.js';
import type { PlanningSnapshot } from '../src/types.js';

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

describe('createDeterministicPlanningProposal', () => {
  it('returns declaration order when prominence is absent', () => {
    const intent = intentWith({ width: 400, height: 300 }, [{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    const snapshot: PlanningSnapshot = { intent };
    const proposal = createDeterministicPlanningProposal(snapshot);
    expect(proposal.automaticItemOrder).toEqual(['a', 'b', 'c']);
  });

  it('ranks higher prominence before lower prominence', () => {
    const intent = intentWith({ width: 400, height: 300 }, [
      { id: 'low' },
      { id: 'high' },
      { id: 'mid' },
    ]);
    const proposal = createDeterministicPlanningProposal({
      intent,
      prominence: { low: 1, mid: 5, high: 10 },
    });
    expect(proposal.automaticItemOrder).toEqual(['high', 'mid', 'low']);
  });

  it('preserves declaration order for equal prominence', () => {
    const intent = intentWith({ width: 400, height: 300 }, [{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    const proposal = createDeterministicPlanningProposal({
      intent,
      prominence: { a: 1, b: 1, c: 1 },
    });
    expect(proposal.automaticItemOrder).toEqual(['a', 'b', 'c']);
  });

  it('preserves declaration order for equal prominence regardless of item id lex order', () => {
    const intent = intentWith({ width: 400, height: 300 }, [{ id: 'z' }, { id: 'a' }, { id: 'm' }]);
    const order = rankAutomaticItemsByProminence(intent, { z: 1, a: 1, m: 1 });
    expect(order).toEqual(['z', 'a', 'm']);
  });

  it('ignores unknown prominence ids', () => {
    const intent = intentWith({ width: 400, height: 300 }, [{ id: 'a' }, { id: 'b' }]);
    const proposal = createDeterministicPlanningProposal({
      intent,
      prominence: { ghost: 99, a: 2, b: 1 },
    });
    expect(proposal.automaticItemOrder).toEqual(['a', 'b']);
  });

  it('excludes source intent items from automatic order', () => {
    const intent = intentWith(
      { width: 400, height: 300 },
      [{ id: 'source' }, { id: 'auto-a' }, { id: 'auto-b' }],
      { source: { x: 0, y: 0, width: 50, height: 50 } },
    );
    const proposal = createDeterministicPlanningProposal({
      intent,
      prominence: { 'auto-b': 5, 'auto-a': 1 },
    });
    expect(proposal.automaticItemOrder).toEqual(['auto-b', 'auto-a']);
  });

  it('treats non-finite prominence as zero', () => {
    const intent = intentWith({ width: 400, height: 300 }, [{ id: 'a' }, { id: 'b' }]);
    const proposal = createDeterministicPlanningProposal({
      intent,
      prominence: { a: Number.NaN, b: Number.POSITIVE_INFINITY },
    });
    expect(proposal.automaticItemOrder).toEqual(['a', 'b']);
  });

  it('does not mutate snapshot inputs', () => {
    const intent = intentWith({ width: 400, height: 300 }, [{ id: 'a' }, { id: 'b' }]);
    const prominence = Object.freeze({ a: 2, b: 1 });
    const snapshot = Object.freeze({ intent, prominence });
    createDeterministicPlanningProposal(snapshot);
    expect(snapshot.prominence).toEqual({ a: 2, b: 1 });
    expect(intent.items).toHaveLength(2);
  });
});

describe('createDeterministicPlanningProposal — determinism', () => {
  it('returns identical proposals for identical snapshots', () => {
    const intent = intentWith({ width: 320, height: 240 }, [
      { id: 'chart' },
      { id: 'legend' },
      { id: 'controls' },
    ]);
    const snapshot: PlanningSnapshot = {
      intent,
      prominence: { chart: 10, legend: 3, controls: 7, unused: 99 },
    };
    const first = createDeterministicPlanningProposal(snapshot);
    for (let i = 0; i < 50; i += 1) {
      expect(createDeterministicPlanningProposal(snapshot)).toEqual(first);
    }
  });
});
