import { describe, expect, it, vi } from 'vitest';
// vi used for planner call spies
import { createContentConstraints, createLayoutIntent, createLayoutItem } from '@dndgem/core';
import {
  createDeterministicPlanningProposal,
  createOrchestratedLayoutPlanner,
  normalizePlanningProposal,
  runLayoutPlanner,
  type LayoutPlanner,
  type PlanningSnapshot,
} from '../src/index.js';

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

function baseSnapshot(): PlanningSnapshot {
  return {
    intent: intentWith({ width: 400, height: 300 }, [{ id: 'a' }, { id: 'b' }, { id: 'c' }]),
    prominence: { c: 10, a: 1, b: 5 },
  };
}

describe('LayoutPlanner contract', () => {
  it('deterministic planner conforms as a sync LayoutPlanner', () => {
    const planner: LayoutPlanner = createDeterministicPlanningProposal;
    const snapshot = baseSnapshot();
    const result = planner(snapshot, { requestId: 1 });
    expect(result).not.toBeInstanceOf(Promise);
    expect(result).toEqual({ automaticItemOrder: ['c', 'b', 'a'] });
  });

  it('accepts a custom sync planner', async () => {
    const planner: LayoutPlanner = () => ({
      automaticItemOrder: ['b', 'c', 'a'],
    });
    const result = await runLayoutPlanner({
      snapshot: baseSnapshot(),
      planner,
      context: { requestId: 2 },
    });
    expect(result.status).toBe('ok');
    expect(result.proposalSource).toBe('custom');
    expect(result.proposal.automaticItemOrder).toEqual(['b', 'c', 'a']);
  });

  it('accepts a custom async planner', async () => {
    const planner: LayoutPlanner = async () => ({
      automaticItemOrder: ['c', 'a', 'b'],
    });
    const result = await runLayoutPlanner({
      snapshot: baseSnapshot(),
      planner,
      context: { requestId: 3 },
    });
    expect(result.status).toBe('ok');
    expect(result.proposal.automaticItemOrder).toEqual(['c', 'a', 'b']);
  });
});

describe('runLayoutPlanner normalization', () => {
  it('normalizes every successful custom proposal', async () => {
    const snapshot = baseSnapshot();
    const planner: LayoutPlanner = () => ({
      automaticItemOrder: ['ghost', 'c', 'c', 'a', 'source-not-present'],
    });
    const result = await runLayoutPlanner({ snapshot, planner, context: { requestId: 1 } });
    expect(result.proposal.automaticItemOrder).toEqual(['c', 'a', 'b']);
  });

  it('removes source intent ids and appends omitted automatic ids', async () => {
    const snapshot: PlanningSnapshot = {
      intent: intentWith(
        { width: 400, height: 300 },
        [{ id: 'pinned' }, { id: 'a' }, { id: 'b' }],
        { pinned: { x: 0, y: 0, width: 40, height: 40 } },
      ),
    };
    const planner: LayoutPlanner = () => ({
      automaticItemOrder: ['pinned', 'b'],
    });
    const result = await runLayoutPlanner({ snapshot, planner, context: { requestId: 1 } });
    expect(result.proposal.automaticItemOrder).toEqual(['b', 'a']);
  });

  it('falls back to declaration order for empty/unusable proposals', async () => {
    const snapshot = baseSnapshot();
    const planner: LayoutPlanner = () => ({ automaticItemOrder: ['ghost'] });
    const result = await runLayoutPlanner({ snapshot, planner, context: { requestId: 1 } });
    expect(result.proposal.automaticItemOrder).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate caller snapshot or proposal', async () => {
    const snapshot = baseSnapshot();
    const order = ['c', 'b', 'a'] as string[];
    const planner: LayoutPlanner = () => ({ automaticItemOrder: order });
    const result = await runLayoutPlanner({ snapshot, planner, context: { requestId: 1 } });
    order.push('mutated');
    expect(snapshot.prominence).toEqual({ c: 10, a: 1, b: 5 });
    expect(result.proposal.automaticItemOrder).toEqual(['c', 'b', 'a']);
  });
});

describe('runLayoutPlanner failure fallback', () => {
  it('sync throw → deterministic fallback', async () => {
    const snapshot = baseSnapshot();
    const planner: LayoutPlanner = () => {
      throw new Error('boom');
    };
    const result = await runLayoutPlanner({ snapshot, planner, context: { requestId: 1 } });
    expect(result.status).toBe('fallback');
    expect(result.proposalSource).toBe('deterministic');
    expect(result.fallbackReason).toBe('planner-throw');
    expect(result.proposal.automaticItemOrder).toEqual(['c', 'b', 'a']);
  });

  it('async reject → deterministic fallback', async () => {
    const snapshot = baseSnapshot();
    const planner: LayoutPlanner = async () => {
      throw new Error('reject');
    };
    const result = await runLayoutPlanner({ snapshot, planner, context: { requestId: 1 } });
    expect(result.status).toBe('fallback');
    expect(result.proposalSource).toBe('deterministic');
    expect(result.proposal.automaticItemOrder).toEqual(['c', 'b', 'a']);
  });

  it('no planner → deterministic local planner', async () => {
    const snapshot = baseSnapshot();
    const result = await runLayoutPlanner({ snapshot, context: { requestId: 1 } });
    expect(result.status).toBe('ok');
    expect(result.proposalSource).toBe('deterministic');
    expect(result.proposal.automaticItemOrder).toEqual(['c', 'b', 'a']);
  });

  it('deterministic failure → declaration-order fallback', async () => {
    const snapshot = baseSnapshot();
    const planner: LayoutPlanner = () => {
      throw new Error('custom fail');
    };
    const deterministicPlanner: LayoutPlanner = () => {
      throw new Error('deterministic fail');
    };
    const result = await runLayoutPlanner({
      snapshot,
      planner,
      deterministicPlanner,
      context: { requestId: 1 },
    });
    expect(result.status).toBe('fallback');
    expect(result.proposalSource).toBe('declaration');
    expect(result.proposal.automaticItemOrder).toEqual(['a', 'b', 'c']);
  });
});

describe('runLayoutPlanner cancellation', () => {
  it('pre-aborted signal yields cancelled and does not invoke planner', async () => {
    const snapshot = baseSnapshot();
    const planner = vi.fn<LayoutPlanner>(() => ({ automaticItemOrder: ['a', 'b', 'c'] }));
    const controller = new AbortController();
    controller.abort();
    const result = await runLayoutPlanner({
      snapshot,
      planner,
      context: { requestId: 7, signal: controller.signal },
    });
    expect(planner).not.toHaveBeenCalled();
    expect(result.status).toBe('cancelled');
    expect(result.fallbackReason).toBe('cancelled');
  });

  it('abort during async planner yields cancelled', async () => {
    const snapshot = baseSnapshot();
    const controller = new AbortController();
    const planner: LayoutPlanner = async () => {
      controller.abort();
      return { automaticItemOrder: ['c', 'b', 'a'] };
    };
    const result = await runLayoutPlanner({
      snapshot,
      planner,
      context: { requestId: 8, signal: controller.signal },
    });
    expect(result.status).toBe('cancelled');
  });
});

describe('stale request orchestration evidence', () => {
  it('latest valid request wins when older async resolves later', async () => {
    const snapshot = baseSnapshot();
    let releaseA: (() => void) | undefined;
    const gateA = new Promise<void>((resolve) => {
      releaseA = resolve;
    });

    const plannerA: LayoutPlanner = async () => {
      await gateA;
      return { automaticItemOrder: ['a', 'b', 'c'] };
    };
    const plannerB: LayoutPlanner = async () => ({
      automaticItemOrder: ['c', 'b', 'a'],
    });

    const started: PlannerRunResultLike[] = [];
    type PlannerRunResultLike = Awaited<ReturnType<typeof runLayoutPlanner>>;

    const requestA = runLayoutPlanner({
      snapshot,
      planner: plannerA,
      context: { requestId: 1 },
    }).then((result) => {
      started.push(result);
      return result;
    });
    const requestB = runLayoutPlanner({
      snapshot,
      planner: plannerB,
      context: { requestId: 2 },
    }).then((result) => {
      started.push(result);
      return result;
    });

    const b = await requestB;
    expect(b.requestId).toBe(2);
    expect(b.proposal.automaticItemOrder).toEqual(['c', 'b', 'a']);

    // Session-layer policy: only apply if requestId is still current.
    let appliedRequestId = 0;
    const applyIfCurrent = (result: PlannerRunResultLike, currentId: number): boolean => {
      if (result.status === 'cancelled' || result.requestId !== currentId) {
        return false;
      }
      appliedRequestId = result.requestId;
      return true;
    };

    const currentId = 2;
    expect(applyIfCurrent(b, currentId)).toBe(true);
    expect(appliedRequestId).toBe(2);

    releaseA?.();
    const a = await requestA;
    expect(a.requestId).toBe(1);
    expect(applyIfCurrent(a, currentId)).toBe(false);
    expect(appliedRequestId).toBe(2);
  });
});

describe('deterministic planner unchanged under contract', () => {
  it('prominence DESC → declaration ASC → itemId ASC', () => {
    const snapshot = baseSnapshot();
    const direct = createDeterministicPlanningProposal(snapshot);
    const withContext = createDeterministicPlanningProposal(snapshot, { requestId: 99 });
    expect(direct).toEqual(withContext);
    expect(direct.automaticItemOrder).toEqual(['c', 'b', 'a']);
  });

  it('normalizePlanningProposal remains the trust boundary', () => {
    const snapshot = baseSnapshot();
    const normalized = normalizePlanningProposal(snapshot, {
      automaticItemOrder: ['ghost', 'c', 'a'],
    });
    expect(normalized.automaticItemOrder).toEqual(['c', 'a', 'b']);
  });
});

describe('createOrchestratedLayoutPlanner', () => {
  it('returns a LayoutPlanner that normalizes and falls back', async () => {
    const orchestrated = createOrchestratedLayoutPlanner(() => {
      throw new Error('fail');
    });
    const proposal = await orchestrated(baseSnapshot(), { requestId: 1 });
    expect(proposal.automaticItemOrder).toEqual(['c', 'b', 'a']);
  });
});
