/**
 * @dndgem/core public entry.
 *
 * DND-1.2: renderer-agnostic domain model and content constraints.
 * DND-1.3: deterministic validity evaluation and layout scoring.
 * DND-1.4: deterministic adaptive solver and reflow.
 *
 * This package MUST remain renderer-agnostic (no DOM, React, or dnd-kit imports).
 * Alpha public surface: docs/architecture/alpha-api-contract.md.
 *
 * Out of scope here: DOM measurement, DnD interaction, framework bindings.
 */

export const CORE_PACKAGE_NAME = '@dndgem/core' as const;

export const CORE_PACKAGE_VERSION = '0.1.0-alpha.1' as const;

/**
 * Marker used by workspace smoke tests to prove the public export resolves.
 */
export function getCorePackageInfo(): {
  name: typeof CORE_PACKAGE_NAME;
  version: typeof CORE_PACKAGE_VERSION;
} {
  return {
    name: CORE_PACKAGE_NAME,
    version: CORE_PACKAGE_VERSION,
  };
}

export { DomainError } from './errors.js';

export { LAYOUT_SCHEMA_VERSION, type LayoutSchemaVersion } from './schema.js';

export { VALIDITY_STATES, type ValidityState } from './validity.js';

export {
  createPoint,
  createRect,
  createSize,
  type Point,
  type Rect,
  type RectInput,
  type Size,
} from './geometry.js';

export { createItemId, itemIdToString, itemIdsEqual, type ItemId } from './identity.js';

export {
  createContentConstraints,
  type ContentConstraints,
  type ContentConstraintsInput,
} from './constraints.js';

export { createLayoutItem, type LayoutItem, type LayoutItemInput } from './item.js';

export { createLayoutSpace, type LayoutSpace, type LayoutSpaceInput } from './space.js';

export {
  createLayoutIntent,
  listLayoutIntentItemIds,
  type LayoutIntent,
  type LayoutIntentInput,
} from './intent.js';

export { createResolvedLayout, type ResolvedLayout, type ResolvedLayoutInput } from './resolved.js';

export {
  SCORE_PREFERENCE_WEIGHT,
  SCORE_USEFULNESS_WEIGHT,
  VALIDITY_REASON_CODES,
  evaluateConstraintsPlacement,
  evaluateItemPlacement,
  evaluateLayout,
  type ItemPlacementEvaluation,
  type LayoutEvaluation,
  type ScoreBreakdown,
  type ValidityAxis,
  type ValidityReason,
  type ValidityReasonCode,
  type ValidityReasonKind,
} from './evaluate.js';

export {
  solveLayout,
  type SolverCandidateSummary,
  type SolverInput,
  type SolverResult,
  type SolverSelectionCode,
  type SolverSelectionReason,
  type SolverStrategy,
} from './solve.js';

/**
 * Deterministic Auto-Layout proposal (DND-3.4 public Alpha).
 * Compose with {@link solveLayout}; does not replace solver authority.
 * Algorithm helpers such as `maxProbeCountForOccupancy` remain INTERNAL.
 */
export {
  createAutoLayoutProposal,
  type AutoLayoutProposal,
  type AutoLayoutProposalInput,
  type PlacementOrigin,
} from './auto-layout.js';
