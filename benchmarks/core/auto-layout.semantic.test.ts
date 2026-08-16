import { describe, expect, it } from 'vitest';
import { AUTO_SCENARIOS, proposeAndSolve } from './auto-layout-fixtures.js';

describe('DND-3.2 Auto-Layout fixtures — semantic gates', () => {
  it('every scenario proposes and solves with expected validity', () => {
    for (const scenario of AUTO_SCENARIOS) {
      const { proposal, result } = proposeAndSolve(scenario.buildIntent());
      expect(result.evaluation.state, scenario.id).toBe(scenario.expectedState);

      const unplaced = scenario.expectUnplaced ?? [];
      expect(proposal.unplacedItemIds, scenario.id).toEqual([...unplaced]);
      expect(Object.keys(proposal.placementOrigins).length, scenario.id).toBe(
        scenario.itemCount - unplaced.length,
      );

      for (const id of unplaced) {
        expect(
          proposal.effectiveIntent.desiredPlacements?.[id],
          `${scenario.id}:${id}`,
        ).toBeUndefined();
        expect(proposal.generatedPlacements[id], `${scenario.id}:${id}`).toBeUndefined();
        expect(proposal.placementOrigins[id], `${scenario.id}:${id}`).toBeUndefined();
      }

      if (unplaced.length === 0) {
        expect(proposal.effectiveIntent.desiredPlacements, scenario.id).toBeDefined();
      }

      if (scenario.expectOrigins !== undefined) {
        for (const [key, origin] of Object.entries(scenario.expectOrigins)) {
          expect(proposal.placementOrigins[key], `${scenario.id}:${key}`).toBe(origin);
        }
      }

      const again = proposeAndSolve(scenario.buildIntent());
      expect(again.proposal).toEqual(proposal);
      expect(again.result.resolved).toEqual(result.resolved);
      expect(again.result.evaluation).toEqual(result.evaluation);
    }
  });

  it('repeated proposal+solve on a fixed auto-medium input stay identical (50×)', () => {
    const scenario = AUTO_SCENARIOS.find((s) => s.id === 'auto-medium');
    expect(scenario).toBeDefined();
    if (scenario === undefined) {
      return;
    }
    const intent = scenario.buildIntent();
    const first = proposeAndSolve(intent);
    for (let i = 0; i < 50; i += 1) {
      expect(proposeAndSolve(intent)).toEqual(first);
    }
  });

  it('spatial no-fit terminates without fabricating (0,0) overlap', () => {
    const scenario = AUTO_SCENARIOS.find((s) => s.id === 'spatial-nofit');
    expect(scenario).toBeDefined();
    if (scenario === undefined) {
      return;
    }
    const { proposal } = proposeAndSolve(scenario.buildIntent());
    expect(proposal.unplacedItemIds).toEqual(['b']);
    expect(proposal.effectiveIntent.desiredPlacements?.b).toBeUndefined();
    expect(proposal.generatedPlacements.b).toBeUndefined();
  });
});
