import { createSize, type Size } from './geometry.js';

/**
 * Available layout space / container bounds in normalized units.
 *
 * Structurally a size, named separately so callers distinguish
 * "container available area" from an item's measured size.
 */
export type LayoutSpace = Size;

export interface LayoutSpaceInput {
  readonly width: number;
  readonly height: number;
}

export function createLayoutSpace(input: LayoutSpaceInput): LayoutSpace {
  return createSize(input.width, input.height);
}
