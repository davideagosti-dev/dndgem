import { assertFiniteNumber, assertNonNegativeFinite } from './numbers.js';

/**
 * Normalized layout-space point.
 * Coordinates are finite numbers in abstract layout units (not CSS px/rem/etc.).
 * Negative coordinates are allowed (placement outside the origin is representable).
 */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Normalized layout-space size.
 * Width/height are finite and >= 0. Zero is valid (collapsed / empty).
 * Values are abstract layout units — not CSS length units.
 */
export interface Size {
  readonly width: number;
  readonly height: number;
}

/**
 * Axis-aligned rectangle in normalized layout space.
 * Not a CSS box model: no margin/border/padding concepts.
 */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface RectInput {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export function createPoint(x: number, y: number): Point {
  assertFiniteNumber(x, 'x');
  assertFiniteNumber(y, 'y');
  return Object.freeze({ x, y });
}

export function createSize(width: number, height: number): Size {
  assertNonNegativeFinite(width, 'width');
  assertNonNegativeFinite(height, 'height');
  return Object.freeze({ width, height });
}

export function createRect(input: RectInput): Rect {
  assertFiniteNumber(input.x, 'x');
  assertFiniteNumber(input.y, 'y');
  assertNonNegativeFinite(input.width, 'width');
  assertNonNegativeFinite(input.height, 'height');
  return Object.freeze({
    x: input.x,
    y: input.y,
    width: input.width,
    height: input.height,
  });
}
