import { describe, expect, it } from 'vitest';
import {
  DomainError,
  SCORE_PREFERENCE_WEIGHT,
  SCORE_USEFULNESS_WEIGHT,
  VALIDITY_REASON_CODES,
  createContentConstraints,
  createLayoutIntent,
  createLayoutItem,
  createResolvedLayout,
  createSize,
  evaluateConstraintsPlacement,
  evaluateItemPlacement,
  evaluateLayout,
} from '../src/index.js';

function itemWith(constraints: Parameters<typeof createContentConstraints>[0]) {
  return createLayoutItem({
    id: 'item',
    constraints: createContentConstraints(constraints),
  });
}

describe('evaluateItemPlacement — VALID', () => {
  it.each([
    {
      name: 'exactly at geometric min',
      constraints: { minWidth: 40, minHeight: 20 },
      size: { width: 40, height: 20 },
    },
    {
      name: 'above geometric min',
      constraints: { minWidth: 40, minHeight: 20 },
      size: { width: 80, height: 40 },
    },
    {
      name: 'exactly at useful threshold',
      constraints: { minWidth: 40, minUsefulWidth: 100, minHeight: 20, minUsefulHeight: 50 },
      size: { width: 100, height: 50 },
    },
    {
      name: 'exactly at preferred',
      constraints: { preferredWidth: 200, preferredHeight: 100 },
      size: { width: 200, height: 100 },
    },
    {
      name: 'inside all bounds',
      constraints: {
        minWidth: 40,
        maxWidth: 400,
        minUsefulWidth: 120,
        preferredWidth: 200,
        minHeight: 20,
        maxHeight: 300,
        minUsefulHeight: 80,
        preferredHeight: 160,
      },
      size: { width: 200, height: 160 },
    },
    {
      name: 'exactly at max',
      constraints: { maxWidth: 400, maxHeight: 300 },
      size: { width: 400, height: 300 },
    },
    {
      name: 'zero size with no constraints',
      constraints: {},
      size: { width: 0, height: 0 },
    },
  ])('$name → VALID', ({ constraints, size }) => {
    const result = evaluateItemPlacement(
      itemWith(constraints),
      createSize(size.width, size.height),
    );
    expect(result.state).toBe('VALID');
    expect(result.score.total).toBeGreaterThanOrEqual(0);
    expect(result.score.total).toBeLessThanOrEqual(1);
    expect(result.reasons.every((r) => r.kind !== 'hard' && r.kind !== 'usefulness')).toBe(true);
  });
});

describe('evaluateItemPlacement — DEGRADED', () => {
  it('marks width below useful but >= min as DEGRADED', () => {
    const result = evaluateItemPlacement(
      itemWith({ minWidth: 40, minUsefulWidth: 120 }),
      createSize(80, 100),
    );
    expect(result.state).toBe('DEGRADED');
    expect(result.reasons).toContainEqual(
      expect.objectContaining({
        code: 'WIDTH_BELOW_USEFUL',
        kind: 'usefulness',
        axis: 'width',
        allocated: 80,
        threshold: 120,
      }),
    );
  });

  it('marks height below useful but >= min as DEGRADED', () => {
    const result = evaluateItemPlacement(
      itemWith({ minHeight: 20, minUsefulHeight: 80 }),
      createSize(100, 40),
    );
    expect(result.state).toBe('DEGRADED');
    expect(result.reasons.some((r) => r.code === 'HEIGHT_BELOW_USEFUL')).toBe(true);
  });

  it('marks both axes below useful as DEGRADED', () => {
    const result = evaluateItemPlacement(
      itemWith({
        minWidth: 40,
        minUsefulWidth: 120,
        minHeight: 20,
        minUsefulHeight: 80,
      }),
      createSize(60, 40),
    );
    expect(result.state).toBe('DEGRADED');
    expect(result.reasons.map((r) => r.code).sort()).toEqual([
      'HEIGHT_BELOW_USEFUL',
      'WIDTH_BELOW_USEFUL',
    ]);
  });

  it('keeps preferred miss alone as VALID (score only)', () => {
    const result = evaluateItemPlacement(
      itemWith({ preferredWidth: 200, preferredHeight: 100 }),
      createSize(150, 100),
    );
    expect(result.state).toBe('VALID');
    expect(result.reasons).toEqual([
      expect.objectContaining({
        code: 'WIDTH_OFF_PREFERRED',
        kind: 'preference',
      }),
    ]);
    expect(result.score.preference).toBeLessThan(1);
    expect(result.score.usefulness).toBe(1);
  });
});

describe('evaluateItemPlacement — INVALID', () => {
  it.each([
    {
      name: 'width < minWidth',
      constraints: { minWidth: 100 },
      size: { width: 99, height: 50 },
      code: 'WIDTH_BELOW_MIN',
    },
    {
      name: 'width > maxWidth',
      constraints: { maxWidth: 100 },
      size: { width: 101, height: 50 },
      code: 'WIDTH_ABOVE_MAX',
    },
    {
      name: 'height < minHeight',
      constraints: { minHeight: 50 },
      size: { width: 100, height: 49 },
      code: 'HEIGHT_BELOW_MIN',
    },
    {
      name: 'height > maxHeight',
      constraints: { maxHeight: 50 },
      size: { width: 100, height: 51 },
      code: 'HEIGHT_ABOVE_MAX',
    },
  ])('$name → INVALID', ({ constraints, size, code }) => {
    const result = evaluateItemPlacement(
      itemWith(constraints),
      createSize(size.width, size.height),
    );
    expect(result.state).toBe('INVALID');
    expect(result.score.total).toBe(0);
    expect(result.score.usefulness).toBe(0);
    expect(result.score.preference).toBe(0);
    expect(result.reasons.some((r) => r.code === code && r.kind === 'hard')).toBe(true);
  });

  it('aggregates multiple hard violations', () => {
    const result = evaluateItemPlacement(
      itemWith({ minWidth: 100, maxHeight: 40 }),
      createSize(50, 80),
    );
    expect(result.state).toBe('INVALID');
    expect(result.reasons.map((r) => r.code).sort()).toEqual([
      'HEIGHT_ABOVE_MAX',
      'WIDTH_BELOW_MIN',
    ]);
  });

  it('hard violation wins over usefulness degradation on the other axis', () => {
    const result = evaluateItemPlacement(
      itemWith({
        minWidth: 100,
        minHeight: 20,
        minUsefulHeight: 80,
      }),
      createSize(50, 40),
    );
    expect(result.state).toBe('INVALID');
  });
});

describe('partial constraints', () => {
  it.each([
    { name: 'no constraints', constraints: {}, size: { width: 10, height: 10 }, state: 'VALID' },
    {
      name: 'only min',
      constraints: { minWidth: 5 },
      size: { width: 5, height: 0 },
      state: 'VALID',
    },
    {
      name: 'only max',
      constraints: { maxHeight: 10 },
      size: { width: 0, height: 10 },
      state: 'VALID',
    },
    {
      name: 'only useful (at threshold)',
      constraints: { minUsefulWidth: 50 },
      size: { width: 50, height: 1 },
      state: 'VALID',
    },
    {
      name: 'only useful (below)',
      constraints: { minUsefulWidth: 50 },
      size: { width: 40, height: 1 },
      state: 'DEGRADED',
    },
    {
      name: 'only preferred',
      constraints: { preferredHeight: 30 },
      size: { width: 1, height: 10 },
      state: 'VALID',
    },
    {
      name: 'width-only hard fail',
      constraints: { minWidth: 20, maxWidth: 40 },
      size: { width: 50, height: 999 },
      state: 'INVALID',
    },
    {
      name: 'height-only degrade',
      constraints: { minHeight: 10, minUsefulHeight: 40 },
      size: { width: 999, height: 20 },
      state: 'DEGRADED',
    },
  ])('$name', ({ constraints, size, state }) => {
    const result = evaluateItemPlacement(
      itemWith(constraints),
      createSize(size.width, size.height),
    );
    expect(result.state).toBe(state);
  });
});

describe('scoring', () => {
  it('uses higher-is-better finite scores in [0, 1]', () => {
    const perfect = evaluateItemPlacement(
      itemWith({
        minWidth: 40,
        maxWidth: 400,
        minUsefulWidth: 120,
        preferredWidth: 200,
        minHeight: 20,
        maxHeight: 300,
        minUsefulHeight: 80,
        preferredHeight: 160,
      }),
      createSize(200, 160),
    );
    expect(perfect.score).toEqual({ total: 1, usefulness: 1, preference: 1 });
    expect(Number.isFinite(perfect.score.total)).toBe(true);
  });

  it('weights total as 0.7 usefulness + 0.3 preference when valid/degraded', () => {
    expect(SCORE_USEFULNESS_WEIGHT + SCORE_PREFERENCE_WEIGHT).toBe(1);
    const result = evaluateConstraintsPlacement(
      createContentConstraints({
        minWidth: 0,
        minUsefulWidth: 100,
        preferredWidth: 100,
      }),
      createSize(50, 0),
    );
    // width usefulness = 50/100 = 0.5; height usefulness = 1; mean = 0.75
    // preference: width off preferred with no max → denom = preferred = 100
    // distance = 50 → preference width = 0.5; height = 1; mean = 0.75
    expect(result.state).toBe('DEGRADED');
    expect(result.score.usefulness).toBe(0.75);
    expect(result.score.preference).toBe(0.75);
    expect(result.score.total).toBe(
      SCORE_USEFULNESS_WEIGHT * 0.75 + SCORE_PREFERENCE_WEIGHT * 0.75,
    );
  });

  it('forces invalid scores to 0', () => {
    const result = evaluateItemPlacement(itemWith({ minWidth: 100 }), createSize(50, 10));
    expect(result.score).toEqual({ total: 0, usefulness: 0, preference: 0 });
  });

  it('is monotonic for usefulness degradation in the soft band', () => {
    const constraints = createContentConstraints({
      minWidth: 40,
      minUsefulWidth: 120,
    });
    const better = evaluateConstraintsPlacement(constraints, createSize(100, 10));
    const worse = evaluateConstraintsPlacement(constraints, createSize(60, 10));
    expect(better.state).toBe('DEGRADED');
    expect(worse.state).toBe('DEGRADED');
    expect(better.score.usefulness).toBeGreaterThan(worse.score.usefulness);
    expect(better.score.total).toBeGreaterThan(worse.score.total);
  });

  it('scores preference by target distance above and below preferred', () => {
    const constraints = createContentConstraints({
      minWidth: 0,
      maxWidth: 200,
      preferredWidth: 100,
    });
    const below = evaluateConstraintsPlacement(constraints, createSize(50, 0));
    const above = evaluateConstraintsPlacement(constraints, createSize(150, 0));
    const exact = evaluateConstraintsPlacement(constraints, createSize(100, 0));
    expect(exact.score.preference).toBe(1);
    expect(below.score.preference).toBe(above.score.preference);
    expect(below.score.preference).toBeLessThan(1);
  });

  it('never emits NaN or Infinity', () => {
    const samples = [
      evaluateConstraintsPlacement(createContentConstraints({}), createSize(0, 0)),
      evaluateConstraintsPlacement(
        createContentConstraints({ preferredWidth: 0 }),
        createSize(0, 0),
      ),
      evaluateConstraintsPlacement(
        createContentConstraints({ preferredWidth: 0 }),
        createSize(1, 0),
      ),
      evaluateConstraintsPlacement(
        createContentConstraints({ minWidth: 10, maxWidth: 10, preferredWidth: 10 }),
        createSize(10, 0),
      ),
      evaluateConstraintsPlacement(createContentConstraints({ minWidth: 10 }), createSize(5, 0)),
    ];
    for (const sample of samples) {
      for (const value of Object.values(sample.score)) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('boundaries', () => {
  const constraints = createContentConstraints({
    minWidth: 40,
    maxWidth: 200,
    minUsefulWidth: 100,
    preferredWidth: 150,
  });

  it.each([
    { width: 40, state: 'DEGRADED' }, // at min, below useful
    { width: 39.999, state: 'INVALID' }, // just below min
    { width: 100, state: 'VALID' }, // exactly useful
    { width: 99.999, state: 'DEGRADED' }, // just below useful
    { width: 150, state: 'VALID' }, // preferred
    { width: 200, state: 'VALID' }, // at max
    { width: 200.001, state: 'INVALID' }, // just above max
  ])('width $width → $state', ({ width, state }) => {
    expect(evaluateConstraintsPlacement(constraints, createSize(width, 0)).state).toBe(state);
  });
});

describe('determinism and immutability', () => {
  it('returns identical structured results for equivalent inputs', () => {
    const item = itemWith({
      minWidth: 40,
      minUsefulWidth: 100,
      preferredWidth: 150,
      minHeight: 10,
      preferredHeight: 40,
    });
    const size = createSize(80, 40);
    const a = evaluateItemPlacement(item, size);
    const b = evaluateItemPlacement(item, size);
    expect(a).toEqual(b);
    expect(a.reasons).toEqual(b.reasons);
  });

  it('freezes evaluation results', () => {
    const result = evaluateItemPlacement(itemWith({ minUsefulWidth: 50 }), createSize(40, 10));
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.score)).toBe(true);
    expect(Object.isFrozen(result.reasons)).toBe(true);
    expect(Object.isFrozen(result.reasons[0])).toBe(true);
  });
});

describe('malformed input vs invalid layout', () => {
  it('rejects non-finite size with DomainError (not INVALID)', () => {
    expect(() => evaluateItemPlacement(itemWith({}), { width: Number.NaN, height: 1 })).toThrow(
      DomainError,
    );
    expect(() =>
      evaluateItemPlacement(itemWith({}), { width: 1, height: Number.POSITIVE_INFINITY }),
    ).toThrow(/finite/);
  });

  it('exposes the full reason code vocabulary', () => {
    expect(VALIDITY_REASON_CODES).toEqual([
      'WIDTH_BELOW_MIN',
      'WIDTH_ABOVE_MAX',
      'HEIGHT_BELOW_MIN',
      'HEIGHT_ABOVE_MAX',
      'WIDTH_BELOW_USEFUL',
      'HEIGHT_BELOW_USEFUL',
      'WIDTH_OFF_PREFERRED',
      'HEIGHT_OFF_PREFERRED',
    ]);
  });
});

describe('evaluateLayout', () => {
  it('aggregates item states by worst severity', () => {
    const intent = createLayoutIntent({
      space: { width: 1000, height: 800 },
      items: [
        {
          id: 'a',
          constraints: { minWidth: 100, minUsefulWidth: 200 },
        },
        {
          id: 'b',
          constraints: { minHeight: 50 },
        },
      ],
    });
    const resolved = createResolvedLayout({
      space: { width: 1000, height: 800 },
      placements: {
        a: { x: 0, y: 0, width: 150, height: 100 }, // DEGRADED
        b: { x: 10, y: 10, width: 80, height: 40 }, // INVALID
      },
    });
    const result = evaluateLayout(intent, resolved);
    expect(result.state).toBe('INVALID');
    expect(result.items.a?.state).toBe('DEGRADED');
    expect(result.items.b?.state).toBe('INVALID');
    expect(result.score.total).toBe(
      (result.items.a!.score.total + result.items.b!.score.total) / 2,
    );
  });

  it('returns perfect VALID for empty item sets', () => {
    const intent = createLayoutIntent({
      space: { width: 100, height: 100 },
      items: [],
    });
    const resolved = createResolvedLayout({
      space: { width: 100, height: 100 },
      placements: {},
    });
    expect(evaluateLayout(intent, resolved)).toEqual({
      state: 'VALID',
      score: { total: 1, usefulness: 1, preference: 1 },
      items: {},
    });
  });

  it('throws DomainError for missing placements', () => {
    const intent = createLayoutIntent({
      space: { width: 100, height: 100 },
      items: [{ id: 'a' }],
    });
    const resolved = createResolvedLayout({
      space: { width: 100, height: 100 },
      placements: {},
    });
    try {
      evaluateLayout(intent, resolved);
      expect.unreachable('expected DomainError');
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe('MISSING_PLACEMENT');
    }
  });

  it('throws DomainError for unknown placement keys', () => {
    const intent = createLayoutIntent({
      space: { width: 100, height: 100 },
      items: [{ id: 'a' }],
    });
    const resolved = createResolvedLayout({
      space: { width: 100, height: 100 },
      placements: {
        a: { x: 0, y: 0, width: 10, height: 10 },
        ghost: { x: 0, y: 0, width: 1, height: 1 },
      },
    });
    try {
      evaluateLayout(intent, resolved);
      expect.unreachable('expected DomainError');
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe('UNKNOWN_PLACEMENT_ITEM');
    }
  });

  it('is deterministic for equivalent layouts', () => {
    const intent = createLayoutIntent({
      space: { width: 500, height: 400 },
      items: [{ id: 'card', constraints: { minUsefulWidth: 120, preferredWidth: 200 } }],
    });
    const resolved = createResolvedLayout({
      space: { width: 500, height: 400 },
      placements: {
        card: { x: 0, y: 0, width: 160, height: 90 },
      },
    });
    expect(evaluateLayout(intent, resolved)).toEqual(evaluateLayout(intent, resolved));
  });
});
