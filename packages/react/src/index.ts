/**
 * @dndgem/react public entry.
 *
 * DND-1.1: package shell only. No AdaptiveGrid or interaction components yet.
 * React is a peer dependency. Product UI bindings belong to DND-1.7.
 */

import { getCorePackageInfo } from '@dndgem/core';
import { getDomPackageInfo } from '@dndgem/dom';

export const REACT_PACKAGE_NAME = '@dndgem/react' as const;

export const REACT_PACKAGE_VERSION = '0.0.0' as const;

/**
 * Marker used by workspace smoke tests to prove public exports and workspace links.
 */
export function getReactPackageInfo(): {
  name: typeof REACT_PACKAGE_NAME;
  version: typeof REACT_PACKAGE_VERSION;
  core: ReturnType<typeof getCorePackageInfo>;
  dom: ReturnType<typeof getDomPackageInfo>;
} {
  return {
    name: REACT_PACKAGE_NAME,
    version: REACT_PACKAGE_VERSION,
    core: getCorePackageInfo(),
    dom: getDomPackageInfo(),
  };
}
