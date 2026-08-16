/**
 * Deterministic Auto-Layout + solve fixtures for DND-3.2 benchmarks.
 *
 * Imports the compiled INTERNAL proposal module from Core `dist/` (not a public
 * package export). Timings measure proposal enrichment + existing `solveLayout`.
 */
import {
  createContentConstraints,
  createLayoutIntent,
  createLayoutItem,
  solveLayout,
  type LayoutIntent,
  type SolverResult,
} from '@dndgem/core';
import {
  createAutoLayoutProposal,
  type AutoLayoutProposal,
} from '../../packages/core/dist/auto-layout.js';

export type AutoScenarioClass =
  | 'auto-small'
  | 'auto-medium'
  | 'auto-dense'
  | 'hybrid-explicit-auto'
  | 'constrained-auto'
  | 'unsat-auto'
  | 'spatial-nofit';

export interface AutoBenchScenario {
  readonly id: string;
  readonly label: string;
  readonly itemCount: number;
  readonly scenarioClass: AutoScenarioClass;
  readonly expectedState: 'VALID' | 'DEGRADED' | 'INVALID';
  /** Expected origins for a subset of keys (optional spot checks). */
  readonly expectOrigins?: Readonly<Record<string, 'source' | 'generated'>>;
  /** Automatic items expected to remain unplaced (spatial no-fit). */
  readonly expectUnplaced?: readonly string[];
  readonly buildIntent: () => LayoutIntent;
}

type ItemSpec = {
  readonly id: string;
  readonly constraints: Parameters<typeof createContentConstraints>[0];
};

function item(id: string, constraints: ItemSpec['constraints']) {
  return createLayoutItem({
    id,
    constraints: createContentConstraints(constraints),
  });
}

function intentOf(
  space: { width: number; height: number },
  specs: readonly ItemSpec[],
  desiredPlacements?: Record<string, { x: number; y: number; width: number; height: number }>,
): LayoutIntent {
  return createLayoutIntent({
    space,
    items: specs.map((spec) => item(spec.id, spec.constraints)),
    desiredPlacements,
  });
}

function lightSpec(index: number): ItemSpec {
  const id = `i${index}`;
  const kind = index % 4;
  if (kind === 0) {
    return {
      id,
      constraints: { minWidth: 40, minHeight: 30, preferredWidth: 100, preferredHeight: 70 },
    };
  }
  if (kind === 1) {
    return {
      id,
      constraints: { minWidth: 36, minHeight: 28, preferredWidth: 90, preferredHeight: 60 },
    };
  }
  if (kind === 2) {
    return {
      id,
      constraints: { minWidth: 48, minHeight: 40, preferredWidth: 110, preferredHeight: 80 },
    };
  }
  return {
    id,
    constraints: { minWidth: 32, minHeight: 32, preferredWidth: 70, preferredHeight: 70 },
  };
}

function specs(count: number): ItemSpec[] {
  const out: ItemSpec[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(lightSpec(i));
  }
  return out;
}

export function proposeAndSolve(intent: LayoutIntent): {
  readonly proposal: AutoLayoutProposal;
  readonly result: SolverResult;
} {
  const proposal = createAutoLayoutProposal({ intent });
  const result = solveLayout({ intent: proposal.effectiveIntent });
  return { proposal, result };
}

export const AUTO_SCENARIOS: readonly AutoBenchScenario[] = [
  {
    id: 'auto-small',
    label: 'Fully automatic small (6 items)',
    itemCount: 6,
    scenarioClass: 'auto-small',
    expectedState: 'VALID',
    buildIntent: () => intentOf({ width: 900, height: 600 }, specs(6)),
  },
  {
    id: 'auto-medium',
    label: 'Fully automatic medium (16 items)',
    itemCount: 16,
    scenarioClass: 'auto-medium',
    expectedState: 'VALID',
    buildIntent: () => intentOf({ width: 1400, height: 900 }, specs(16)),
  },
  {
    id: 'auto-dense',
    label: 'Fully automatic dense (24 items)',
    itemCount: 24,
    scenarioClass: 'auto-dense',
    expectedState: 'VALID',
    buildIntent: () => intentOf({ width: 1600, height: 1100 }, specs(24)),
  },
  {
    id: 'hybrid-explicit-auto',
    label: 'Hybrid explicit + automatic (8 items)',
    itemCount: 8,
    scenarioClass: 'hybrid-explicit-auto',
    expectedState: 'VALID',
    expectOrigins: {
      i0: 'source',
      i1: 'generated',
      i2: 'generated',
      i3: 'source',
    },
    buildIntent: () => {
      const itemSpecs = specs(8);
      return intentOf({ width: 1200, height: 800 }, itemSpecs, {
        i0: { x: 0, y: 0, width: 100, height: 70 },
        i3: { x: 600, y: 0, width: 110, height: 80 },
      });
    },
  },
  {
    id: 'constrained-auto',
    label: 'Constrained automatic (12 items)',
    itemCount: 12,
    scenarioClass: 'constrained-auto',
    expectedState: 'VALID',
    buildIntent: () => {
      const itemSpecs: ItemSpec[] = [];
      for (let i = 0; i < 12; i += 1) {
        itemSpecs.push({
          id: `c${i}`,
          constraints: {
            minWidth: 60,
            minHeight: 48,
            minUsefulWidth: 80,
            minUsefulHeight: 56,
            preferredWidth: 100,
            preferredHeight: 72,
            maxWidth: 200,
            maxHeight: 160,
          },
        });
      }
      return intentOf({ width: 1400, height: 900 }, itemSpecs);
    },
  },
  {
    id: 'unsat-auto',
    label: 'Unsatisfiable automatic hard mins (4 items)',
    itemCount: 4,
    scenarioClass: 'unsat-auto',
    expectedState: 'INVALID',
    // First item claims the full clamped container; later items are spatially unplaced.
    // Hard-min INVALID remains the solver outcome (distinct from spatial-nofit alone).
    expectOrigins: { a: 'generated' },
    expectUnplaced: ['b', 'c', 'd'],
    buildIntent: () =>
      intentOf({ width: 200, height: 200 }, [
        { id: 'a', constraints: { minWidth: 400, minHeight: 400 } },
        { id: 'b', constraints: { minWidth: 400, minHeight: 400 } },
        { id: 'c', constraints: { minWidth: 400, minHeight: 400 } },
        { id: 'd', constraints: { minWidth: 400, minHeight: 400 } },
      ]),
  },
  {
    id: 'spatial-nofit',
    label: 'Spatial no-fit — individually feasible, no non-overlapping room',
    itemCount: 2,
    scenarioClass: 'spatial-nofit',
    // Incomplete proposal; solver may still pack independently — state is not the Auto-Layout signal.
    expectedState: 'VALID',
    expectOrigins: { a: 'source' },
    expectUnplaced: ['b'],
    buildIntent: () =>
      intentOf(
        { width: 100, height: 100 },
        [
          { id: 'a', constraints: { minWidth: 10, preferredWidth: 100, preferredHeight: 100 } },
          { id: 'b', constraints: { minWidth: 10, preferredWidth: 80, preferredHeight: 80 } },
        ],
        {
          a: { x: 0, y: 0, width: 100, height: 100 },
        },
      ),
  },
];
