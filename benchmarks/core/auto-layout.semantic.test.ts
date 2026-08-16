import { describe, expect, it } from 'vitest';
import {
  ALL_AUTO_SCENARIOS,
  AUTO_SCENARIOS,
  REFLOW_SCENARIOS,
  REFLOW_SEQUENCE_SCENARIOS,
  proposeAndSolve,
} from './auto-layout-fixtures.js';

function runScenario(scenario: (typeof ALL_AUTO_SCENARIOS)[number]) {
  const intent = scenario.buildIntent();
  const previous = scenario.buildPrevious?.();
  return proposeAndSolve(intent, previous);
}

describe('DND-3.2 Auto-Layout fixtures — semantic gates', () => {
  it('every cold-start scenario proposes and solves with expected validity', () => {
    for (const scenario of AUTO_SCENARIOS) {
      const { proposal, result } = runScenario(scenario);
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

      const again = runScenario(scenario);
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
    const { proposal } = runScenario(scenario);
    expect(proposal.unplacedItemIds).toEqual(['b']);
    expect(proposal.effectiveIntent.desiredPlacements?.b).toBeUndefined();
    expect(proposal.generatedPlacements.b).toBeUndefined();
  });
});

describe('DND-3.3 Auto-Layout reflow fixtures — semantic gates', () => {
  it('every reflow scenario proposes and solves with expected validity', () => {
    for (const scenario of REFLOW_SCENARIOS) {
      const { proposal, result } = runScenario(scenario);
      expect(result.evaluation.state, scenario.id).toBe(scenario.expectedState);

      const unplaced = scenario.expectUnplaced ?? [];
      expect(proposal.unplacedItemIds, scenario.id).toEqual([...unplaced]);

      if (scenario.expectOrigins !== undefined) {
        for (const [key, origin] of Object.entries(scenario.expectOrigins)) {
          expect(proposal.placementOrigins[key], `${scenario.id}:${key}`).toBe(origin);
        }
      }

      // previous never becomes source
      for (const origin of Object.values(proposal.placementOrigins)) {
        expect(origin === 'source' || origin === 'generated', scenario.id).toBe(true);
      }

      const again = runScenario(scenario);
      expect(again.proposal).toEqual(proposal);
      expect(again.result.resolved).toEqual(result.resolved);
    }
  });

  it('reflow-stable retains previous generated positions when feasible', () => {
    const scenario = REFLOW_SCENARIOS.find((s) => s.id === 'reflow-stable');
    expect(scenario).toBeDefined();
    if (scenario === undefined || scenario.buildPrevious === undefined) {
      return;
    }
    const previous = scenario.buildPrevious();
    const { proposal } = proposeAndSolve(scenario.buildIntent(), previous);
    for (const [key, rect] of Object.entries(previous.placements)) {
      if (proposal.placementOrigins[key] === 'generated') {
        expect(proposal.effectiveIntent.desiredPlacements?.[key], key).toEqual(rect);
      }
    }
  });

  it('reflow-unplaced-recovery places both items as generated', () => {
    const scenario = REFLOW_SCENARIOS.find((s) => s.id === 'reflow-unplaced-recovery');
    expect(scenario).toBeDefined();
    if (scenario === undefined) {
      return;
    }
    const { proposal } = runScenario(scenario);
    expect(proposal.placementOrigins).toEqual({ a: 'generated', b: 'generated' });
    expect(proposal.unplacedItemIds).toEqual([]);
  });

  it('reflow-size-change-stable retains previous x/y with current size', () => {
    const scenario = REFLOW_SCENARIOS.find((s) => s.id === 'reflow-size-change-stable');
    expect(scenario).toBeDefined();
    if (scenario === undefined || scenario.buildPrevious === undefined) {
      return;
    }
    const previous = scenario.buildPrevious();
    const { proposal } = proposeAndSolve(scenario.buildIntent(), previous);
    expect(proposal.effectiveIntent.desiredPlacements?.b).toEqual({
      x: 100,
      y: 100,
      width: 220,
      height: 150,
    });
    expect(proposal.placementOrigins.b).toBe('generated');
  });

  it('reflow-size-change-displaced rejects infeasible resized retention', () => {
    const scenario = REFLOW_SCENARIOS.find((s) => s.id === 'reflow-size-change-displaced');
    expect(scenario).toBeDefined();
    if (scenario === undefined) {
      return;
    }
    const { proposal } = runScenario(scenario);
    expect(proposal.placementOrigins.b).toBe('generated');
    expect(proposal.effectiveIntent.desiredPlacements?.b).toEqual({
      x: 0,
      y: 0,
      width: 400,
      height: 150,
    });
  });

  it('reflow sequences terminate deterministically', () => {
    for (const scenario of REFLOW_SEQUENCE_SCENARIOS) {
      const first = scenario.run();
      const second = scenario.run();
      expect(second.proposals).toEqual(first.proposals);
      expect(second.results.map((r) => r.resolved)).toEqual(first.results.map((r) => r.resolved));
      for (const result of first.results) {
        expect(['VALID', 'DEGRADED', 'INVALID']).toContain(result.evaluation.state);
      }
    }
  });
});
