import { createLayoutSpace, createRect, type LayoutSpace, type Rect } from '@dndgem/core';
import { DomAdapterError } from './errors.js';

/**
 * Why a mapped item could not be converted into Core geometry.
 * Omissions are explicit — never silent and never Core `INVALID`.
 */
export type DomMeasurementUnavailableReason = 'disconnected';

export interface DomUnavailableMeasurement {
  readonly id: string;
  readonly reason: DomMeasurementUnavailableReason;
}

/**
 * Normalized, Core-compatible snapshot of current DOM geometry.
 *
 * Coordinate convention: container origin is `(0, 0)`. Item `x`/`y` are
 * container-relative (`item.left - container.left`, `item.top - container.top`).
 *
 * Box convention: `getBoundingClientRect()` border-box (actual rendered
 * bounding rectangle, including CSS transforms). Values are CSS pixels as
 * abstract Core layout units — no rounding.
 *
 * Does not retain DOM nodes, observers, CSS, or framework handles.
 */
export interface DomMeasurementSnapshot {
  readonly space: LayoutSpace;
  /** Successfully measured items, keyed by item id string form. */
  readonly measurements: Readonly<Record<string, Rect>>;
  /** Mapped items that could not be measured, in input key order. */
  readonly unavailable: readonly DomUnavailableMeasurement[];
}

export interface MeasureLayoutInput {
  readonly container: HTMLElement;
  /**
   * ItemId → element map. Keys are Core item id strings; DOM node identity
   * is never used as a Core id.
   */
  readonly items: Readonly<Record<string, HTMLElement>>;
}

interface ClientBox {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

function assertItemIdKey(key: string): void {
  if (typeof key !== 'string' || key.length === 0 || key.trim().length === 0) {
    throw new DomAdapterError('INVALID_ITEM_ID', 'Item id must be a non-empty string');
  }
}

function assertMeasurableElement(value: unknown, label: string): asserts value is HTMLElement {
  if (value === null || value === undefined) {
    throw new DomAdapterError('INVALID_ELEMENT', `${label} must be a measurable DOM element`);
  }
  if (
    typeof value !== 'object' ||
    typeof (value as HTMLElement).getBoundingClientRect !== 'function'
  ) {
    throw new DomAdapterError('INVALID_ELEMENT', `${label} must provide getBoundingClientRect()`);
  }
}

function readClientBox(element: HTMLElement, label: string): ClientBox {
  const rect = element.getBoundingClientRect();
  if (rect === null || typeof rect !== 'object') {
    throw new DomAdapterError(
      'NON_FINITE_GEOMETRY',
      `${label} getBoundingClientRect() did not return a box`,
    );
  }

  const left = rect.left;
  const top = rect.top;
  const width = rect.width;
  const height = rect.height;

  if (
    typeof left !== 'number' ||
    typeof top !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    !Number.isFinite(left) ||
    !Number.isFinite(top) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height)
  ) {
    throw new DomAdapterError(
      'NON_FINITE_GEOMETRY',
      `${label} geometry must be finite (NaN and Infinity are rejected)`,
    );
  }

  if (width < 0 || height < 0) {
    throw new DomAdapterError('NEGATIVE_GEOMETRY', `${label} width/height must be >= 0`);
  }

  return { left, top, width, height };
}

function freezeUnavailable(
  list: readonly DomUnavailableMeasurement[],
): readonly DomUnavailableMeasurement[] {
  return Object.freeze(list.map((entry) => Object.freeze({ id: entry.id, reason: entry.reason })));
}

function freezeMeasurements(measurements: Record<string, Rect>): Readonly<Record<string, Rect>> {
  return Object.freeze(measurements);
}

function rectsEqual(a: Rect, b: Rect): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

/**
 * Structural equality for duplicate-snapshot suppression.
 * Key order does not affect equality.
 */
export function snapshotsEqual(a: DomMeasurementSnapshot, b: DomMeasurementSnapshot): boolean {
  if (a.space.width !== b.space.width || a.space.height !== b.space.height) {
    return false;
  }

  const aKeys = Object.keys(a.measurements);
  const bKeys = Object.keys(b.measurements);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  for (const key of aKeys) {
    const left = a.measurements[key];
    const right = b.measurements[key];
    if (left === undefined || right === undefined || !rectsEqual(left, right)) {
      return false;
    }
  }

  if (a.unavailable.length !== b.unavailable.length) {
    return false;
  }
  const other = new Map(b.unavailable.map((entry) => [entry.id, entry.reason]));
  for (const entry of a.unavailable) {
    if (other.get(entry.id) !== entry.reason) {
      return false;
    }
  }
  return true;
}

/**
 * Measure container + items into a Core-compatible snapshot.
 *
 * Reads the container box once and each item box once per call.
 * Does not mutate the DOM or caller-owned input objects.
 */
export function measureLayout(input: MeasureLayoutInput): DomMeasurementSnapshot {
  if (input === null || typeof input !== 'object') {
    throw new DomAdapterError('INVALID_MEASURE_INPUT', 'MeasureLayoutInput must be an object');
  }

  const { container, items } = input;

  if (container === null || container === undefined) {
    throw new DomAdapterError('MISSING_CONTAINER', 'container is required');
  }
  assertMeasurableElement(container, 'container');
  if (!container.isConnected) {
    throw new DomAdapterError(
      'DISCONNECTED_CONTAINER',
      'container must be connected to the document to be measured',
    );
  }

  if (items === null || typeof items !== 'object' || Array.isArray(items)) {
    throw new DomAdapterError('INVALID_ITEMS', 'items must be an object map of item id to element');
  }

  const containerBox = readClientBox(container, 'container');
  const space = createLayoutSpace({
    width: containerBox.width,
    height: containerBox.height,
  });

  const measurements: Record<string, Rect> = {};
  const unavailable: DomUnavailableMeasurement[] = [];

  for (const key of Object.keys(items)) {
    assertItemIdKey(key);
    const element = items[key];
    assertMeasurableElement(element, `items["${key}"]`);

    if (!element.isConnected) {
      unavailable.push({ id: key, reason: 'disconnected' });
      continue;
    }

    const itemBox = readClientBox(element, `items["${key}"]`);
    measurements[key] = createRect({
      x: itemBox.left - containerBox.left,
      y: itemBox.top - containerBox.top,
      width: itemBox.width,
      height: itemBox.height,
    });
  }

  return Object.freeze({
    space,
    measurements: freezeMeasurements(measurements),
    unavailable: freezeUnavailable(unavailable),
  });
}
