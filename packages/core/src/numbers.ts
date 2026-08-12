import { DomainError } from './errors.js';

/**
 * Asserts `value` is a finite number (rejects NaN, ±Infinity, non-numbers).
 */
export function assertFiniteNumber(value: unknown, label: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new DomainError(
      'NON_FINITE_NUMBER',
      `${label} must be a finite number (NaN and Infinity are rejected)`,
    );
  }
}

/**
 * Asserts `value` is a finite number >= 0.
 * Zero is permitted (empty / collapsed sizes are representable).
 */
export function assertNonNegativeFinite(value: unknown, label: string): asserts value is number {
  assertFiniteNumber(value, label);
  if (value < 0) {
    throw new DomainError('NEGATIVE_NUMBER', `${label} must be >= 0`);
  }
}
