import {
  createContentConstraints,
  type ContentConstraints,
  type ContentConstraintsInput,
} from './constraints.js';
import { createSize, type Size } from './geometry.js';
import { createItemId, type ItemId } from './identity.js';

/**
 * Renderer-neutral layout participant.
 *
 * Must not carry HTMLElement, ReactNode, CSS, or other renderer handles.
 * Measured size, when present, is already normalized by an adapter.
 */
export interface LayoutItem {
  readonly id: ItemId;
  readonly constraints: ContentConstraints;
  /**
   * Optional normalized intrinsic / measured size from a renderer adapter.
   * Core does not know how it was obtained (DOM, Flutter, fixtures, etc.).
   */
  readonly measuredSize?: Size;
}

export interface LayoutItemInput {
  readonly id: string | ItemId;
  readonly constraints?: ContentConstraintsInput;
  readonly measuredSize?: { readonly width: number; readonly height: number };
}

/**
 * Builds an immutable {@link LayoutItem}.
 */
export function createLayoutItem(input: LayoutItemInput): LayoutItem {
  const id = createItemId(input.id);
  const constraints = createContentConstraints(input.constraints ?? {});
  const item: {
    -readonly [K in keyof LayoutItem]?: LayoutItem[K];
  } = {
    id,
    constraints,
  };

  if (input.measuredSize !== undefined) {
    item.measuredSize = createSize(input.measuredSize.width, input.measuredSize.height);
  }

  return Object.freeze(item) as LayoutItem;
}
