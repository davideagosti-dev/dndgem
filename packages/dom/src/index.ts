/**
 * @dndgem/dom public entry.
 *
 * DND-1.1: package shell only. No ResizeObserver, measurement, drag, or resize logic yet.
 * May depend on @dndgem/core. Must not depend on React.
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
