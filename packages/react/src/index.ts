/**
 * @dndgem/react public entry.
 *
 * Thin React adapter over `@dndgem/dom` `createLayoutSession`.
 * Does not own solver semantics or dnd-kit types.
 * Alpha public surface: docs/architecture/alpha-api-contract.md.
 */

import { getCorePackageInfo } from '@dndgem/core';
import { getDomPackageInfo } from '@dndgem/dom';

export const REACT_PACKAGE_NAME = '@dndgem/react' as const;

export const REACT_PACKAGE_VERSION = '0.1.0-alpha.0' as const;

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

export { DnDGemProvider } from './provider.js';
export { useDnDGem, useDnDGemContainer, useDnDGemItem } from './hooks.js';
export type {
  DnDGemItemBinding,
  DnDGemItemConfig,
  DnDGemProviderProps,
  DnDGemStore,
} from './types.js';
export type {
  DragCancelEvent,
  DragDropResult,
  DragProposal,
  LayoutSessionState,
} from '@dndgem/dom';
