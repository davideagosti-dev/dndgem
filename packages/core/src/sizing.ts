import type { Size } from './geometry.js';
import type { LayoutItem } from './item.js';

/**
 * Internal sizing modes shared by the adaptive solver and Auto-Layout proposal
 * engine. Not part of the public Alpha API.
 */
export type SizingMode = 'preferred' | 'useful' | 'minimal';

function clamp(value: number, min: number | undefined, max: number | undefined): number {
  let next = value;
  if (min !== undefined && next < min) {
    next = min;
  }
  if (max !== undefined && next > max) {
    next = max;
  }
  return next;
}

/**
 * Deterministic per-axis size for a sizing mode.
 * Targets are chosen from constraint/measurement fields in a fixed priority list,
 * then clamped to geometric min/max and available space.
 *
 * When hard min exceeds available space, the size stays within available bounds
 * and falls below min → DND-1.3 marks INVALID (honest unsatisfiable geometry).
 */
export function resolveAxisSize(
  mode: SizingMode,
  available: number,
  min: number | undefined,
  max: number | undefined,
  minUseful: number | undefined,
  preferred: number | undefined,
  measured: number | undefined,
): number {
  let target: number;
  if (mode === 'preferred') {
    target = preferred ?? measured ?? minUseful ?? min ?? Math.min(available, max ?? available);
  } else if (mode === 'useful') {
    target = minUseful ?? preferred ?? measured ?? min ?? Math.min(available, max ?? available);
  } else {
    target = min ?? minUseful ?? preferred ?? measured ?? 0;
  }

  target = clamp(target, min, max);

  if (target > available) {
    target = available;
  }

  // Raise to min only when min itself fits in available space.
  if (min !== undefined && target < min) {
    if (min <= available) {
      target = min;
    }
    // else: leave below min → evaluateLayout reports INVALID
  }

  if (max !== undefined && target > max) {
    target = max;
  }

  return target;
}

/** Deterministic size target for an item under a sizing mode and space. */
export function resolveItemSize(item: LayoutItem, mode: SizingMode, space: Size): Size {
  const c = item.constraints;
  const measured = item.measuredSize;
  return {
    width: resolveAxisSize(
      mode,
      space.width,
      c.minWidth,
      c.maxWidth,
      c.minUsefulWidth,
      c.preferredWidth,
      measured?.width,
    ),
    height: resolveAxisSize(
      mode,
      space.height,
      c.minHeight,
      c.maxHeight,
      c.minUsefulHeight,
      c.preferredHeight,
      measured?.height,
    ),
  };
}
