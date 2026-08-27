/**
 * DND-4.2 intelligence planner semantic benchmarks — CI-safe checks only.
 */
import { describe, expect, it } from 'vitest';
import { createAutoLayoutProposal, createLayoutIntent, createLayoutItem } from '@dndgem/core';
import {
  createDeterministicPlanningProposal,
  normalizePlanningProposal,
} from '@dndgem/intelligence';

function orderSensitiveIntent() {
  return createLayoutIntent({
    space: { width: 200, height: 100 },
    items: [
      createLayoutItem({
        id: 'blocker',
        constraints: {
          preferredWidth: 120,
          preferredHeight: 100,
          minWidth: 40,
        },
      }),
      createLayoutItem({
        id: 'target-a',
        constraints: {
          preferredWidth: 90,
          preferredHeight: 100,
          minWidth: 40,
        },
      }),
      createLayoutItem({
        id: 'target-b',
        constraints: {
          preferredWidth: 90,
          preferredHeight: 100,
          minWidth: 40,
        },
      }),
    ],
  });
}

describe('DND-4.2 intelligence planner — semantic gates', () => {
  it('planner guidance reduces unplaced automatic items on order-sensitive fixture', () => {
    const intent = orderSensitiveIntent();
    const snapshot = {
      intent,
      prominence: { 'target-a': 10, 'target-b': 5, blocker: 0 },
    };
    const baseline = createAutoLayoutProposal({ intent });
    const guided = createAutoLayoutProposal({
      intent,
      automaticItemOrder: normalizePlanningProposal(
        snapshot,
        createDeterministicPlanningProposal(snapshot),
      ).automaticItemOrder,
    });

    expect(baseline.unplacedItemIds.length).toBeGreaterThan(guided.unplacedItemIds.length);
    expect(guided.unplacedItemIds).toEqual(['blocker']);
  });

  it('planner-only output is deterministic across repeated runs (50×)', () => {
    const intent = orderSensitiveIntent();
    const snapshot = {
      intent,
      prominence: { 'target-a': 10, 'target-b': 5, blocker: 0 },
    };
    const first = createDeterministicPlanningProposal(snapshot);
    for (let i = 0; i < 50; i += 1) {
      expect(createDeterministicPlanningProposal(snapshot)).toEqual(first);
    }
  });

  it('end-to-end planner + auto-layout proposal order stays stable (50×)', () => {
    const intent = orderSensitiveIntent();
    const snapshot = {
      intent,
      prominence: { 'target-a': 10, 'target-b': 5, blocker: 0 },
    };

    const run = () => {
      const order = normalizePlanningProposal(
        snapshot,
        createDeterministicPlanningProposal(snapshot),
      ).automaticItemOrder;
      return createAutoLayoutProposal({ intent, automaticItemOrder: order });
    };

    const first = run();
    for (let i = 0; i < 50; i += 1) {
      expect(run()).toEqual(first);
    }
  });
});
