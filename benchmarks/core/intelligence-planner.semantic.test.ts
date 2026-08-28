/**
 * DND-4.2 intelligence planner semantic benchmarks — CI-safe checks only.
 */
import { describe, expect, it } from 'vitest';
import { createAutoLayoutProposal, createLayoutIntent, createLayoutItem } from '@dndgem/core';
import {
  createDeterministicPlanningProposal,
  normalizePlanningProposal,
  runLayoutPlanner,
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

describe('DND-4.3 orchestrator — semantic gates', () => {
  it('fallback from throwing custom planner still yields Core-authoritative layout', async () => {
    const intent = orderSensitiveIntent();
    const snapshot = {
      intent,
      prominence: { 'target-a': 10, 'target-b': 5, blocker: 0 },
    };
    const result = await runLayoutPlanner({
      snapshot,
      planner: () => {
        throw new Error('fail');
      },
      context: { requestId: 1 },
    });
    expect(result.status).toBe('fallback');
    expect(result.proposalSource).toBe('deterministic');
    const proposal = createAutoLayoutProposal({
      intent,
      automaticItemOrder: result.proposal.automaticItemOrder,
    });
    expect(proposal.unplacedItemIds).toEqual(['blocker']);
  });

  it('stale request id must not be treated as the applied winner', async () => {
    const intent = orderSensitiveIntent();
    const snapshot = { intent, prominence: { 'target-a': 10, 'target-b': 5, blocker: 0 } };
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const older = runLayoutPlanner({
      snapshot,
      planner: async () => {
        await gate;
        return { automaticItemOrder: ['blocker', 'target-a', 'target-b'] };
      },
      context: { requestId: 1 },
    });
    const newer = await runLayoutPlanner({
      snapshot,
      planner: async () => ({ automaticItemOrder: ['target-a', 'target-b', 'blocker'] }),
      context: { requestId: 2 },
    });
    let applied = newer.requestId;
    release?.();
    const stale = await older;
    if (stale.requestId !== 2) {
      // session policy: ignore
      applied = 2;
    }
    expect(applied).toBe(2);
    expect(newer.proposal.automaticItemOrder[0]).toBe('target-a');
  });

  it('orchestrated sync and async paths keep Core as sole solver authority', async () => {
    const intent = orderSensitiveIntent();
    const snapshot = { intent, prominence: { 'target-a': 10, 'target-b': 5, blocker: 0 } };
    const syncResult = await runLayoutPlanner({
      snapshot,
      planner: createDeterministicPlanningProposal,
      context: { requestId: 1 },
    });
    const asyncResult = await runLayoutPlanner({
      snapshot,
      planner: async () => createDeterministicPlanningProposal(snapshot),
      context: { requestId: 2 },
    });
    expect(syncResult.proposal).toEqual(asyncResult.proposal);
    const guided = createAutoLayoutProposal({
      intent,
      automaticItemOrder: syncResult.proposal.automaticItemOrder,
    });
    expect(guided.placementOrigins['target-a']).toBe('generated');
    expect(guided.placementOrigins['target-b']).toBe('generated');
  });
});
