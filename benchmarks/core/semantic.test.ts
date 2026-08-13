import { describe, expect, it } from 'vitest';
import { solveLayout } from '@dndgem/core';
import { SCENARIOS } from './fixtures.js';

describe('DND-1.8 benchmark fixtures — semantic gates', () => {
  it('every scenario builds and yields the expected semantic class', () => {
    for (const scenario of SCENARIOS) {
      const result = solveLayout(scenario.build());
      expect(result.evaluation.state, scenario.id).toBe(scenario.expectedState);
      if (scenario.expectedReflowed !== undefined) {
        expect(result.reflowed, scenario.id).toBe(scenario.expectedReflowed);
      }
      if (scenario.expectedSelectionCode !== undefined) {
        expect(result.selection.code, scenario.id).toBe(scenario.expectedSelectionCode);
      }
      expect(result.candidates.length, scenario.id).toBeGreaterThan(0);
      expect(result.candidates.length, scenario.id).toBeLessThanOrEqual(8);
      const again = solveLayout(scenario.build());
      expect(again.resolved).toEqual(result.resolved);
      expect(again.evaluation).toEqual(result.evaluation);
      expect(again.winnerId).toBe(result.winnerId);
    }
  });

  it('repeated solves on a fixed input stay identical (100×)', () => {
    const scenario = SCENARIOS.find((s) => s.id === 'scale-medium-16');
    expect(scenario).toBeDefined();
    if (scenario === undefined) {
      return;
    }
    const input = scenario.build();
    const first = solveLayout(input);
    for (let i = 0; i < 100; i += 1) {
      expect(solveLayout(input)).toEqual(first);
    }
  });
});
