/**
 * @dndgem/intelligence — private deterministic layout planner (DND-4.2).
 *
 * Experimental workspace package. Not published. Not part of the Alpha public surface.
 * Framework adapters do not depend on this package in DND-4.2.
 */

export { createDeterministicPlanningProposal, normalizePlanningProposal } from './planner.js';

export {
  listAutomaticItemIds,
  normalizeAutomaticItemOrder,
  rankAutomaticItemsByProminence,
} from './normalize.js';

export type { PlanningProposal, PlanningSnapshot } from './types.js';
