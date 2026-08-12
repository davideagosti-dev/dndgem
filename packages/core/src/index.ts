/**
 * @dndgem/core public entry.
 *
 * DND-1.2: renderer-agnostic domain model and content constraints.
 * This package MUST remain renderer-agnostic (no DOM, React, or dnd-kit imports).
 *
 * Out of scope here: validity engine, scoring, solver/reflow, DOM measurement, DnD.
 */

export const CORE_PACKAGE_NAME = '@dndgem/core' as const;

export const CORE_PACKAGE_VERSION = '0.0.0' as const;

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
