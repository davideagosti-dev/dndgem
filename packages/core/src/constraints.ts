import { DomainError } from './errors.js';
import { assertNonNegativeFinite } from './numbers.js';

/**
 * Content + geometry + preference constraints for a layout item.
 *
 * These three families remain semantically distinct (do not collapse them):
 *
 * - Geometric bounds: minWidth/maxWidth/minHeight/maxHeight
 * - Usability thresholds: minUsefulWidth/minUsefulHeight
 * - Preferences: preferredWidth/preferredHeight
 *
 * All fields are optional (partial constraints are permitted).
 * Missing maxima are represented by `undefined` (not Infinity).
 *
 * Validity classification uses these fields in DND-1.3 (`evaluateItemPlacement`).
 */
export interface ContentConstraints {
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly minHeight?: number;
  readonly maxHeight?: number;
  readonly minUsefulWidth?: number;
  readonly minUsefulHeight?: number;
  readonly preferredWidth?: number;
  readonly preferredHeight?: number;
}

/** Writable input shape accepted by {@link createContentConstraints}. */
export interface ContentConstraintsInput {
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly minHeight?: number;
  readonly maxHeight?: number;
  readonly minUsefulWidth?: number;
  readonly minUsefulHeight?: number;
  readonly preferredWidth?: number;
  readonly preferredHeight?: number;
}

const CONSTRAINT_KEYS = [
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'minUsefulWidth',
  'minUsefulHeight',
  'preferredWidth',
  'preferredHeight',
] as const satisfies readonly (keyof ContentConstraints)[];

function readOptionalDimension(
  input: ContentConstraintsInput,
  key: keyof ContentConstraints,
): number | undefined {
  const value = input[key];
  if (value === undefined) {
    return undefined;
  }
  assertNonNegativeFinite(value, key);
  return value;
}

function assertOrdering(
  lower: number | undefined,
  upper: number | undefined,
  lowerLabel: string,
  upperLabel: string,
): void {
  if (lower !== undefined && upper !== undefined && lower > upper) {
    throw new DomainError(
      'CONSTRAINT_ORDER',
      `${lowerLabel} (${lower}) must be <= ${upperLabel} (${upper})`,
    );
  }
}

/**
 * Normalizes and validates content constraints.
 *
 * Invariants (when both sides of a relationship are present):
 * - geometric min <= geometric max (width and height)
 * - minUseful* >= corresponding geometric min
 * - minUseful* <= corresponding geometric max
 * - preferred* within geometric min/max when those bounds exist
 * - preferred* >= corresponding minUseful* when both exist
 *
 * Does not score, classify validity, or apply degradation penalties.
 */
export function createContentConstraints(input: ContentConstraintsInput = {}): ContentConstraints {
  const result: {
    -readonly [K in keyof ContentConstraints]?: number;
  } = {};

  for (const key of CONSTRAINT_KEYS) {
    const value = readOptionalDimension(input, key);
    if (value !== undefined) {
      result[key] = value;
    }
  }

  assertOrdering(result.minWidth, result.maxWidth, 'minWidth', 'maxWidth');
  assertOrdering(result.minHeight, result.maxHeight, 'minHeight', 'maxHeight');

  assertOrdering(result.minWidth, result.minUsefulWidth, 'minWidth', 'minUsefulWidth');
  assertOrdering(result.minHeight, result.minUsefulHeight, 'minHeight', 'minUsefulHeight');
  assertOrdering(result.minUsefulWidth, result.maxWidth, 'minUsefulWidth', 'maxWidth');
  assertOrdering(result.minUsefulHeight, result.maxHeight, 'minUsefulHeight', 'maxHeight');

  assertOrdering(result.minWidth, result.preferredWidth, 'minWidth', 'preferredWidth');
  assertOrdering(result.preferredWidth, result.maxWidth, 'preferredWidth', 'maxWidth');
  assertOrdering(result.minHeight, result.preferredHeight, 'minHeight', 'preferredHeight');
  assertOrdering(result.preferredHeight, result.maxHeight, 'preferredHeight', 'maxHeight');

  assertOrdering(result.minUsefulWidth, result.preferredWidth, 'minUsefulWidth', 'preferredWidth');
  assertOrdering(
    result.minUsefulHeight,
    result.preferredHeight,
    'minUsefulHeight',
    'preferredHeight',
  );

  return Object.freeze(result);
}
