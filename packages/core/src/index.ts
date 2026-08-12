/**
 * @dndgem/core public entry.
 *
 * DND-1.1: package shell only. No constraint model, validity engine, or solver.
 * This package MUST remain renderer-agnostic (no DOM, React, or dnd-kit imports).
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
