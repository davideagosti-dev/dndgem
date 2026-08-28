/**
 * DND-4.2 intelligence planner benchmarks — timing evidence only (not CI gates).
 */
import { bench, describe } from 'vitest';
import {
  createAutoLayoutProposal,
  createLayoutIntent,
  createLayoutItem,
  solveLayout,
} from '@dndgem/core';
import {
  createDeterministicPlanningProposal,
  normalizePlanningProposal,
  runLayoutPlanner,
} from '@dndgem/intelligence';

function buildSmallFixture() {
  return createLayoutIntent({
    space: { width: 200, height: 100 },
    items: [
      createLayoutItem({
        id: 'blocker',
        constraints: { preferredWidth: 120, preferredHeight: 100, minWidth: 40 },
      }),
      createLayoutItem({
        id: 'target-a',
        constraints: { preferredWidth: 90, preferredHeight: 100, minWidth: 40 },
      }),
      createLayoutItem({
        id: 'target-b',
        constraints: { preferredWidth: 90, preferredHeight: 100, minWidth: 40 },
      }),
    ],
  });
}

function buildMediumFixture(itemCount = 20) {
  const items = [];
  for (let i = 0; i < itemCount; i += 1) {
    items.push(
      createLayoutItem({
        id: `item-${i}`,
        constraints: {
          preferredWidth: 60 + (i % 5) * 10,
          preferredHeight: 40 + (i % 3) * 8,
          minWidth: 20,
        },
      }),
    );
  }
  return createLayoutIntent({
    space: { width: 800, height: 600 },
    items,
  });
}

function prominenceFor(items: readonly { id: string }[]) {
  const prominence: Record<string, number> = {};
  for (let i = 0; i < items.length; i += 1) {
    prominence[items[i]!.id] = items.length - i;
  }
  return prominence;
}

describe('DND-4.2 intelligence planner benchmarks — timing', () => {
  const smallIntent = buildSmallFixture();
  const smallSnapshot = {
    intent: smallIntent,
    prominence: { 'target-a': 10, 'target-b': 5, blocker: 0 },
  };

  bench(
    'planner-only (small order-sensitive)',
    () => {
      createDeterministicPlanningProposal(smallSnapshot);
    },
    { warmupIterations: 20, iterations: 200, time: 0 },
  );

  bench(
    'planner + normalize + auto-layout (small)',
    () => {
      const order = normalizePlanningProposal(
        smallSnapshot,
        createDeterministicPlanningProposal(smallSnapshot),
      ).automaticItemOrder;
      createAutoLayoutProposal({ intent: smallIntent, automaticItemOrder: order });
    },
    { warmupIterations: 20, iterations: 100, time: 0 },
  );

  bench(
    'planner + auto-layout + solveLayout (small)',
    () => {
      const order = normalizePlanningProposal(
        smallSnapshot,
        createDeterministicPlanningProposal(smallSnapshot),
      ).automaticItemOrder;
      const proposal = createAutoLayoutProposal({ intent: smallIntent, automaticItemOrder: order });
      solveLayout({ intent: proposal.effectiveIntent });
    },
    { warmupIterations: 20, iterations: 100, time: 0 },
  );

  const mediumIntent = buildMediumFixture(20);
  const mediumSnapshot = {
    intent: mediumIntent,
    prominence: prominenceFor(mediumIntent.items),
  };

  bench(
    'planner-only (medium ~20 items)',
    () => {
      createDeterministicPlanningProposal(mediumSnapshot);
    },
    { warmupIterations: 10, iterations: 100, time: 0 },
  );

  bench(
    'planner + auto-layout + solveLayout (medium ~20 items)',
    () => {
      const order = normalizePlanningProposal(
        mediumSnapshot,
        createDeterministicPlanningProposal(mediumSnapshot),
      ).automaticItemOrder;
      const proposal = createAutoLayoutProposal({
        intent: mediumIntent,
        automaticItemOrder: order,
      });
      solveLayout({ intent: proposal.effectiveIntent });
    },
    { warmupIterations: 10, iterations: 50, time: 0 },
  );

  const largeIntent = buildMediumFixture(35);
  const largeSnapshot = {
    intent: largeIntent,
    prominence: prominenceFor(largeIntent.items),
  };

  bench(
    'planner + auto-layout + solveLayout (~35 items)',
    () => {
      const order = normalizePlanningProposal(
        largeSnapshot,
        createDeterministicPlanningProposal(largeSnapshot),
      ).automaticItemOrder;
      const proposal = createAutoLayoutProposal({
        intent: largeIntent,
        automaticItemOrder: order,
      });
      solveLayout({ intent: proposal.effectiveIntent });
    },
    { warmupIterations: 5, iterations: 30, time: 0 },
  );
});

describe('DND-4.3 orchestrator benchmarks — timing', () => {
  const smallIntent = buildSmallFixture();
  const smallSnapshot = {
    intent: smallIntent,
    prominence: { 'target-a': 10, 'target-b': 5, blocker: 0 },
  };

  bench(
    'orchestrator + sync deterministic planner (small)',
    async () => {
      await runLayoutPlanner({
        snapshot: smallSnapshot,
        planner: createDeterministicPlanningProposal,
        context: { requestId: 1 },
      });
    },
    { warmupIterations: 20, iterations: 100, time: 0 },
  );

  bench(
    'orchestrator + async-resolved custom planner (small)',
    async () => {
      await runLayoutPlanner({
        snapshot: smallSnapshot,
        planner: async () => ({
          automaticItemOrder: ['target-a', 'target-b', 'blocker'],
        }),
        context: { requestId: 1 },
      });
    },
    { warmupIterations: 20, iterations: 100, time: 0 },
  );

  bench(
    'orchestrator normalize path + auto-layout (small)',
    async () => {
      const result = await runLayoutPlanner({
        snapshot: smallSnapshot,
        planner: createDeterministicPlanningProposal,
        context: { requestId: 1 },
      });
      createAutoLayoutProposal({
        intent: smallIntent,
        automaticItemOrder: result.proposal.automaticItemOrder,
      });
    },
    { warmupIterations: 20, iterations: 100, time: 0 },
  );
});
