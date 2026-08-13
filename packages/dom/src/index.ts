/**
 * @dndgem/dom public entry.
 *
 * DND-1.5: DOM measurement and ResizeObserver-driven snapshot updates.
 * Depends on @dndgem/core. Must not depend on React or dnd-kit.
 *
 * Out of scope here: drag/drop, layout style application, React bindings.
 */

import { getCorePackageInfo } from '@dndgem/core';

export const DOM_PACKAGE_NAME = '@dndgem/dom' as const;

export const DOM_PACKAGE_VERSION = '0.0.0' as const;

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
