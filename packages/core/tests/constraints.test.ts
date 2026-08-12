import { describe, expect, it } from 'vitest';
import { DomainError, createContentConstraints } from '../src/index.js';

describe('ContentConstraints', () => {
  it('allows empty and partial constraints', () => {
    expect(createContentConstraints()).toEqual({});
    expect(createContentConstraints({ minWidth: 10, preferredHeight: 20 })).toEqual({
      minWidth: 10,
      preferredHeight: 20,
    });
  });

  it('accepts equal min/max and useful boundaries', () => {
    expect(
      createContentConstraints({
        minWidth: 100,
        maxWidth: 100,
        minUsefulWidth: 100,
        preferredWidth: 100,
      }),
    ).toMatchObject({
      minWidth: 100,
      maxWidth: 100,
      minUsefulWidth: 100,
      preferredWidth: 100,
    });
  });

  it('keeps geometric, useful, and preferred fields distinct', () => {
    const constraints = createContentConstraints({
      minWidth: 40,
      maxWidth: 400,
      minUsefulWidth: 120,
      preferredWidth: 200,
      minHeight: 20,
      maxHeight: 300,
      minUsefulHeight: 80,
      preferredHeight: 160,
    });

    expect(constraints.minWidth).toBe(40);
    expect(constraints.minUsefulWidth).toBe(120);
    expect(constraints.preferredWidth).toBe(200);
    expect(constraints.minHeight).toBe(20);
    expect(constraints.minUsefulHeight).toBe(80);
    expect(constraints.preferredHeight).toBe(160);
  });

  it('rejects non-finite and negative dimensions', () => {
    expect(() => createContentConstraints({ minWidth: -1 })).toThrow(DomainError);
    expect(() => createContentConstraints({ maxHeight: Number.NaN })).toThrow(DomainError);
    expect(() => createContentConstraints({ preferredWidth: Number.POSITIVE_INFINITY })).toThrow(
      DomainError,
    );
  });

  it('rejects min > max', () => {
    expect(() => createContentConstraints({ minWidth: 200, maxWidth: 100 })).toThrow(
      /minWidth.*maxWidth/,
    );
    expect(() => createContentConstraints({ minHeight: 50, maxHeight: 10 })).toThrow(DomainError);
  });

  it('rejects useful thresholds below geometric minima or above maxima', () => {
    expect(() => createContentConstraints({ minWidth: 100, minUsefulWidth: 50 })).toThrow(
      /minWidth.*minUsefulWidth/,
    );
    expect(() => createContentConstraints({ minUsefulWidth: 300, maxWidth: 200 })).toThrow(
      /minUsefulWidth.*maxWidth/,
    );
  });

  it('rejects preferred outside geometric or useful bounds', () => {
    expect(() => createContentConstraints({ minWidth: 100, preferredWidth: 50 })).toThrow(
      DomainError,
    );
    expect(() => createContentConstraints({ preferredWidth: 500, maxWidth: 400 })).toThrow(
      DomainError,
    );
    expect(() => createContentConstraints({ minUsefulWidth: 200, preferredWidth: 150 })).toThrow(
      /minUsefulWidth.*preferredWidth/,
    );
  });

  it('returns frozen objects and is deterministic', () => {
    const a = createContentConstraints({ minWidth: 10, maxWidth: 20 });
    const b = createContentConstraints({ minWidth: 10, maxWidth: 20 });
    expect(a).toEqual(b);
    expect(Object.isFrozen(a)).toBe(true);
  });
});
