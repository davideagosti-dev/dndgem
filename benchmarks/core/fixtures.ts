/**
 * Deterministic Core solver fixtures for DND-1.8 benchmarks.
 *
 * No Math.random. Heterogeneous content constraints reflect the product thesis.
 * Callers must rebuild inputs per timed iteration if they need isolation from
 * accidental mutation (solveLayout itself does not mutate caller-owned objects).
 */
import {
  createContentConstraints,
  createLayoutIntent,
  createLayoutItem,
  createResolvedLayout,
  type LayoutIntent,
  type ResolvedLayout,
  type SolverInput,
} from '@dndgem/core';

export type ScenarioClass =
  'already-valid' | 'passive-reflow' | 'explicit-move' | 'unsatisfiable' | 'scaling';

export type ConstraintDensity = 'light' | 'moderate' | 'constrained';

export interface BenchScenario {
  readonly id: string;
  readonly label: string;
  readonly itemCount: number;
  readonly density: ConstraintDensity;
  readonly operation: 'initial' | 'passive-resize' | 'explicit-move' | 'unsatisfiable';
  readonly scenarioClass: ScenarioClass;
  /** Expected validity of the winning candidate. */
  readonly expectedState: 'VALID' | 'DEGRADED' | 'INVALID';
  readonly expectedReflowed?: boolean;
  readonly expectedSelectionCode?: string;
  readonly build: () => SolverInput;
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

/** Heterogeneous dashboard-like constraint profiles (deterministic cycles). */
function heterogeneousSpec(index: number, density: ConstraintDensity): ItemSpec {
  const id = `i${index}`;
  const kind = index % 4;

  if (density === 'light') {
    if (kind === 0) {
      return {
        id,
        constraints: { minWidth: 40, minHeight: 30, preferredWidth: 120, preferredHeight: 80 },
      };
    }
    if (kind === 1) {
      return {
        id,
        constraints: { minWidth: 36, minHeight: 28, preferredWidth: 96, preferredHeight: 64 },
      };
    }
    if (kind === 2) {
      return {
        id,
        constraints: { minWidth: 48, minHeight: 40, preferredWidth: 140, preferredHeight: 100 },
      };
    }
    return {
      id,
      constraints: { minWidth: 32, minHeight: 32, preferredWidth: 72, preferredHeight: 72 },
    };
  }

  if (density === 'moderate') {
    if (kind === 0) {
      // Wide chart
      return {
        id,
        constraints: {
          minWidth: 80,
          minHeight: 48,
          minUsefulWidth: 160,
          minUsefulHeight: 72,
          preferredWidth: 220,
          preferredHeight: 96,
        },
      };
    }
    if (kind === 1) {
      // Dense table
      return {
        id,
        constraints: {
          minWidth: 100,
          minHeight: 56,
          minUsefulWidth: 180,
          minUsefulHeight: 88,
          preferredWidth: 240,
          preferredHeight: 120,
        },
      };
    }
    if (kind === 2) {
      // Tall details
      return {
        id,
        constraints: {
          minWidth: 72,
          minHeight: 80,
          minUsefulWidth: 120,
          minUsefulHeight: 140,
          preferredWidth: 160,
          preferredHeight: 180,
        },
      };
    }
    // Small metric
    return {
      id,
      constraints: {
        minWidth: 48,
        minHeight: 40,
        minUsefulWidth: 64,
        minUsefulHeight: 56,
        preferredWidth: 80,
        preferredHeight: 72,
      },
    };
  }

  // constrained
  if (kind === 0) {
    return {
      id,
      constraints: {
        minWidth: 120,
        maxWidth: 400,
        minHeight: 64,
        minUsefulWidth: 200,
        minUsefulHeight: 80,
        preferredWidth: 260,
        preferredHeight: 100,
      },
    };
  }
  if (kind === 1) {
    return {
      id,
      constraints: {
        minWidth: 140,
        maxWidth: 420,
        minHeight: 72,
        minUsefulWidth: 220,
        minUsefulHeight: 100,
        preferredWidth: 280,
        preferredHeight: 140,
      },
    };
  }
  if (kind === 2) {
    return {
      id,
      constraints: {
        minWidth: 100,
        maxWidth: 300,
        minHeight: 100,
        minUsefulWidth: 140,
        minUsefulHeight: 160,
        preferredWidth: 180,
        preferredHeight: 200,
      },
    };
  }
  return {
    id,
    constraints: {
      minWidth: 64,
      maxWidth: 160,
      minHeight: 56,
      minUsefulWidth: 80,
      minUsefulHeight: 72,
      preferredWidth: 96,
      preferredHeight: 80,
    },
  };
}

function specs(count: number, density: ConstraintDensity): ItemSpec[] {
  const out: ItemSpec[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(heterogeneousSpec(i, density));
  }
  return out;
}

function rowDesired(
  spaceWidth: number,
  itemSpecs: readonly ItemSpec[],
  height = 80,
): Record<string, { x: number; y: number; width: number; height: number }> {
  const desired: Record<string, { x: number; y: number; width: number; height: number }> = {};
  const gap = 8;
  let x = gap;
  let y = gap;
  let rowHeight = height;
  for (const spec of itemSpecs) {
    const width = Math.min(
      spec.constraints.preferredWidth ?? spec.constraints.minWidth ?? 80,
      Math.max(40, spaceWidth - gap * 2),
    );
    if (x + width + gap > spaceWidth) {
      x = gap;
      y += rowHeight + gap;
      rowHeight = height;
    }
    desired[spec.id] = { x, y, width, height };
    x += width + gap;
  }
  return desired;
}

function asPrevious(
  space: { width: number; height: number },
  placements: Record<string, { x: number; y: number; width: number; height: number }>,
): ResolvedLayout {
  return createResolvedLayout({ space, placements });
}

export const SCENARIOS: readonly BenchScenario[] = [
  {
    id: 'valid-small-6',
    label: 'Already-valid small dashboard (6 items)',
    itemCount: 6,
    density: 'moderate',
    operation: 'initial',
    scenarioClass: 'already-valid',
    expectedState: 'VALID',
    expectedReflowed: false,
    build: () => {
      const itemSpecs = specs(6, 'moderate');
      const space = { width: 1200, height: 800 };
      const desired = rowDesired(space.width, itemSpecs, 96);
      // Prefer sizes that fit preferred so preserve-desired is VALID.
      return {
        intent: intentOf(space, itemSpecs, desired),
      };
    },
  },
  {
    id: 'reflow-medium-16',
    label: 'Passive resize reflow (16 items, wide→narrow)',
    itemCount: 16,
    density: 'moderate',
    operation: 'passive-resize',
    scenarioClass: 'passive-reflow',
    expectedState: 'VALID',
    expectedReflowed: true,
    build: () => {
      const itemSpecs = specs(16, 'moderate');
      const wide = { width: 1600, height: 900 };
      const narrow = { width: 420, height: 900 };
      // Previous is a wide row packing; narrow space forces reflow.
      const previous = asPrevious(wide, rowDesired(wide.width, itemSpecs, 100));
      return {
        intent: intentOf(narrow, itemSpecs),
        previous,
      };
    },
  },
  {
    id: 'explicit-move-8',
    label: 'Explicit move intent (8 items)',
    itemCount: 8,
    density: 'moderate',
    operation: 'explicit-move',
    scenarioClass: 'explicit-move',
    expectedState: 'VALID',
    build: () => {
      const itemSpecs = specs(8, 'moderate');
      const space = { width: 1000, height: 700 };
      const previousPlacements = rowDesired(space.width, itemSpecs, 90);
      const desired = { ...previousPlacements };
      // Move first item explicitly; omit relying on previous alone.
      const first = itemSpecs[0];
      if (first === undefined) {
        throw new Error('explicit-move fixture requires items');
      }
      desired[first.id] = {
        x: 40,
        y: 200,
        width: previousPlacements[first.id]?.width ?? 160,
        height: previousPlacements[first.id]?.height ?? 90,
      };
      // Explicit intent path: desired present; previous is the old committed layout
      // (adapters omit previous for genuine new intent — this scenario still measures
      // solve with both so ranking cost is realistic; semantic proof lives in unit tests).
      return {
        intent: intentOf(space, itemSpecs, desired),
        previous: asPrevious(space, previousPlacements),
      };
    },
  },
  {
    id: 'unsat-4',
    label: 'Unsatisfiable hard mins (4 items)',
    itemCount: 4,
    density: 'constrained',
    operation: 'unsatisfiable',
    scenarioClass: 'unsatisfiable',
    expectedState: 'INVALID',
    expectedSelectionCode: 'UNSATISFIABLE',
    expectedReflowed: false,
    build: () => {
      const itemSpecs: ItemSpec[] = [
        { id: 'a', constraints: { minWidth: 400, minHeight: 400 } },
        { id: 'b', constraints: { minWidth: 400, minHeight: 400 } },
        { id: 'c', constraints: { minWidth: 400, minHeight: 400 } },
        { id: 'd', constraints: { minWidth: 400, minHeight: 400 } },
      ];
      return {
        intent: intentOf({ width: 200, height: 200 }, itemSpecs),
      };
    },
  },
  {
    id: 'scale-small-6',
    label: 'Scaling sample — 6 items light',
    itemCount: 6,
    density: 'light',
    operation: 'initial',
    scenarioClass: 'scaling',
    expectedState: 'VALID',
    build: () => {
      const itemSpecs = specs(6, 'light');
      return { intent: intentOf({ width: 900, height: 600 }, itemSpecs) };
    },
  },
  {
    id: 'scale-medium-16',
    label: 'Scaling sample — 16 items moderate',
    itemCount: 16,
    density: 'moderate',
    operation: 'initial',
    scenarioClass: 'scaling',
    expectedState: 'VALID',
    build: () => {
      const itemSpecs = specs(16, 'moderate');
      return { intent: intentOf({ width: 1400, height: 900 }, itemSpecs) };
    },
  },
  {
    id: 'scale-large-40',
    label: 'Scaling sample — 40 items moderate',
    itemCount: 40,
    density: 'moderate',
    operation: 'initial',
    scenarioClass: 'scaling',
    expectedState: 'VALID',
    build: () => {
      const itemSpecs = specs(40, 'moderate');
      return { intent: intentOf({ width: 2000, height: 1400 }, itemSpecs) };
    },
  },
  {
    id: 'constrained-12',
    label: 'Constrained density initial (12 items)',
    itemCount: 12,
    density: 'constrained',
    operation: 'initial',
    scenarioClass: 'scaling',
    expectedState: 'VALID',
    build: () => {
      const itemSpecs = specs(12, 'constrained');
      return { intent: intentOf({ width: 1600, height: 1000 }, itemSpecs) };
    },
  },
];

export function listScenarioIds(): string[] {
  return SCENARIOS.map((s) => s.id);
}
