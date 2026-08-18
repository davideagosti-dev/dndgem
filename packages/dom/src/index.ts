/**
 * @dndgem/dom public entry.
 *
 * DND-1.5: DOM measurement and ResizeObserver-driven snapshot updates.
 * DND-1.6: vendor-isolated drag interaction that produces LayoutIntent
 * proposals for the Core solver.
 * DND-1.7: layout session orchestration and resolved-geometry application.
 *
 * Depends on @dndgem/core. Must not depend on React. @dnd-kit/dom is an
 * internal implementation detail.
 * Alpha public surface: docs/architecture/alpha-api-contract.md.
 */

import { getCorePackageInfo } from '@dndgem/core';

export const DOM_PACKAGE_NAME = '@dndgem/dom' as const;

export const DOM_PACKAGE_VERSION = '0.1.0-alpha.2' as const;

/**
 * Marker used by workspace smoke tests to prove the public export resolves
 * and that the core workspace link is healthy.
 */
export function getDomPackageInfo(): {
  name: typeof DOM_PACKAGE_NAME;
  version: typeof DOM_PACKAGE_VERSION;
  core: ReturnType<typeof getCorePackageInfo>;
} {
  return {
    name: DOM_PACKAGE_NAME,
    version: DOM_PACKAGE_VERSION,
    core: getCorePackageInfo(),
  };
}

export { DomAdapterError } from './errors.js';

export {
  measureLayout,
  type DomMeasurementSnapshot,
  type DomMeasurementUnavailableReason,
  type DomUnavailableMeasurement,
  type MeasureLayoutInput,
} from './measure.js';

export {
  observeLayout,
  type DomMeasurementObserver,
  type ObserveLayoutInput,
  type ResizeObserverConstructor,
} from './observe.js';

export {
  createDragInteraction,
  type DragCancelEvent,
  type DragDropEvent,
  type DragDropResult,
  type DragInteraction,
  type DragInteractionInput,
  type DragInteractionState,
  type DragMechanicsAdapter,
  type DragMechanicsContext,
  type DragMechanicsSession,
  type DragPhase,
  type DragPointerCancel,
  type DragPointerEnd,
  type DragPointerMove,
  type DragPointerStart,
  type DragProposal,
  type DragProposalEvent,
  type DragStartEvent,
  type DragTranslation,
} from './interaction.js';

export {
  applyLayoutPlacements,
  layoutPlacementStyle,
  prepareLayoutContainer,
  type ApplyLayoutPlacementsInput,
  type LayoutPlacementStyle,
} from './apply.js';

export {
  createLayoutSession,
  type LayoutSession,
  type LayoutSessionAutoLayoutState,
  type LayoutSessionInput,
  type LayoutSessionItemInput,
  type LayoutSessionState,
} from './session.js';
