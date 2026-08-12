import { describe, expect, it } from 'vitest';
import { DomainError, createPoint, createRect, createSize } from '../src/index.js';

describe('geometry', () => {
  it('creates valid points, sizes, and rects', () => {
    expect(createPoint(1, -2)).toEqual({ x: 1, y: -2 });
    expect(createSize(0, 10)).toEqual({ width: 0, height: 10 });
    expect(createRect({ x: 0, y: 0, width: 100, height: 50 })).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 50,
    });
  });

  it('allows zero sizes and rejects negatives / non-finite', () => {
    expect(createSize(0, 0)).toEqual({ width: 0, height: 0 });

    expect(() => createSize(-1, 1)).toThrow(DomainError);
    expect(() => createSize(Number.NaN, 1)).toThrow(/finite/);
    expect(() => createSize(Number.POSITIVE_INFINITY, 1)).toThrow(DomainError);
    expect(() => createPoint(Number.NaN, 0)).toThrow(DomainError);
    expect(() => createRect({ x: 0, y: 0, width: -1, height: 1 })).toThrow(DomainError);
  });

  it('returns frozen objects', () => {
    const size = createSize(1, 2);
    expect(Object.isFrozen(size)).toBe(true);
    expect(() => {
      (size as { width: number }).width = 9;
    }).toThrow();
  });

  it('is deterministic for equivalent inputs', () => {
    expect(createRect({ x: 1, y: 2, width: 3, height: 4 })).toEqual(
      createRect({ x: 1, y: 2, width: 3, height: 4 }),
    );
  });
});
