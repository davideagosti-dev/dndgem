import type { PlanningProposal, PlanningSnapshot } from './types.js';
import { normalizeAutomaticItemOrder, rankAutomaticItemsByProminence } from './normalize.js';

/**
 * Deterministic local planner (DND-4.2).
 *
 * Emits advisory automatic-item processing order only.
 * Does not call solveLayout/evaluateLayout or compute geometry.
 * Does not mutate caller inputs.
 */
export function createDeterministicPlanningProposal(snapshot: PlanningSnapshot): PlanningProposal {
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
