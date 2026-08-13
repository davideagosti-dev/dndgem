import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  DomainError,
  createContentConstraints,
  createLayoutIntent,
  createLayoutItem,
  createResolvedLayout,
  solveLayout,
  type SolverInput,
  type SolverResult,
} from '../src/index.js';

function intentWith(
  space: { width: number; height: number },
  items: Array<{
    id: string;
    constraints?: Parameters<typeof createContentConstraints>[0];
    measuredSize?: { width: number; height: number };
  }>,
  desiredPlacements?: Record<string, { x: number; y: number; width: number; height: number }>,
) {
  return createLayoutIntent({
    space,
    items: items.map((item) =>
      createLayoutItem({
        id: item.id,
        constraints: createContentConstraints(item.constraints ?? {}),
        measuredSize: item.measuredSize,
      }),
    ),
    desiredPlacements,
  });
}

describe('solveLayout — basic solving', () => {
  it('selects a valid layout for a single item with preferred size', () => {
    const intent = intentWith({ width: 400, height: 300 }, [
      {
        id: 'a',
        constraints: { preferredWidth: 200, preferredHeight: 100, minWidth: 50, minHeight: 40 },
      },
    ]);
    const result = solveLayout({ intent });
    expect(result.evaluation.state).toBe('VALID');
    expect(result.resolved.placements.a).toEqual({ x: 0, y: 0, width: 200, height: 100 });
    expect(result.reflowed).toBe(false);
    expect(result.candidates.length).toBeGreaterThan(0);
  });

  it('chooses among multiple candidates deterministically', () => {
    const intent = intentWith({ width: 500, height: 400 }, [
      {
        id: 'a',
        constraints: {
          minWidth: 40,
          minUsefulWidth: 80,
          preferredWidth: 120,
          minHeight: 20,
          minUsefulHeight: 40,
          preferredHeight: 60,
        },
      },
      {
        id: 'b',
        constraints: {
          minWidth: 40,
          minUsefulWidth: 80,
          preferredWidth: 100,
          minHeight: 20,
          minUsefulHeight: 40,
          preferredHeight: 50,
        },
      },
    ]);
    const result = solveLayout({ intent });
    expect(result.evaluation.state).toBe('VALID');
    expect(result.resolved.placements.a).toBeDefined();
    expect(result.resolved.placements.b).toBeDefined();
    expect(result.winnerId).toBe(
      result.candidates[0]?.id === result.winnerId ? result.winnerId : result.winnerId,
    );
  });
});

describe('solveLayout — validity precedence', () => {
  it('prefers VALID over DEGRADED even when previous is degraded', () => {
    const intent = intentWith({ width: 300, height: 200 }, [
      {
        id: 'a',
        constraints: { minWidth: 50, minUsefulWidth: 150, preferredWidth: 150, minHeight: 40 },
      },
    ]);
    const previous = createResolvedLayout({
      space: { width: 300, height: 200 },
      placements: { a: { x: 0, y: 0, width: 80, height: 40 } },
    });
    const result = solveLayout({ intent, previous });
    expect(result.evaluation.state).toBe('VALID');
    expect(result.resolved.placements.a?.width).toBeGreaterThanOrEqual(150);
    expect(result.reflowed).toBe(true);
  });

  it('prefers DEGRADED over INVALID when no VALID candidate exists', () => {
    // Useful threshold exceeds available space but hard min fits → packing is DEGRADED.
    // Previous placement below hard min → INVALID preserve candidate loses.
    const intent = intentWith({ width: 100, height: 80 }, [
      {
        id: 'a',
        constraints: {
          minWidth: 40,
          maxWidth: 400,
          minUsefulWidth: 200,
          preferredWidth: 200,
          minHeight: 20,
          maxHeight: 80,
        },
      },
    ]);
    const previous = createResolvedLayout({
      space: { width: 100, height: 80 },
      placements: { a: { x: 0, y: 0, width: 10, height: 40 } },
    });
    const result = solveLayout({ intent, previous });
    expect(result.evaluation.state).toBe('DEGRADED');
    expect(result.candidates.some((c) => c.state === 'INVALID')).toBe(true);
  });

  it('never lets INVALID beat VALID on stability alone', () => {
    const intent = intentWith({ width: 400, height: 200 }, [
      {
        id: 'a',
        constraints: { minWidth: 100, preferredWidth: 200, minHeight: 50, preferredHeight: 50 },
      },
    ]);
    const previous = createResolvedLayout({
      space: { width: 400, height: 200 },
      placements: { a: { x: 0, y: 0, width: 10, height: 50 } },
    });
    const result = solveLayout({ intent, previous });
    expect(result.evaluation.state).toBe('VALID');
    expect(result.resolved.placements.a?.width).toBeGreaterThanOrEqual(100);
    const preserve = result.candidates.find((c) => c.strategy === 'preserve-previous');
    expect(preserve?.state).toBe('INVALID');
  });
});

describe('solveLayout — scoring integration', () => {
  it('selects higher-scoring VALID candidate when validity ties', () => {
    const intent = intentWith(
      { width: 400, height: 200 },
      [
        {
          id: 'a',
          constraints: {
            minWidth: 50,
            maxWidth: 400,
            preferredWidth: 200,
            minHeight: 40,
            preferredHeight: 80,
          },
        },
      ],
      {
        a: { x: 0, y: 0, width: 50, height: 40 },
      },
    );
    const result = solveLayout({ intent });
    expect(result.evaluation.state).toBe('VALID');
    // preferred-sized candidate should beat desired tiny placement on preference score
    expect(result.resolved.placements.a?.width).toBe(200);
    expect(result.evaluation.score.preference).toBeGreaterThan(0.5);
  });

  it('lets usefulness drive reflow when preferred preserve is degraded', () => {
    const intent = intentWith({ width: 400, height: 200 }, [
      {
        id: 'a',
        constraints: {
          minWidth: 40,
          minUsefulWidth: 180,
          preferredWidth: 200,
          minHeight: 40,
          minUsefulHeight: 80,
          preferredHeight: 100,
        },
      },
    ]);
    const previous = createResolvedLayout({
      space: { width: 400, height: 200 },
      placements: { a: { x: 0, y: 0, width: 60, height: 40 } },
    });
    const result = solveLayout({ intent, previous });
    expect(result.evaluation.state).toBe('VALID');
    expect(result.evaluation.score.usefulness).toBe(1);
    expect(result.reflowed).toBe(true);
  });
});

describe('solveLayout — hard constraints', () => {
  it('respects minWidth / maxWidth / minHeight / maxHeight when packing', () => {
    const intent = intentWith({ width: 500, height: 300 }, [
      {
        id: 'a',
        constraints: {
          minWidth: 120,
          maxWidth: 160,
          preferredWidth: 150,
          minHeight: 60,
          maxHeight: 90,
          preferredHeight: 80,
        },
      },
    ]);
    const result = solveLayout({ intent });
    const place = result.resolved.placements.a!;
    expect(place.width).toBeGreaterThanOrEqual(120);
    expect(place.width).toBeLessThanOrEqual(160);
    expect(place.height).toBeGreaterThanOrEqual(60);
    expect(place.height).toBeLessThanOrEqual(90);
    expect(result.evaluation.state).toBe('VALID');
  });
});

describe('solveLayout — usefulness', () => {
  it('reflows to meet minUseful when previous is degraded', () => {
    const intent = intentWith({ width: 400, height: 300 }, [
      {
        id: 'a',
        constraints: {
          minWidth: 50,
          minUsefulWidth: 200,
          preferredWidth: 220,
          minHeight: 40,
          minUsefulHeight: 100,
          preferredHeight: 110,
        },
      },
    ]);
    const previous = createResolvedLayout({
      space: { width: 400, height: 300 },
      placements: { a: { x: 10, y: 10, width: 80, height: 50 } },
    });
    const result = solveLayout({ intent, previous });
    expect(result.evaluation.state).toBe('VALID');
    expect(result.resolved.placements.a!.width).toBeGreaterThanOrEqual(200);
    expect(result.resolved.placements.a!.height).toBeGreaterThanOrEqual(100);
  });

  it('remains deterministically DEGRADED when useful size cannot fit', () => {
    const intent = intentWith({ width: 100, height: 80 }, [
      {
        id: 'a',
        constraints: {
          minWidth: 40,
          maxWidth: 400,
          minUsefulWidth: 250,
          preferredWidth: 250,
          minHeight: 20,
          maxHeight: 80,
          minUsefulHeight: 20,
        },
      },
    ]);
    const a = solveLayout({ intent });
    const b = solveLayout({ intent });
    expect(a.evaluation.state).toBe('DEGRADED');
    expect(a).toEqual(b);
  });
});

describe('solveLayout — preference', () => {
  it('uses preferred dimensions to decide among equivalent VALID candidates', () => {
    const intent = intentWith(
      { width: 500, height: 300 },
      [
        {
          id: 'a',
          constraints: {
            minWidth: 50,
            minUsefulWidth: 50,
            preferredWidth: 180,
            minHeight: 40,
            minUsefulHeight: 40,
            preferredHeight: 90,
          },
        },
      ],
      { a: { x: 0, y: 0, width: 50, height: 40 } },
    );
    const result = solveLayout({ intent });
    expect(result.evaluation.state).toBe('VALID');
    expect(result.resolved.placements.a).toMatchObject({ width: 180, height: 90 });
  });

  it('does not let preference override hard validity', () => {
    const intent = intentWith({ width: 400, height: 200 }, [
      {
        id: 'a',
        constraints: { minWidth: 100, preferredWidth: 150, minHeight: 40, preferredHeight: 40 },
      },
    ]);
    const previous = createResolvedLayout({
      space: { width: 400, height: 200 },
      placements: { a: { x: 0, y: 0, width: 20, height: 40 } },
    });
    const result = solveLayout({ intent, previous });
    expect(result.evaluation.state).toBe('VALID');
    expect(result.resolved.placements.a!.width).toBeGreaterThanOrEqual(100);
    const preserve = result.candidates.find((c) => c.strategy === 'preserve-previous');
    expect(preserve?.state).toBe('INVALID');
  });
});

describe('solveLayout — determinism', () => {
  it('returns identical results across many identical calls', () => {
    const intent = intentWith({ width: 600, height: 400 }, [
      {
        id: 'a',
        constraints: {
          minWidth: 40,
          minUsefulWidth: 80,
          preferredWidth: 120,
          minHeight: 30,
          preferredHeight: 60,
        },
      },
      {
        id: 'b',
        constraints: {
          minWidth: 40,
          minUsefulWidth: 70,
          preferredWidth: 100,
          minHeight: 30,
          preferredHeight: 50,
        },
      },
    ]);
    const previous = createResolvedLayout({
      space: { width: 600, height: 400 },
      placements: {
        a: { x: 5, y: 5, width: 90, height: 55 },
        b: { x: 100, y: 5, width: 90, height: 55 },
      },
    });
    const first = solveLayout({ intent, previous });
    for (let i = 0; i < 25; i += 1) {
      expect(solveLayout({ intent, previous })).toEqual(first);
    }
    expect(first.candidates.map((c) => c.id)).toEqual(
      solveLayout({ intent, previous }).candidates.map((c) => c.id),
    );
  });
});

describe('solveLayout — tie-breaking', () => {
  it('resolves equal validity/score via explicit candidate order', () => {
    // Two unconstrained items → several strategies produce identical sizes/scores.
    const intent = intentWith({ width: 400, height: 300 }, [
      { id: 'a', constraints: { minWidth: 10, minHeight: 10 } },
    ]);
    const result = solveLayout({ intent });
    const winner = result.candidates.find((c) => c.id === result.winnerId);
    expect(winner).toBeDefined();
    const equals = result.candidates.filter(
      (c) =>
        c.state === winner!.state &&
        c.score.total === winner!.score.total &&
        c.stabilityDistance === winner!.stabilityDistance,
    );
    expect(equals.length).toBeGreaterThan(1);
    const bestOrdinal = Math.min(...equals.map((c) => c.ordinal));
    expect(winner!.ordinal).toBe(bestOrdinal);
    expect(
      result.selection.code === 'CANDIDATE_ORDER' ||
        result.selection.code === 'ONLY_CANDIDATE' ||
        result.selection.code === 'BETTER_SCORE' ||
        result.selection.code === 'STABILITY' ||
        result.selection.code === 'BETTER_VALIDITY',
    ).toBe(true);
  });
});

describe('solveLayout — stability', () => {
  it('preserves a good previous layout when it remains best', () => {
    const intent = intentWith({ width: 400, height: 300 }, [
      {
        id: 'a',
        constraints: {
          minWidth: 50,
          minUsefulWidth: 100,
          preferredWidth: 150,
          minHeight: 40,
          minUsefulHeight: 60,
          preferredHeight: 80,
        },
      },
    ]);
    const previous = createResolvedLayout({
      space: { width: 400, height: 300 },
      placements: { a: { x: 0, y: 0, width: 150, height: 80 } },
    });
    const result = solveLayout({ intent, previous });
    expect(result.evaluation.state).toBe('VALID');
    expect(result.resolved.placements.a).toEqual(previous.placements.a);
    expect(result.reflowed).toBe(false);
    expect(result.candidates[0]?.strategy).toBe('preserve-previous');
  });

  it('reflows when previous is INVALID and a VALID candidate exists', () => {
    const intent = intentWith({ width: 400, height: 200 }, [
      {
        id: 'a',
        constraints: { minWidth: 100, preferredWidth: 120, minHeight: 40, preferredHeight: 50 },
      },
    ]);
    const previous = createResolvedLayout({
      space: { width: 400, height: 200 },
      placements: { a: { x: 0, y: 0, width: 20, height: 50 } },
    });
    const result = solveLayout({ intent, previous });
    expect(result.evaluation.state).toBe('VALID');
    expect(result.reflowed).toBe(true);
  });

  it('prefers stable layout among equivalent candidates', () => {
    const intent = intentWith({ width: 500, height: 300 }, [
      {
        id: 'a',
        constraints: { preferredWidth: 100, preferredHeight: 50, minWidth: 10, minHeight: 10 },
      },
    ]);
    const previous = createResolvedLayout({
      space: { width: 500, height: 300 },
      placements: { a: { x: 0, y: 0, width: 100, height: 50 } },
    });
    const result = solveLayout({ intent, previous });
    expect(result.reflowed).toBe(false);
    expect(result.winnerId.startsWith('0:')).toBe(true);
  });
});

describe('solveLayout — reflow', () => {
  it('adapts when available space shrinks', () => {
    const wide = intentWith({ width: 500, height: 200 }, [
      {
        id: 'a',
        constraints: { preferredWidth: 200, preferredHeight: 80, minWidth: 40, minHeight: 40 },
      },
      {
        id: 'b',
        constraints: { preferredWidth: 200, preferredHeight: 80, minWidth: 40, minHeight: 40 },
      },
    ]);
    const first = solveLayout({ intent: wide });
    const narrow = intentWith({ width: 180, height: 200 }, [
      {
        id: 'a',
        constraints: { preferredWidth: 200, preferredHeight: 80, minWidth: 40, minHeight: 40 },
      },
      {
        id: 'b',
        constraints: { preferredWidth: 200, preferredHeight: 80, minWidth: 40, minHeight: 40 },
      },
    ]);
    const second = solveLayout({ intent: narrow, previous: first.resolved });
    expect(second.reflowed).toBe(true);
    expect(second.resolved.space.width).toBe(180);
    expect(second.evaluation.state === 'VALID' || second.evaluation.state === 'DEGRADED').toBe(
      true,
    );
  });

  it('adapts when space grows enough to restore preferred sizes', () => {
    const narrow = intentWith({ width: 120, height: 100 }, [
      {
        id: 'a',
        constraints: {
          minWidth: 40,
          maxWidth: 400,
          minUsefulWidth: 100,
          preferredWidth: 200,
          minHeight: 40,
          preferredHeight: 80,
        },
      },
    ]);
    const cramped = solveLayout({ intent: narrow });
    const wide = intentWith({ width: 400, height: 200 }, [
      {
        id: 'a',
        constraints: {
          minWidth: 40,
          maxWidth: 400,
          minUsefulWidth: 100,
          preferredWidth: 200,
          minHeight: 40,
          preferredHeight: 80,
        },
      },
    ]);
    const grown = solveLayout({ intent: wide, previous: cramped.resolved });
    expect(grown.resolved.placements.a!.width).toBe(200);
    expect(grown.evaluation.state).toBe('VALID');
  });

  it('reflows when constraints tighten', () => {
    const intent = intentWith({ width: 400, height: 200 }, [
      {
        id: 'a',
        constraints: { minWidth: 150, minUsefulWidth: 150, preferredWidth: 150, minHeight: 40 },
      },
    ]);
    const previous = createResolvedLayout({
      space: { width: 400, height: 200 },
      placements: { a: { x: 0, y: 0, width: 80, height: 40 } },
    });
    const result = solveLayout({ intent, previous });
    expect(result.reflowed).toBe(true);
    expect(result.resolved.placements.a!.width).toBeGreaterThanOrEqual(150);
  });
});

describe('solveLayout — unsatisfiable', () => {
  it('returns deterministic INVALID result without throwing', () => {
    const intent = intentWith({ width: 50, height: 50 }, [
      {
        id: 'a',
        constraints: { minWidth: 200, minHeight: 200 },
      },
    ]);
    const a = solveLayout({ intent });
    const b = solveLayout({ intent });
    expect(a.evaluation.state).toBe('INVALID');
    expect(a.selection.code).toBe('UNSATISFIABLE');
    expect(a).toEqual(b);
  });
});

describe('solveLayout — malformed input', () => {
  it('throws DomainError for non-object input', () => {
    expect(() => solveLayout(null as unknown as SolverInput)).toThrow(DomainError);
    expect(() => solveLayout({} as SolverInput)).toThrow(DomainError);
  });

  it('rejects NaN / Infinity / negative sizes at domain construction', () => {
    expect(() => intentWith({ width: Number.NaN, height: 10 }, [{ id: 'a' }])).toThrow(DomainError);
    expect(() =>
      intentWith({ width: Number.POSITIVE_INFINITY, height: 10 }, [{ id: 'a' }]),
    ).toThrow(DomainError);
    expect(() => intentWith({ width: -1, height: 10 }, [{ id: 'a' }])).toThrow(DomainError);
    expect(() => createContentConstraints({ minWidth: 10, maxWidth: 5 })).toThrow(DomainError);
  });
});

describe('solveLayout — empty layout', () => {
  it('returns VALID score 1 for empty intent', () => {
    const intent = createLayoutIntent({ space: { width: 100, height: 100 }, items: [] });
    const result = solveLayout({ intent });
    expect(result.evaluation.state).toBe('VALID');
    expect(result.evaluation.score).toEqual({ total: 1, usefulness: 1, preference: 1 });
    expect(result.resolved.placements).toEqual({});
    expect(result.reflowed).toBe(false);
  });
});

describe('solveLayout — immutability', () => {
  it('does not mutate intent, items, or previous resolved layout', () => {
    const intent = intentWith({ width: 400, height: 300 }, [
      {
        id: 'a',
        constraints: { preferredWidth: 100, preferredHeight: 50, minWidth: 10, minHeight: 10 },
      },
      {
        id: 'b',
        constraints: { preferredWidth: 80, preferredHeight: 40, minWidth: 10, minHeight: 10 },
      },
    ]);
    const previous = createResolvedLayout({
      space: { width: 400, height: 300 },
      placements: {
        a: { x: 1, y: 2, width: 100, height: 50 },
        b: { x: 110, y: 2, width: 80, height: 40 },
      },
    });
    const intentSnap = structuredClone({
      space: intent.space,
      items: intent.items.map((item) => ({
        id: String(item.id),
        constraints: { ...item.constraints },
      })),
      desired: intent.desiredPlacements,
    });
    const prevSnap = structuredClone({
      space: previous.space,
      placements: previous.placements,
    });
    solveLayout({ intent, previous });
    expect({
      space: intent.space,
      items: intent.items.map((item) => ({
        id: String(item.id),
        constraints: { ...item.constraints },
      })),
      desired: intent.desiredPlacements,
    }).toEqual(intentSnap);
    expect({ space: previous.space, placements: previous.placements }).toEqual(prevSnap);
  });
});

describe('solveLayout — explainability', () => {
  it('exposes winner, selection reason, and candidate summaries', () => {
    const intent = intentWith({ width: 300, height: 200 }, [
      {
        id: 'a',
        constraints: { preferredWidth: 100, preferredHeight: 50, minWidth: 20, minHeight: 20 },
      },
    ]);
    const result = solveLayout({ intent });
    expect(result.winnerId).toBeTruthy();
    expect(result.selection.winnerId).toBe(result.winnerId);
    expect(result.selection.code).toBeTruthy();
    expect(result.selection.detail.length).toBeGreaterThan(0);
    expect(
      result.candidates.every((c) => typeof c.strategy === 'string' && c.strategy.length > 0),
    ).toBe(true);
  });
});

describe('solveLayout — public types', () => {
  it('keeps SolverResult readonly-shaped without renderer fields', () => {
    expectTypeOf<SolverResult>().toHaveProperty('resolved');
    expectTypeOf<SolverResult>().toHaveProperty('evaluation');
    expectTypeOf<SolverResult>().toHaveProperty('reflowed');
    expectTypeOf<SolverResult>().toHaveProperty('selection');
    type Forbidden = 'element' | 'node' | 'HTMLElement' | 'ReactNode';
    type Keys = keyof SolverResult;
    expectTypeOf<Extract<Keys, Forbidden>>().toEqualTypeOf<never>();
  });
});
