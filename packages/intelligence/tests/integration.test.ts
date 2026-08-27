import { describe, expect, it } from 'vitest';
import {
  createAutoLayoutProposal,
  createContentConstraints,
  createLayoutIntent,
  createLayoutItem,
  solveLayout,
} from '@dndgem/core';
import { createDeterministicPlanningProposal, normalizePlanningProposal } from '../src/index.js';

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

describe('DND-4.2 integration pipeline', () => {
  it('snapshot → planner → normalize → createAutoLayoutProposal → solveLayout', () => {
    const intent = intentWith({ width: 200, height: 100 }, [
      {
        id: 'blocker',
        constraints: { preferredWidth: 120, preferredHeight: 100, minWidth: 40 },
      },
      {
        id: 'target-a',
        constraints: { preferredWidth: 90, preferredHeight: 100, minWidth: 40 },
      },
      {
        id: 'target-b',
        constraints: { preferredWidth: 90, preferredHeight: 100, minWidth: 40 },
      },
    ]);

    const snapshot = {
      intent,
      prominence: { 'target-a': 10, 'target-b': 5, blocker: 0 },
    };

    const raw = createDeterministicPlanningProposal(snapshot);
    const normalized = normalizePlanningProposal(snapshot, raw);
    const proposal = createAutoLayoutProposal({
      intent,
      automaticItemOrder: normalized.automaticItemOrder,
    });
    const result = solveLayout({ intent: proposal.effectiveIntent });

    expect(proposal.unplacedItemIds).toEqual(['blocker']);
    expect(proposal.placementOrigins['target-a']).toBe('generated');
    expect(proposal.placementOrigins['target-b']).toBe('generated');
    expect(proposal.placementOrigins.blocker).toBeUndefined();
    expect(result.evaluation.state).toMatch(/VALID|DEGRADED/);
  });
});

describe('DND-4.2 integration — determinism', () => {
  it('repeated pipeline runs produce identical outputs (50×)', () => {
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

    const snapshot = {
      intent,
      prominence: { a: 2, b: 10, c: 5 },
    };

    const runOnce = () => {
      const normalized = normalizePlanningProposal(
        snapshot,
        createDeterministicPlanningProposal(snapshot),
      );
      const proposal = createAutoLayoutProposal({
        intent,
        automaticItemOrder: normalized.automaticItemOrder,
      });
      const result = solveLayout({ intent: proposal.effectiveIntent });
      return {
        order: normalized.automaticItemOrder,
        proposal,
        result,
      };
    };

    const first = runOnce();
    for (let i = 0; i < 50; i += 1) {
      expect(runOnce()).toEqual(first);
    }
  });
});

describe('DND-4.2 product-value fixtures', () => {
  const orderSensitiveIntent = () =>
    intentWith({ width: 200, height: 100 }, [
      {
        id: 'blocker',
        constraints: { preferredWidth: 120, preferredHeight: 100, minWidth: 40 },
      },
      {
        id: 'target-a',
        constraints: { preferredWidth: 90, preferredHeight: 100, minWidth: 40 },
      },
      {
        id: 'target-b',
        constraints: { preferredWidth: 90, preferredHeight: 100, minWidth: 40 },
      },
    ]);

  it('Fixture A — prominence order places more automatic items than declaration order', () => {
    const intent = orderSensitiveIntent();
    const baseline = createAutoLayoutProposal({ intent });
    const snapshot = {
      intent,
      prominence: { 'target-a': 10, 'target-b': 5, blocker: 0 },
    };
    const guided = createAutoLayoutProposal({
      intent,
      automaticItemOrder: normalizePlanningProposal(
        snapshot,
        createDeterministicPlanningProposal(snapshot),
      ).automaticItemOrder,
    });

    expect(baseline.unplacedItemIds).toEqual(['target-a', 'target-b']);
    expect(guided.unplacedItemIds).toEqual(['blocker']);
    expect(guided.unplacedItemIds.length).toBeLessThan(baseline.unplacedItemIds.length);
  });

  it('Fixture B — prominent item receives the first viable automatic slot', () => {
    const intent = intentWith(
      { width: 200, height: 100 },
      [
        {
          id: 'pinned',
          constraints: { preferredWidth: 100, preferredHeight: 100, minWidth: 40 },
        },
        {
          id: 'low',
          constraints: { preferredWidth: 90, preferredHeight: 90, minWidth: 40 },
        },
        {
          id: 'high',
          constraints: { preferredWidth: 90, preferredHeight: 90, minWidth: 40 },
        },
      ],
      { pinned: { x: 0, y: 0, width: 100, height: 100 } },
    );

    const baseline = createAutoLayoutProposal({ intent });
    const snapshot = { intent, prominence: { high: 10, low: 0 } };
    const guided = createAutoLayoutProposal({
      intent,
      automaticItemOrder: normalizePlanningProposal(
        snapshot,
        createDeterministicPlanningProposal(snapshot),
      ).automaticItemOrder,
    });

    expect(baseline.placementOrigins.high).toBeUndefined();
    expect(baseline.generatedPlacements.high).toBeUndefined();
    expect(baseline.generatedPlacements.low).toBeDefined();
    expect(guided.generatedPlacements.high).toEqual({ x: 100, y: 0, width: 90, height: 90 });
    expect(guided.placementOrigins.high).toBe('generated');
  });

  it('Fixture C — hybrid source + automatic competition preserves source and provenance', () => {
    const intent = intentWith(
      { width: 200, height: 100 },
      [
        {
          id: 'pinned',
          constraints: { preferredWidth: 100, preferredHeight: 100, minWidth: 40 },
        },
        {
          id: 'low',
          constraints: { preferredWidth: 90, preferredHeight: 90, minWidth: 40 },
        },
        {
          id: 'high',
          constraints: { preferredWidth: 90, preferredHeight: 90, minWidth: 40 },
        },
      ],
      { pinned: { x: 0, y: 0, width: 100, height: 100 } },
    );

    const snapshot = { intent, prominence: { high: 10, low: 0 } };
    const guided = createAutoLayoutProposal({
      intent,
      automaticItemOrder: normalizePlanningProposal(
        snapshot,
        createDeterministicPlanningProposal(snapshot),
      ).automaticItemOrder,
    });

    expect(guided.placementOrigins.pinned).toBe('source');
    expect(guided.effectiveIntent.desiredPlacements?.pinned).toEqual(
      intent.desiredPlacements?.pinned,
    );
    expect(guided.placementOrigins.high).toBe('generated');
    expect(guided.placementOrigins.low).toBeUndefined();
    expect(Object.values(guided.placementOrigins)).not.toContain('intelligence' as never);
    expect(Object.values(guided.placementOrigins)).not.toContain('planner' as never);
  });
});
