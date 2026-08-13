/**
 * DND-1.8 Technical MVP proof scenarios for Core.
 *
 * Complements existing evaluate/solve suites with explicit narrative proofs
 * required for MVP closure (content-aware reflow, scoring choice, intent vs
 * stability contract, input-order contract, extended determinism).
 */
import { describe, expect, it } from 'vitest';
import {
  createContentConstraints,
  createLayoutIntent,
  createLayoutItem,
  createResolvedLayout,
  evaluateLayout,
  solveLayout,
} from '../src/index.js';

function intentWith(
  space: { width: number; height: number },
  items: Array<{
    id: string;
    constraints?: Parameters<typeof createContentConstraints>[0];
  }>,
  desiredPlacements?: Record<string, { x: number; y: number; width: number; height: number }>,
) {
  return createLayoutIntent({
    space,
    items: items.map((item) =>
      createLayoutItem({
        id: item.id,
        constraints: createContentConstraints(item.constraints ?? {}),
      }),
    ),
    desiredPlacements,
  });
}

describe('DND-1.8 proof — VALID / DEGRADED / INVALID', () => {
  it('demonstrates all three validity states with clear fixtures', () => {
    const validIntent = intentWith({ width: 400, height: 200 }, [
      {
        id: 'a',
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
    const validResolved = createResolvedLayout({
      space: validIntent.space,
      placements: { a: { x: 0, y: 0, width: 100, height: 50 } },
    });
    expect(evaluateLayout(validIntent, validResolved).state).toBe('VALID');

    const degradedIntent = intentWith({ width: 400, height: 200 }, [
      {
        id: 'a',
        constraints: {
          minWidth: 40,
          minUsefulWidth: 120,
          preferredWidth: 120,
          minHeight: 20,
          minUsefulHeight: 40,
          preferredHeight: 50,
        },
      },
    ]);
    const degradedResolved = createResolvedLayout({
      space: degradedIntent.space,
      placements: { a: { x: 0, y: 0, width: 80, height: 50 } },
    });
    expect(evaluateLayout(degradedIntent, degradedResolved).state).toBe('DEGRADED');

    const invalidIntent = intentWith({ width: 400, height: 200 }, [
      {
        id: 'a',
        constraints: { minWidth: 100, minHeight: 40 },
      },
    ]);
    const invalidResolved = createResolvedLayout({
      space: invalidIntent.space,
      placements: { a: { x: 0, y: 0, width: 50, height: 40 } },
    });
    expect(evaluateLayout(invalidIntent, invalidResolved).state).toBe('INVALID');
  });
});

describe('DND-1.8 proof — scoring chooses among VALID candidates', () => {
  it('ranks preferred-sized VALID packing over a VALID but preference-poor desired placement', () => {
    // Desired is VALID on hard mins but far from preferred → lower preference score.
    // Preferred packing reaches preferred size and outranks the desired candidate on score.
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
    const desired = result.candidates.find((c) => c.strategy === 'preserve-desired');
    const winner = result.candidates.find((c) => c.id === result.winnerId);
    expect(desired?.state).toBe('VALID');
    expect(winner).toBeDefined();
    expect(winner!.score.total).toBeGreaterThan(desired!.score.total);
    expect(result.resolved.placements.a?.width).toBe(200);
    expect(result.evaluation.score.preference).toBeGreaterThan(desired!.score.preference);
    // Runner-up may be another equally scored preferred strategy (CANDIDATE_ORDER),
    // but the preference-poor desired candidate must remain strictly worse on score.
    expect(desired!.score.total).toBeLessThan(result.evaluation.score.total);
  });
});

describe('DND-1.8 proof — content-aware adaptive reflow', () => {
  it('reflows heterogeneous items by constraints when the container narrows', () => {
    const chart = {
      id: 'chart',
      constraints: {
        minWidth: 80,
        minHeight: 48,
        minUsefulWidth: 180,
        minUsefulHeight: 72,
        preferredWidth: 240,
        preferredHeight: 96,
      },
    };
    const metric = {
      id: 'metric',
      constraints: {
        minWidth: 48,
        minHeight: 40,
        minUsefulWidth: 64,
        minUsefulHeight: 56,
        preferredWidth: 80,
        preferredHeight: 72,
      },
    };
    const details = {
      id: 'details',
      constraints: {
        minWidth: 72,
        minHeight: 80,
        minUsefulWidth: 120,
        minUsefulHeight: 140,
        preferredWidth: 160,
        preferredHeight: 180,
      },
    };

    const wide = intentWith({ width: 700, height: 400 }, [chart, metric, details], {
      chart: { x: 8, y: 8, width: 240, height: 96 },
      metric: { x: 260, y: 8, width: 80, height: 72 },
      details: { x: 360, y: 8, width: 160, height: 180 },
    });
    const wideResult = solveLayout({ intent: wide });
    expect(wideResult.evaluation.state).toBe('VALID');
    expect(wideResult.resolved.placements.chart!.width).toBeGreaterThanOrEqual(180);

    const narrow = intentWith({ width: 220, height: 500 }, [chart, metric, details]);
    const narrowResult = solveLayout({ intent: narrow, previous: wideResult.resolved });
    expect(narrowResult.reflowed).toBe(true);
    // Not a blind geometric shrink of the wide row — packing axis / sizes adapt.
    expect(narrowResult.resolved.placements).not.toEqual(wideResult.resolved.placements);
    const chartW = narrowResult.resolved.placements.chart!.width;
    const metricW = narrowResult.resolved.placements.metric!.width;
    // Chart keeps a larger useful/preferred target than the metric card when possible.
    expect(chartW).toBeGreaterThan(metricW);
    expect(
      narrowResult.evaluation.state === 'VALID' || narrowResult.evaluation.state === 'DEGRADED',
    ).toBe(true);
  });
});

describe('DND-1.8 proof — passive stability vs explicit intent', () => {
  it('passive continuation with previous preserves an equally-valid layout', () => {
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
    expect(result.resolved.placements.a).toEqual(previous.placements.a);
    expect(result.reflowed).toBe(false);
    expect(result.selection.code === 'STABILITY' || result.winnerId.startsWith('0:')).toBe(true);
  });

  it('explicit desired without previous is not defeated by a stale committed geometry', () => {
    // Adapter contract (ADR-0013): omit previous when author supplies new desiredPlacements.
    const previous = createResolvedLayout({
      space: { width: 400, height: 200 },
      placements: { a: { x: 0, y: 0, width: 80, height: 40 } },
    });
    const intent = intentWith(
      { width: 400, height: 200 },
      [
        {
          id: 'a',
          constraints: { minWidth: 40, minHeight: 20, preferredWidth: 80, preferredHeight: 40 },
        },
      ],
      { a: { x: 120, y: 40, width: 80, height: 40 } },
    );

    const withPrevious = solveLayout({ intent, previous });
    // Stale previous remains a VALID candidate and can win on stability.
    expect(withPrevious.resolved.placements.a).toEqual(previous.placements.a);

    const withoutPrevious = solveLayout({ intent });
    expect(withoutPrevious.resolved.placements.a).toEqual({
      x: 120,
      y: 40,
      width: 80,
      height: 40,
    });
    expect(withoutPrevious.resolved.placements.a).not.toEqual(previous.placements.a);
  });
});

describe('DND-1.8 proof — input order contract', () => {
  it('treats LayoutIntent item order as meaningful pack order (not permutation-invariant)', () => {
    const constraints = {
      minWidth: 40,
      minHeight: 20,
      preferredWidth: 100,
      preferredHeight: 40,
    };
    const ab = intentWith({ width: 300, height: 200 }, [
      { id: 'a', constraints },
      { id: 'b', constraints },
    ]);
    const ba = intentWith({ width: 300, height: 200 }, [
      { id: 'b', constraints },
      { id: 'a', constraints },
    ]);
    const resultAb = solveLayout({ intent: ab });
    const resultBa = solveLayout({ intent: ba });
    // Row packing places the first intent item at the origin.
    expect(resultAb.resolved.placements.a!.x).toBe(0);
    expect(resultBa.resolved.placements.b!.x).toBe(0);
    expect(resultAb.resolved.placements).not.toEqual(resultBa.resolved.placements);
  });
});

describe('DND-1.8 proof — extended determinism', () => {
  it('returns identical results across 100 repeated solves', () => {
    const intent = intentWith({ width: 800, height: 500 }, [
      {
        id: 'chart',
        constraints: {
          minWidth: 80,
          minUsefulWidth: 160,
          preferredWidth: 220,
          minHeight: 48,
          preferredHeight: 96,
        },
      },
      {
        id: 'table',
        constraints: {
          minWidth: 100,
          minUsefulWidth: 180,
          preferredWidth: 240,
          minHeight: 56,
          preferredHeight: 120,
        },
      },
      {
        id: 'metric',
        constraints: {
          minWidth: 48,
          minUsefulWidth: 64,
          preferredWidth: 80,
          minHeight: 40,
          preferredHeight: 72,
        },
      },
    ]);
    const previous = createResolvedLayout({
      space: { width: 800, height: 500 },
      placements: {
        chart: { x: 10, y: 10, width: 200, height: 90 },
        table: { x: 220, y: 10, width: 220, height: 110 },
        metric: { x: 450, y: 10, width: 80, height: 70 },
      },
    });
    const first = solveLayout({ intent, previous });
    for (let i = 0; i < 100; i += 1) {
      const next = solveLayout({ intent, previous });
      expect(next.evaluation.state).toBe(first.evaluation.state);
      expect(next.evaluation.score).toEqual(first.evaluation.score);
      expect(next.resolved.placements).toEqual(first.resolved.placements);
      expect(next.winnerId).toBe(first.winnerId);
      expect(next.candidates.map((c) => c.id)).toEqual(first.candidates.map((c) => c.id));
    }
  });
});
