/**
 * Deterministic Auto-Layout + solve fixtures for DND-3.2 / DND-3.3 benchmarks.
 *
 * Imports the compiled INTERNAL proposal module from Core `dist/` (not a public
 * package export). Timings measure proposal enrichment + existing `solveLayout`.
 * DND-3.3 adds reflow sequences that pass previous ResolvedLayout as stability only.
 */
import {
  createContentConstraints,
  createLayoutIntent,
  createLayoutItem,
  createResolvedLayout,
  solveLayout,
  type LayoutIntent,
  type ResolvedLayout,
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
  | 'spatial-nofit'
  | 'reflow-stable'
  | 'reflow-shrink'
  | 'reflow-grow'
  | 'reflow-hybrid'
  | 'reflow-source-insert'
  | 'reflow-unplaced-recovery'
  | 'reflow-size-change-stable'
  | 'reflow-size-change-displaced';

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
  /**
   * Optional previous layout for DND-3.3 reflow scenarios.
   * When set, proposal uses `{ intent, previous }` then solve uses the same previous.
   */
  readonly buildPrevious?: () => ResolvedLayout;
}

export interface ReflowSequenceScenario {
  readonly id: string;
  readonly label: string;
  readonly itemCount: number;
  readonly scenarioClass: AutoScenarioClass;
  /** Run a multi-cycle propose→solve sequence; returns final cycle results. */
  readonly run: () => {
    readonly proposals: readonly AutoLayoutProposal[];
    readonly results: readonly SolverResult[];
  };
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

export function proposeAndSolve(
  intent: LayoutIntent,
  previous?: ResolvedLayout,
): {
  readonly proposal: AutoLayoutProposal;
  readonly result: SolverResult;
} {
  const proposal = createAutoLayoutProposal(
    previous === undefined ? { intent } : { intent, previous },
  );
  const result = solveLayout(
    previous === undefined
      ? { intent: proposal.effectiveIntent }
      : { intent: proposal.effectiveIntent, previous },
  );
  return { proposal, result };
}

/** Single-cycle DND-3.2 scenarios (still measured). */
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

const reflowItem = {
  minWidth: 40,
  minHeight: 30,
  preferredWidth: 100,
  preferredHeight: 70,
};

/** DND-3.3 single-cycle reflow scenarios (intent + previous). */
export const REFLOW_SCENARIOS: readonly AutoBenchScenario[] = [
  {
    id: 'reflow-stable',
    label: 'Reflow stable — retain feasible previous generated (8 items)',
    itemCount: 8,
    scenarioClass: 'reflow-stable',
    expectedState: 'VALID',
    buildIntent: () => intentOf({ width: 1200, height: 800 }, specs(8)),
    buildPrevious: () => {
      const initial = proposeAndSolve(intentOf({ width: 1200, height: 800 }, specs(8)));
      return initial.result.resolved;
    },
  },
  {
    id: 'reflow-shrink',
    label: 'Reflow shrink — retain feasible, reflow/unplace displaced (6 items)',
    itemCount: 6,
    scenarioClass: 'reflow-shrink',
    expectedState: 'VALID',
    buildIntent: () => intentOf({ width: 500, height: 400 }, specs(6)),
    buildPrevious: () => {
      const initial = proposeAndSolve(intentOf({ width: 900, height: 600 }, specs(6)));
      return initial.result.resolved;
    },
  },
  {
    id: 'reflow-grow',
    label: 'Reflow grow — stable retain + room for recovery (6 items)',
    itemCount: 6,
    scenarioClass: 'reflow-grow',
    expectedState: 'VALID',
    buildIntent: () => intentOf({ width: 1200, height: 800 }, specs(6)),
    buildPrevious: () => {
      const initial = proposeAndSolve(intentOf({ width: 700, height: 500 }, specs(6)));
      return initial.result.resolved;
    },
  },
  {
    id: 'reflow-hybrid',
    label: 'Reflow hybrid — source + retained + reflowed generated (8 items)',
    itemCount: 8,
    scenarioClass: 'reflow-hybrid',
    expectedState: 'VALID',
    expectOrigins: {
      i0: 'source',
      i3: 'source',
    },
    buildIntent: () => {
      const itemSpecs = specs(8);
      return intentOf({ width: 1200, height: 800 }, itemSpecs, {
        i0: { x: 0, y: 0, width: 100, height: 70 },
        i3: { x: 600, y: 0, width: 110, height: 80 },
      });
    },
    buildPrevious: () => {
      const itemSpecs = specs(8);
      const initial = proposeAndSolve(
        intentOf({ width: 1200, height: 800 }, itemSpecs, {
          i0: { x: 200, y: 0, width: 100, height: 70 },
          i3: { x: 600, y: 0, width: 110, height: 80 },
        }),
      );
      return initial.result.resolved;
    },
  },
  {
    id: 'reflow-source-insert',
    label: 'Reflow source-insert — source wins over previous generated (4 items)',
    itemCount: 4,
    scenarioClass: 'reflow-source-insert',
    expectedState: 'VALID',
    expectOrigins: { a: 'source' },
    buildIntent: () =>
      intentOf(
        { width: 600, height: 400 },
        [
          { id: 'a', constraints: reflowItem },
          { id: 'b', constraints: reflowItem },
          { id: 'c', constraints: reflowItem },
          { id: 'd', constraints: reflowItem },
        ],
        {
          a: { x: 100, y: 0, width: 100, height: 70 },
        },
      ),
    buildPrevious: () => {
      const initial = proposeAndSolve(
        intentOf({ width: 600, height: 400 }, [
          { id: 'a', constraints: reflowItem },
          { id: 'b', constraints: reflowItem },
          { id: 'c', constraints: reflowItem },
          { id: 'd', constraints: reflowItem },
        ]),
      );
      return initial.result.resolved;
    },
  },
  {
    id: 'reflow-unplaced-recovery',
    label: 'Reflow unplaced recovery — grow after no-fit (2 items)',
    itemCount: 2,
    scenarioClass: 'reflow-unplaced-recovery',
    expectedState: 'VALID',
    expectOrigins: { a: 'generated', b: 'generated' },
    buildIntent: () =>
      intentOf({ width: 300, height: 100 }, [
        {
          id: 'a',
          constraints: { minWidth: 10, preferredWidth: 100, preferredHeight: 100 },
        },
        {
          id: 'b',
          constraints: { minWidth: 10, preferredWidth: 100, preferredHeight: 100 },
        },
      ]),
    buildPrevious: () => {
      const small = proposeAndSolve(
        intentOf({ width: 100, height: 100 }, [
          {
            id: 'a',
            constraints: { minWidth: 10, preferredWidth: 100, preferredHeight: 100 },
          },
          {
            id: 'b',
            constraints: { minWidth: 10, preferredWidth: 100, preferredHeight: 100 },
          },
        ]),
      );
      return createResolvedLayout({
        space: { width: 100, height: 100 },
        placements: {
          a: small.proposal.generatedPlacements.a!,
        },
      });
    },
  },
  {
    id: 'reflow-size-change-stable',
    label: 'Reflow size-change stable — previous x/y + larger current size (1 item)',
    itemCount: 1,
    scenarioClass: 'reflow-size-change-stable',
    expectedState: 'VALID',
    expectOrigins: { b: 'generated' },
    buildIntent: () =>
      intentOf({ width: 600, height: 400 }, [
        {
          id: 'b',
          constraints: {
            minWidth: 40,
            minHeight: 30,
            preferredWidth: 220,
            preferredHeight: 150,
          },
        },
      ]),
    buildPrevious: () =>
      createResolvedLayout({
        space: { width: 600, height: 400 },
        placements: { b: { x: 100, y: 100, width: 200, height: 150 } },
      }),
  },
  {
    id: 'reflow-size-change-displaced',
    label: 'Reflow size-change displaced — resized previous x/y exits container (1 item)',
    itemCount: 1,
    scenarioClass: 'reflow-size-change-displaced',
    expectedState: 'VALID',
    expectOrigins: { b: 'generated' },
    buildIntent: () =>
      intentOf({ width: 500, height: 300 }, [
        {
          id: 'b',
          constraints: {
            minWidth: 40,
            minHeight: 30,
            preferredWidth: 400,
            preferredHeight: 150,
          },
        },
      ]),
    buildPrevious: () =>
      createResolvedLayout({
        space: { width: 500, height: 300 },
        placements: { b: { x: 300, y: 100, width: 200, height: 150 } },
      }),
  },
];

/** All single-cycle Auto-Layout bench scenarios (DND-3.2 + DND-3.3). */
export const ALL_AUTO_SCENARIOS: readonly AutoBenchScenario[] = [
  ...AUTO_SCENARIOS,
  ...REFLOW_SCENARIOS,
];

/** Multi-cycle sequence benchmarks (pure Core; no DOM observers). */
export const REFLOW_SEQUENCE_SCENARIOS: readonly ReflowSequenceScenario[] = [
  {
    id: 'reflow-seq-resize',
    label: 'Sequence: initial → solve → resize reflow → solve',
    itemCount: 8,
    scenarioClass: 'reflow-stable',
    run: () => {
      const intent1 = intentOf({ width: 1000, height: 700 }, specs(8));
      const cycle1 = proposeAndSolve(intent1);
      const intent2 = intentOf({ width: 900, height: 650 }, specs(8));
      const cycle2 = proposeAndSolve(intent2, cycle1.result.resolved);
      return {
        proposals: [cycle1.proposal, cycle2.proposal],
        results: [cycle1.result, cycle2.result],
      };
    },
  },
  {
    id: 'reflow-seq-grow-shrink-grow',
    label: 'Sequence: grow → shrink → grow',
    itemCount: 6,
    scenarioClass: 'reflow-grow',
    run: () => {
      const c1 = proposeAndSolve(intentOf({ width: 600, height: 400 }, specs(6)));
      const c2 = proposeAndSolve(
        intentOf({ width: 1000, height: 700 }, specs(6)),
        c1.result.resolved,
      );
      const c3 = proposeAndSolve(
        intentOf({ width: 700, height: 450 }, specs(6)),
        c2.result.resolved,
      );
      const c4 = proposeAndSolve(
        intentOf({ width: 1100, height: 750 }, specs(6)),
        c3.result.resolved,
      );
      return {
        proposals: [c1.proposal, c2.proposal, c3.proposal, c4.proposal],
        results: [c1.result, c2.result, c3.result, c4.result],
      };
    },
  },
];
