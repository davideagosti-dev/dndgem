import type { Rect, ResolvedLayout } from '@dndgem/core';
import { DomAdapterError } from './errors.js';

/**
 * Inline style descriptor for one resolved item Rect.
 *
 * Positioning model (DND-1.7):
 * - Container is a positioned containing block (`relative` / `absolute` / `fixed`)
 * - Items are `position: absolute` with `box-sizing: border-box`
 * - `left` / `top` / `width` / `height` map 1:1 from Core `Rect` (CSS pixels)
 * - No transform is used for committed layout (provider transforms during drag
 *   remain the provider's concern)
 *
 * Does not set colors, fonts, z-index, or other visual design properties.
 */
export interface LayoutPlacementStyle {
  readonly position: 'absolute';
  readonly boxSizing: 'border-box';
  readonly left: string;
  readonly top: string;
  readonly width: string;
  readonly height: string;
}

export interface ApplyLayoutPlacementsInput {
  readonly items: Readonly<Record<string, HTMLElement>>;
  readonly layout: ResolvedLayout;
  /** Skip writing styles for this item id (active drag source follows the pointer). */
  readonly skipItemId?: string;
}

function px(value: number): string {
  return `${value}px`;
}

/**
 * Deterministic style object for a resolved Rect. Same Rect → same descriptor.
 */
export function layoutPlacementStyle(rect: Rect): LayoutPlacementStyle {
  return {
    position: 'absolute',
    boxSizing: 'border-box',
    left: px(rect.x),
    top: px(rect.y),
    width: px(rect.width),
    height: px(rect.height),
  };
}

function assertStylableElement(value: unknown, label: string): asserts value is HTMLElement {
  if (value === null || value === undefined || typeof value !== 'object') {
    throw new DomAdapterError('INVALID_ELEMENT', `${label} must be a DOM element`);
  }
  const style = (value as HTMLElement).style;
  if (style === null || style === undefined || typeof style !== 'object') {
    throw new DomAdapterError('INVALID_ELEMENT', `${label} must provide a style object`);
  }
}

function writePlacement(element: HTMLElement, rect: Rect): void {
  const next = layoutPlacementStyle(rect);
  const { style } = element;
  style.position = next.position;
  style.boxSizing = next.boxSizing;
  style.left = next.left;
  style.top = next.top;
  style.width = next.width;
  style.height = next.height;
  style.right = '';
  style.bottom = '';
  // Clear leftover provider transforms so committed left/top are not double-offset.
  style.transform = '';
}

/**
 * Apply resolved geometry to mapped elements by ItemId.
 *
 * Mapping is by id, never DOM order. Missing placements are skipped.
 * Unknown layout ids with no mapped element are ignored.
 */
export function applyLayoutPlacements(input: ApplyLayoutPlacementsInput): void {
  if (input === null || typeof input !== 'object') {
    throw new DomAdapterError(
      'INVALID_APPLY_INPUT',
      'ApplyLayoutPlacementsInput must be an object',
    );
  }
  if (input.items === null || typeof input.items !== 'object' || Array.isArray(input.items)) {
    throw new DomAdapterError('INVALID_ITEMS', 'items must be an object map of item id to element');
  }
  if (input.layout === null || typeof input.layout !== 'object') {
    throw new DomAdapterError('INVALID_APPLY_INPUT', 'layout must be a ResolvedLayout');
  }

  const skipItemId = input.skipItemId;
  const placements = input.layout.placements;

  for (const itemId of Object.keys(input.items)) {
    if (skipItemId !== undefined && itemId === skipItemId) {
      continue;
    }
    const rect = placements[itemId];
    if (rect === undefined) {
      continue;
    }
    const element = input.items[itemId];
    assertStylableElement(element, `items["${itemId}"]`);
    writePlacement(element, rect);
  }
}

/**
 * Ensure the container can contain absolutely positioned items.
 * Does not override an already-positioned container (inline or computed).
 * Does not restore the original position on dispose.
 */
export function prepareLayoutContainer(container: HTMLElement): void {
  assertStylableElement(container, 'container');
  const inline = container.style.position;
  if (inline === 'absolute' || inline === 'relative' || inline === 'fixed' || inline === 'sticky') {
    return;
  }
  const view = container.ownerDocument?.defaultView;
  if (view !== null && view !== undefined && typeof view.getComputedStyle === 'function') {
    const computed = view.getComputedStyle(container).position;
    if (
      computed === 'absolute' ||
      computed === 'relative' ||
      computed === 'fixed' ||
      computed === 'sticky'
    ) {
      return;
    }
  }
  if (inline === '' || inline === 'static') {
    container.style.position = 'relative';
  }
}
