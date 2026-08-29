/**
 * @dndgem/svelte public entry.
 *
 * Thin Svelte 5 adapter over `@dndgem/dom` `createLayoutSession`.
 * Does not own solver semantics or dnd-kit types.
 * In-repository Framework Expansion package (DND-FX.4) — not yet published.
 */

import { getCorePackageInfo } from '@dndgem/core';
import { getDomPackageInfo } from '@dndgem/dom';

export const SVELTE_PACKAGE_NAME = '@dndgem/svelte' as const;

export const SVELTE_PACKAGE_VERSION = '0.1.0-alpha.4' as const;

/**
 * Marker used by workspace smoke tests to prove public exports and workspace links.
 */
export function getSveltePackageInfo(): {
  name: typeof SVELTE_PACKAGE_NAME;
  version: typeof SVELTE_PACKAGE_VERSION;
  core: ReturnType<typeof getCorePackageInfo>;
  dom: ReturnType<typeof getDomPackageInfo>;
} {
  return {
    name: SVELTE_PACKAGE_NAME,
    version: SVELTE_PACKAGE_VERSION,
    core: getCorePackageInfo(),
    dom: getDomPackageInfo(),
  };
}

export { default as DnDGemProvider } from './DnDGemProvider.svelte';
export { dndgemContainer, dndgemItem } from './actions.js';
export { getDnDGem } from './get-dndgem.js';
export type {
  DnDGemItemConfig,
  DnDGemProviderProps,
  DnDGemSnippetProps,
  DnDGemStore,
} from './types.js';
export type {
  DragCancelEvent,
  DragDropResult,
  DragProposal,
  LayoutSessionPlanner,
  LayoutSessionPlannerEvent,
  LayoutSessionState,
} from '@dndgem/dom';
