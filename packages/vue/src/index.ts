/**
 * @dndgem/vue public entry.
 *
 * Thin Vue adapter over `@dndgem/dom` `createLayoutSession`.
 * Does not own solver semantics or dnd-kit types.
 * In-repository Framework Expansion package (DND-FX.2) — not yet published.
 */

import { getCorePackageInfo } from '@dndgem/core';
import { getDomPackageInfo } from '@dndgem/dom';

export const VUE_PACKAGE_NAME = '@dndgem/vue' as const;

export const VUE_PACKAGE_VERSION = '0.0.0' as const;

/**
 * Marker used by workspace smoke tests to prove public exports and workspace links.
 */
export function getVuePackageInfo(): {
  name: typeof VUE_PACKAGE_NAME;
  version: typeof VUE_PACKAGE_VERSION;
  core: ReturnType<typeof getCorePackageInfo>;
  dom: ReturnType<typeof getDomPackageInfo>;
} {
  return {
    name: VUE_PACKAGE_NAME,
    version: VUE_PACKAGE_VERSION,
    core: getCorePackageInfo(),
    dom: getDomPackageInfo(),
  };
}

export { DnDGemProvider } from './provider.js';
export { useDnDGem, useDnDGemContainer, useDnDGemItem } from './composables.js';
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
