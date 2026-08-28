import type { LayoutPlanner, PlanningProposal, PlanningSnapshot } from './types.js';
import { normalizeAutomaticItemOrder, rankAutomaticItemsByProminence } from './normalize.js';

/**
 * Deterministic local planner (DND-4.2 / DND-4.3).
 *
 * Emits advisory automatic-item processing order only.
 * Does not call solveLayout/evaluateLayout or compute geometry.
 * Does not mutate caller inputs.
 *
 * Satisfies {@link LayoutPlanner} while remaining synchronous and pure.
 * Optional PlannerContext is accepted for contract compatibility and ignored.
 */
export function createDeterministicPlanningProposal(
  snapshot: PlanningSnapshot,
  _context?: Parameters<LayoutPlanner>[1],
): PlanningProposal {
  void _context;
  const automaticItemOrder = rankAutomaticItemsByProminence(snapshot.intent, snapshot.prominence);

  return Object.freeze({
    automaticItemOrder: Object.freeze([...automaticItemOrder]),
  });
}

/**
 * Normalize an advisory PlanningProposal against a snapshot.
 * Reusable trust-boundary for DND-4.3 async planners.
 */
export function normalizePlanningProposal(
  snapshot: PlanningSnapshot,
  proposal: PlanningProposal,
): PlanningProposal {
  const automaticItemOrder = normalizeAutomaticItemOrder(
    snapshot.intent,
    proposal.automaticItemOrder,
  );

  return Object.freeze({
    automaticItemOrder: Object.freeze([...automaticItemOrder]),
  });
}
