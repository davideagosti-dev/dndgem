/**
 * @dndgem/angular public entry.
 *
 * Thin Angular adapter over `@dndgem/dom` `createLayoutSession`.
 * Does not own solver semantics or dnd-kit types.
 * In-repository Framework Expansion package (DND-FX.3) — not yet published.
 */

import { getCorePackageInfo } from '@dndgem/core';
import { getDomPackageInfo } from '@dndgem/dom';
import { DnDGemBoardDirective } from './board.directive.js';
import { DnDGemContainerDirective } from './container.directive.js';
import { DnDGemItemDirective } from './item.directive.js';

export const ANGULAR_PACKAGE_NAME = '@dndgem/angular' as const;

export const ANGULAR_PACKAGE_VERSION = '0.1.0-alpha.3' as const;

/**
 * Marker used by workspace smoke tests to prove public exports and workspace links.
 */
export function getAngularPackageInfo(): {
  name: typeof ANGULAR_PACKAGE_NAME;
  version: typeof ANGULAR_PACKAGE_VERSION;
  core: ReturnType<typeof getCorePackageInfo>;
  dom: ReturnType<typeof getDomPackageInfo>;
} {
  return {
    name: ANGULAR_PACKAGE_NAME,
    version: ANGULAR_PACKAGE_VERSION,
    core: getCorePackageInfo(),
    dom: getDomPackageInfo(),
  };
}

export const DNDGEM_BOARD_IMPORTS = [
  DnDGemBoardDirective,
  DnDGemContainerDirective,
  DnDGemItemDirective,
] as const;

export { DnDGemBoard } from './board.js';
export { DnDGemBoardDirective } from './board.directive.js';
export { DnDGemContainerDirective } from './container.directive.js';
export { DnDGemItemDirective } from './item.directive.js';
export { injectDnDGem } from './inject.js';
export type { DnDGemBoardCallbacks, DnDGemBoardConfig, DnDGemItemConfig } from './types.js';
export type {
  DragCancelEvent,
  DragDropResult,
  DragProposal,
  LayoutSessionPlanner,
  LayoutSessionPlannerEvent,
  LayoutSessionState,
} from '@dndgem/dom';
