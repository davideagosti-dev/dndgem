import { describe, expect, it } from 'vitest';
import { median, percentile } from './stats.js';

describe('benchmark stats helpers', () => {
  it('computes median for odd and even sample counts', () => {
    expect(median([1, 2, 3])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('computes p95 via nearest-rank (ceil) index on ascending samples', () => {
    // 20 samples → ceil(0.95*20)-1 = 18 → 19th element (0-based index 18)
    const samples = Array.from({ length: 20 }, (_, i) => i + 1);
    expect(percentile(samples, 95)).toBe(19);
    // 200 samples → ceil(190)-1 = 189 → value 190
    const large = Array.from({ length: 200 }, (_, i) => (i + 1) / 10);
    expect(percentile(large, 95)).toBe(19);
  });

  it('does not confuse p95 with max*0.95 or mean*0.95', () => {
    const samples = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    expect(percentile(samples, 95)).toBe(100);
    expect(percentile(samples, 95)).not.toBe(95);
    expect(percentile(samples, 95)).not.toBe(55 * 0.95);
  });

  it('returns NaN for empty input', () => {
    expect(Number.isNaN(median([]))).toBe(true);
    expect(Number.isNaN(percentile([], 95))).toBe(true);
  });
});
