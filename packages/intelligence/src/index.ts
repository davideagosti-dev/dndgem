/**
 * @dndgem/intelligence — private layout planner layer (DND-4.2 / DND-4.3).
 *
 * Experimental workspace package. Not published. Not part of the Alpha public surface.
 * Framework adapters and the DOM package do not depend on this package.
 */

export { createDeterministicPlanningProposal, normalizePlanningProposal } from './planner.js';

export { createOrchestratedLayoutPlanner, runLayoutPlanner } from './orchestrator.js';

export {
  listAutomaticItemIds,
  normalizeAutomaticItemOrder,
  rankAutomaticItemsByProminence,
} from './normalize.js';

export type {
  LayoutPlanner,
  PlannerContext,
  PlannerFallbackReason,
  PlannerProposalSource,
  PlannerRunResult,
  PlannerRunStatus,
  PlanningProposal,
  PlanningSnapshot,
} from './types.js';
