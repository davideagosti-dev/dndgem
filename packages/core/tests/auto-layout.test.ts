import { describe, expect, it } from 'vitest';
import { createAutoLayoutProposal, maxProbeCountForOccupancy } from '../src/auto-layout.js';
import {
  createContentConstraints,
  createLayoutIntent,
  createLayoutItem,
  createResolvedLayout,
  solveLayout,
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

function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

describe('createAutoLayoutProposal — provenance', () => {
  it('marks fully explicit layouts as all source and does not rewrite placements', () => {
    const intent = intentWith(
      { width: 400, height: 300 },
      [
        { id: 'a', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
        { id: 'b', constraints: { preferredWidth: 120, preferredHeight: 60, minWidth: 40 } },
      ],
      {
        a: { x: 10, y: 20, width: 100, height: 80 },
        b: { x: 150, y: 20, width: 120, height: 60 },
      },
    );

    const proposal = createAutoLayoutProposal({ intent });

    expect(proposal.placementOrigins).toEqual({ a: 'source', b: 'source' });
    expect(proposal.generatedPlacements).toEqual({});
    expect(proposal.unplacedItemIds).toEqual([]);
    expect(proposal.effectiveIntent.desiredPlacements).toEqual(intent.desiredPlacements);
  });

  it('marks fully automatic layouts as all generated', () => {
    const intent = intentWith({ width: 400, height: 300 }, [
      { id: 'a', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
      { id: 'b', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
    ]);

    const proposal = createAutoLayoutProposal({ intent });

    expect(proposal.placementOrigins).toEqual({ a: 'generated', b: 'generated' });
    expect(Object.keys(proposal.generatedPlacements).sort()).toEqual(['a', 'b']);
    expect(proposal.unplacedItemIds).toEqual([]);
    expect(proposal.effectiveIntent.desiredPlacements?.a).toBeDefined();
    expect(proposal.effectiveIntent.desiredPlacements?.b).toBeDefined();
  });

  it('preserves hybrid A/D source and B/C generated origins', () => {
    const intent = intentWith(
      { width: 500, height: 400 },
      [
        { id: 'a', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
        { id: 'b', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
        { id: 'c', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
        { id: 'd', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
      ],
      {
        a: { x: 0, y: 0, width: 100, height: 80 },
        d: { x: 300, y: 200, width: 100, height: 80 },
      },
    );

    const proposal = createAutoLayoutProposal({ intent });

    expect(proposal.placementOrigins).toEqual({
      a: 'source',
      b: 'generated',
      c: 'generated',
      d: 'source',
    });
    expect(proposal.generatedPlacements.a).toBeUndefined();
    expect(proposal.generatedPlacements.d).toBeUndefined();
    expect(proposal.generatedPlacements.b).toBeDefined();
    expect(proposal.generatedPlacements.c).toBeDefined();
    expect(proposal.unplacedItemIds).toEqual([]);
    expect(proposal.effectiveIntent.desiredPlacements?.a).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 80,
    });
    expect(proposal.effectiveIntent.desiredPlacements?.d).toEqual({
      x: 300,
      y: 200,
      width: 100,
      height: 80,
    });
  });

  it('never promotes generated placements to source across repeated proposals', () => {
    const source = intentWith({ width: 400, height: 300 }, [
      { id: 'a', constraints: { preferredWidth: 80, preferredHeight: 60, minWidth: 20 } },
      { id: 'b', constraints: { preferredWidth: 80, preferredHeight: 60, minWidth: 20 } },
    ]);

    const first = createAutoLayoutProposal({ intent: source });
    expect(first.placementOrigins).toEqual({ a: 'generated', b: 'generated' });

    // Feeding effective intent back without separating origins is a consumer mistake;
    // with the same Source Intent (no desired), origins remain generated.
    const second = createAutoLayoutProposal({ intent: source });
    expect(second.placementOrigins).toEqual({ a: 'generated', b: 'generated' });
    expect(second.effectiveIntent.desiredPlacements).toEqual(
      first.effectiveIntent.desiredPlacements,
    );
  });

  it('does not treat previous layout as source provenance', () => {
    const intent = intentWith({ width: 400, height: 300 }, [
      { id: 'a', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
    ]);
    // Previous is a stability signal only — may retain geometry, never origin = source.
    const previous = createResolvedLayout({
      space: { width: 400, height: 300 },
      placements: { a: { x: 50, y: 50, width: 100, height: 80 } },
    });

    const proposal = createAutoLayoutProposal({ intent, previous });
    expect(proposal.placementOrigins.a).toBe('generated');
    expect(proposal.effectiveIntent.desiredPlacements?.a).toEqual(previous.placements.a);

    const solved = solveLayout({ intent: proposal.effectiveIntent, previous });
    expect(solved.evaluation.state).toBeDefined();
    expect(proposal.placementOrigins.a).toBe('generated');
  });
});

describe('createAutoLayoutProposal — geometry / occupancy', () => {
  it('places generated items away from feasible source occupancy', () => {
    const intent = intentWith(
      { width: 400, height: 300 },
      [
        { id: 'a', constraints: { preferredWidth: 100, preferredHeight: 100, minWidth: 40 } },
        { id: 'b', constraints: { preferredWidth: 100, preferredHeight: 100, minWidth: 40 } },
      ],
      {
        a: { x: 0, y: 0, width: 100, height: 100 },
      },
    );

    const proposal = createAutoLayoutProposal({ intent });
    const a = proposal.effectiveIntent.desiredPlacements!.a!;
    const b = proposal.effectiveIntent.desiredPlacements!.b!;

    expect(proposal.placementOrigins).toEqual({ a: 'source', b: 'generated' });
    expect(rectsOverlap(a, b)).toBe(false);
    // First-fit: right edge of A at (100, 0).
    expect(b).toEqual({ x: 100, y: 0, width: 100, height: 100 });
  });

  it('places later generated items away from earlier generated occupancy', () => {
    const intent = intentWith({ width: 400, height: 300 }, [
      { id: 'a', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
      { id: 'b', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
      { id: 'c', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
    ]);

    const proposal = createAutoLayoutProposal({ intent });
    const placements = proposal.effectiveIntent.desiredPlacements!;
    const rects = [placements.a!, placements.b!, placements.c!];
    for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        expect(rectsOverlap(rects[i]!, rects[j]!)).toBe(false);
      }
    }
  });

  it('uses container origin as the first probe for the first automatic item', () => {
    const intent = intentWith({ width: 400, height: 300 }, [
      { id: 'a', constraints: { preferredWidth: 120, preferredHeight: 90, minWidth: 40 } },
    ]);

    const proposal = createAutoLayoutProposal({ intent });
    expect(proposal.effectiveIntent.desiredPlacements?.a).toEqual({
      x: 0,
      y: 0,
      width: 120,
      height: 90,
    });
  });

  it('enumerates right-edge then bottom-edge probes in stable order', () => {
    const intent = intentWith(
      { width: 500, height: 400 },
      [
        { id: 'anchor', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
        { id: 'auto', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
      ],
      {
        // Occupy origin so auto cannot take (0,0); first acceptable probe is right edge.
        anchor: { x: 0, y: 0, width: 100, height: 80 },
      },
    );

    const proposal = createAutoLayoutProposal({ intent });
    expect(proposal.effectiveIntent.desiredPlacements?.auto).toEqual({
      x: 100,
      y: 0,
      width: 100,
      height: 80,
    });
  });

  it('keeps generated placements inside container bounds when a fit exists', () => {
    const intent = intentWith({ width: 200, height: 200 }, [
      { id: 'a', constraints: { preferredWidth: 80, preferredHeight: 80, minWidth: 20 } },
      { id: 'b', constraints: { preferredWidth: 80, preferredHeight: 80, minWidth: 20 } },
    ]);

    const proposal = createAutoLayoutProposal({ intent });
    for (const rect of Object.values(proposal.effectiveIntent.desiredPlacements ?? {})) {
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(200);
      expect(rect.y + rect.height).toBeLessThanOrEqual(200);
    }
  });

  it('handles spatial no-fit without fabricating overlapping geometry', () => {
    // Individually feasible sizes, but source A occupies the whole container → B unplaced.
    const intent = intentWith(
      { width: 100, height: 100 },
      [
        { id: 'a', constraints: { preferredWidth: 100, preferredHeight: 100, minWidth: 10 } },
        { id: 'b', constraints: { preferredWidth: 80, preferredHeight: 80, minWidth: 10 } },
      ],
      {
        a: { x: 0, y: 0, width: 100, height: 100 },
      },
    );

    const proposal = createAutoLayoutProposal({ intent });

    expect(proposal.placementOrigins).toEqual({ a: 'source' });
    expect(proposal.placementOrigins.b).toBeUndefined();
    expect(proposal.generatedPlacements).toEqual({});
    expect(proposal.unplacedItemIds).toEqual(['b']);
    expect(proposal.effectiveIntent.desiredPlacements?.b).toBeUndefined();
    expect(proposal.effectiveIntent.desiredPlacements?.a).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
    // Explicit: no fabricated (0,0) for the unplaced automatic item.
    expect(proposal.effectiveIntent.desiredPlacements).not.toEqual(
      expect.objectContaining({
        b: expect.objectContaining({ x: 0, y: 0 }),
      }),
    );
  });

  it('leaves later automatic items unplaced when earlier generated occupancy blocks them', () => {
    // A fills the container as generated occupancy; B is individually feasible but has no probe.
    const intent = intentWith({ width: 100, height: 100 }, [
      { id: 'a', constraints: { preferredWidth: 100, preferredHeight: 100, minWidth: 10 } },
      { id: 'b', constraints: { preferredWidth: 50, preferredHeight: 50, minWidth: 10 } },
    ]);

    const proposal = createAutoLayoutProposal({ intent });

    expect(proposal.placementOrigins).toEqual({ a: 'generated' });
    expect(proposal.generatedPlacements.a).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
    expect(proposal.unplacedItemIds).toEqual(['b']);
    expect(proposal.effectiveIntent.desiredPlacements?.b).toBeUndefined();
    expect(proposal.generatedPlacements.b).toBeUndefined();
  });

  it('keeps spatial no-fit proposals deterministic and mutation-safe', () => {
    const build = () =>
      intentWith(
        { width: 100, height: 100 },
        [
          { id: 'a', constraints: { preferredWidth: 100, preferredHeight: 100, minWidth: 10 } },
          { id: 'b', constraints: { preferredWidth: 80, preferredHeight: 80, minWidth: 10 } },
          { id: 'c', constraints: { preferredWidth: 40, preferredHeight: 40, minWidth: 10 } },
        ],
        {
          a: { x: 0, y: 0, width: 100, height: 100 },
        },
      );

    const first = createAutoLayoutProposal({ intent: build() });
    expect(first.unplacedItemIds).toEqual(['b', 'c']);
    expect(first.placementOrigins).toEqual({ a: 'source' });
    expect(first.effectiveIntent.desiredPlacements?.b).toBeUndefined();
    expect(first.effectiveIntent.desiredPlacements?.c).toBeUndefined();

    for (let i = 0; i < 50; i += 1) {
      expect(createAutoLayoutProposal({ intent: build() })).toEqual(first);
    }

    const intent = build();
    const before = structuredClone(intent.desiredPlacements);
    createAutoLayoutProposal({ intent });
    expect(intent.desiredPlacements).toEqual(before);
  });

  it('does not treat infeasible source rects as occupancy obstacles', () => {
    const intent = intentWith(
      { width: 200, height: 200 },
      [
        { id: 'a', constraints: { preferredWidth: 80, preferredHeight: 80, minWidth: 20 } },
        { id: 'b', constraints: { preferredWidth: 80, preferredHeight: 80, minWidth: 20 } },
      ],
      {
        // Outside container — still source, but not occupancy.
        a: { x: 500, y: 500, width: 80, height: 80 },
      },
    );

    const proposal = createAutoLayoutProposal({ intent });
    expect(proposal.placementOrigins.a).toBe('source');
    expect(proposal.effectiveIntent.desiredPlacements?.a).toEqual({
      x: 500,
      y: 500,
      width: 80,
      height: 80,
    });
    // Auto can take container origin because infeasible source is not occupancy.
    expect(proposal.effectiveIntent.desiredPlacements?.b).toEqual({
      x: 0,
      y: 0,
      width: 80,
      height: 80,
    });
  });
});

describe('createAutoLayoutProposal — determinism', () => {
  it('produces deep-equal proposals for identical semantic inputs', () => {
    const build = () =>
      intentWith(
        { width: 480, height: 360 },
        [
          { id: 'a', constraints: { preferredWidth: 100, preferredHeight: 70, minWidth: 40 } },
          { id: 'b', constraints: { preferredWidth: 90, preferredHeight: 70, minWidth: 40 } },
          { id: 'c', constraints: { preferredWidth: 110, preferredHeight: 70, minWidth: 40 } },
        ],
        {
          a: { x: 0, y: 0, width: 100, height: 70 },
        },
      );

    const first = createAutoLayoutProposal({ intent: build() });
    const second = createAutoLayoutProposal({ intent: build() });
    expect(second).toEqual(first);

    for (let i = 0; i < 50; i += 1) {
      expect(createAutoLayoutProposal({ intent: build() })).toEqual(first);
    }
  });

  it('processes items in LayoutIntent.items declaration order', () => {
    const forward = intentWith({ width: 500, height: 200 }, [
      { id: 'first', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 20 } },
      { id: 'second', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 20 } },
    ]);
    const reverse = intentWith({ width: 500, height: 200 }, [
      { id: 'second', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 20 } },
      { id: 'first', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 20 } },
    ]);

    const a = createAutoLayoutProposal({ intent: forward });
    const b = createAutoLayoutProposal({ intent: reverse });

    // First declared item claims (0,0); second takes right edge.
    expect(a.effectiveIntent.desiredPlacements?.first).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 80,
    });
    expect(a.effectiveIntent.desiredPlacements?.second).toEqual({
      x: 100,
      y: 0,
      width: 100,
      height: 80,
    });
    expect(b.effectiveIntent.desiredPlacements?.second).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 80,
    });
    expect(b.effectiveIntent.desiredPlacements?.first).toEqual({
      x: 100,
      y: 0,
      width: 100,
      height: 80,
    });
  });

  it('documents bounded probe counts', () => {
    expect(maxProbeCountForOccupancy(0)).toBe(1);
    expect(maxProbeCountForOccupancy(3)).toBe(7);
    expect(maxProbeCountForOccupancy(10)).toBe(21);
  });
});

describe('createAutoLayoutProposal — constraints / sizing', () => {
  it('reuses preferred sizing targets for generated placements', () => {
    const intent = intentWith({ width: 400, height: 300 }, [
      {
        id: 'a',
        constraints: {
          minWidth: 40,
          minHeight: 30,
          preferredWidth: 150,
          preferredHeight: 90,
        },
      },
    ]);

    const proposal = createAutoLayoutProposal({ intent });
    expect(proposal.effectiveIntent.desiredPlacements?.a).toEqual({
      x: 0,
      y: 0,
      width: 150,
      height: 90,
    });
  });

  it('supports useful sizing mode when requested', () => {
    const intent = intentWith({ width: 400, height: 300 }, [
      {
        id: 'a',
        constraints: {
          minWidth: 40,
          minUsefulWidth: 120,
          preferredWidth: 200,
          minHeight: 30,
          minUsefulHeight: 60,
          preferredHeight: 100,
        },
      },
    ]);

    const proposal = createAutoLayoutProposal({ intent, sizingMode: 'useful' });
    expect(proposal.effectiveIntent.desiredPlacements?.a).toEqual({
      x: 0,
      y: 0,
      width: 120,
      height: 60,
    });
  });
});

describe('createAutoLayoutProposal — solver composition', () => {
  it('flows effective intent through solveLayout for feasible auto layouts', () => {
    const intent = intentWith({ width: 600, height: 400 }, [
      { id: 'a', constraints: { preferredWidth: 120, preferredHeight: 80, minWidth: 40 } },
      { id: 'b', constraints: { preferredWidth: 120, preferredHeight: 80, minWidth: 40 } },
      { id: 'c', constraints: { preferredWidth: 120, preferredHeight: 80, minWidth: 40 } },
    ]);

    const proposal = createAutoLayoutProposal({ intent });
    const result = solveLayout({ intent: proposal.effectiveIntent });

    expect(result.evaluation.state).toBe('VALID');
    expect(result.resolved.placements.a).toBeDefined();
    expect(result.resolved.placements.b).toBeDefined();
    expect(result.resolved.placements.c).toBeDefined();
  });

  it('preserves DEGRADED when useful thresholds cannot be met', () => {
    const intent = intentWith({ width: 100, height: 80 }, [
      {
        id: 'a',
        constraints: {
          minWidth: 40,
          minUsefulWidth: 200,
          preferredWidth: 200,
          minHeight: 20,
          minUsefulHeight: 20,
          preferredHeight: 40,
        },
      },
    ]);

    const proposal = createAutoLayoutProposal({ intent });
    const result = solveLayout({ intent: proposal.effectiveIntent });
    expect(result.evaluation.state).toBe('DEGRADED');
  });

  it('preserves INVALID for hard-constraint impossibility', () => {
    const intent = intentWith({ width: 50, height: 50 }, [
      {
        id: 'a',
        constraints: { minWidth: 200, minHeight: 200 },
      },
    ]);

    const proposal = createAutoLayoutProposal({ intent });
    expect(proposal.unplacedItemIds).toEqual([]);
    const result = solveLayout({ intent: proposal.effectiveIntent });
    expect(result.evaluation.state).toBe('INVALID');
  });

  it('distinguishes spatial no-fit proposal incompleteness from solver validity', () => {
    // Feasible individual sizes; Auto-Layout cannot place B without overlap.
    const intent = intentWith(
      { width: 100, height: 100 },
      [
        { id: 'a', constraints: { preferredWidth: 100, preferredHeight: 100, minWidth: 10 } },
        { id: 'b', constraints: { preferredWidth: 80, preferredHeight: 80, minWidth: 10 } },
      ],
      {
        a: { x: 0, y: 0, width: 100, height: 100 },
      },
    );

    const proposal = createAutoLayoutProposal({ intent });
    expect(proposal.unplacedItemIds).toEqual(['b']);
    expect(proposal.effectiveIntent.desiredPlacements?.b).toBeUndefined();

    // Incomplete effective intent may still be solved via packing candidates;
    // proposal incompleteness is not a parallel Auto-* validity state.
    const result = solveLayout({ intent: proposal.effectiveIntent });
    expect(['VALID', 'DEGRADED', 'INVALID']).toContain(result.evaluation.state);
    expect(proposal.unplacedItemIds).toEqual(['b']);
  });

  it('composes hybrid source/generated through solveLayout', () => {
    const intent = intentWith(
      { width: 600, height: 400 },
      [
        { id: 'a', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
        { id: 'b', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
        { id: 'c', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
        { id: 'd', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
      ],
      {
        a: { x: 0, y: 0, width: 100, height: 80 },
        d: { x: 400, y: 0, width: 100, height: 80 },
      },
    );

    const proposal = createAutoLayoutProposal({ intent });
    expect(proposal.placementOrigins).toEqual({
      a: 'source',
      b: 'generated',
      c: 'generated',
      d: 'source',
    });

    const result = solveLayout({ intent: proposal.effectiveIntent });
    expect(['VALID', 'DEGRADED', 'INVALID']).toContain(result.evaluation.state);
    expect(result.resolved.placements.a).toBeDefined();
    expect(result.resolved.placements.d).toBeDefined();
  });
});

describe('createAutoLayoutProposal — mutation safety', () => {
  it('does not mutate Source Intent desired placements', () => {
    const desired = {
      a: { x: 0, y: 0, width: 100, height: 80 },
    };
    const intent = intentWith(
      { width: 400, height: 300 },
      [
        { id: 'a', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
        { id: 'b', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
      ],
      desired,
    );

    const before = structuredClone(intent.desiredPlacements);
    const proposal = createAutoLayoutProposal({ intent });

    expect(intent.desiredPlacements).toEqual(before);
    expect(intent.desiredPlacements).not.toBe(proposal.effectiveIntent.desiredPlacements);
    expect(Object.keys(intent.desiredPlacements ?? {})).toEqual(['a']);
  });
});

describe('createAutoLayoutProposal — opt-in / public surface', () => {
  it('does not change solveLayout when Auto-Layout is not invoked', () => {
    const intent = intentWith({ width: 400, height: 300 }, [
      { id: 'a', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
    ]);
    const withoutAuto = solveLayout({ intent });
    expect(withoutAuto.evaluation.state).toBe('VALID');
    // Packing still works without desired placements — same as pre-DND-3.2.
    expect(withoutAuto.resolved.placements.a).toBeDefined();
  });

  it('is not exported from the package public entry', async () => {
    const api = await import('../src/index.js');
    expect('createAutoLayoutProposal' in api).toBe(false);
    expect('PlacementOrigin' in api).toBe(false);
    expect('AutoLayoutProposal' in api).toBe(false);
  });
});

describe('createAutoLayoutProposal — DND-3.3 stability / adaptive reflow', () => {
  const itemConstraints = {
    preferredWidth: 100,
    preferredHeight: 80,
    minWidth: 40,
    minHeight: 20,
  };

  it('retains a feasible previous generated placement', () => {
    const intent = intentWith({ width: 400, height: 300 }, [
      { id: 'a', constraints: itemConstraints },
    ]);
    const previous = createResolvedLayout({
      space: { width: 400, height: 300 },
      placements: { a: { x: 120, y: 40, width: 100, height: 80 } },
    });

    const cold = createAutoLayoutProposal({ intent });
    expect(cold.effectiveIntent.desiredPlacements?.a).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 80,
    });

    const stable = createAutoLayoutProposal({ intent, previous });
    expect(stable.placementOrigins.a).toBe('generated');
    expect(stable.effectiveIntent.desiredPlacements?.a).toEqual({
      x: 120,
      y: 40,
      width: 100,
      height: 80,
    });
    expect(stable.generatedPlacements.a).toEqual(stable.effectiveIntent.desiredPlacements?.a);
  });

  it('retains multiple generated placements and keeps declaration-order retention', () => {
    const intent = intentWith({ width: 200, height: 200 }, [
      { id: 'b', constraints: itemConstraints },
      { id: 'c', constraints: itemConstraints },
    ]);
    // Both previous rects overlap — earlier declaration (b) retains; c must reflow/unplace.
    const previous = createResolvedLayout({
      space: { width: 200, height: 200 },
      placements: {
        b: { x: 0, y: 0, width: 100, height: 80 },
        c: { x: 40, y: 20, width: 100, height: 80 },
      },
    });

    const proposal = createAutoLayoutProposal({ intent, previous });
    expect(proposal.placementOrigins.b).toBe('generated');
    expect(proposal.effectiveIntent.desiredPlacements?.b).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 80,
    });
    expect(proposal.placementOrigins.c).toBe('generated');
    expect(proposal.effectiveIntent.desiredPlacements?.c).not.toEqual({
      x: 40,
      y: 20,
      width: 100,
      height: 80,
    });
    expect(
      rectsOverlap(
        proposal.effectiveIntent.desiredPlacements!.b!,
        proposal.effectiveIntent.desiredPlacements!.c!,
      ),
    ).toBe(false);
  });

  it('reflows only the displaced generated item and keeps unaffected items stable', () => {
    const previous = createResolvedLayout({
      space: { width: 400, height: 200 },
      placements: {
        a: { x: 0, y: 0, width: 100, height: 80 },
        b: { x: 100, y: 0, width: 100, height: 80 },
        c: { x: 250, y: 0, width: 100, height: 80 },
      },
    });

    // Insert source A occupying c's previous space — c must reflow; b retains.
    const withSource = intentWith(
      { width: 300, height: 200 },
      [
        { id: 'a', constraints: itemConstraints },
        { id: 'b', constraints: itemConstraints },
        { id: 'c', constraints: itemConstraints },
      ],
      {
        a: { x: 250, y: 0, width: 100, height: 80 },
      },
    );

    const proposal = createAutoLayoutProposal({ intent: withSource, previous });
    expect(proposal.placementOrigins).toEqual({
      a: 'source',
      b: 'generated',
      c: 'generated',
    });
    expect(proposal.effectiveIntent.desiredPlacements?.b).toEqual({
      x: 100,
      y: 0,
      width: 100,
      height: 80,
    });
    expect(proposal.effectiveIntent.desiredPlacements?.c).not.toEqual({
      x: 250,
      y: 0,
      width: 100,
      height: 80,
    });
    expect(proposal.effectiveIntent.desiredPlacements?.a).toEqual({
      x: 250,
      y: 0,
      width: 100,
      height: 80,
    });
  });

  it('retains feasible placements on shrink and unplaces no-fit without fabrication', () => {
    const constraints = {
      preferredWidth: 80,
      preferredHeight: 80,
      minWidth: 20,
      minHeight: 20,
    };
    const intent = intentWith({ width: 160, height: 80 }, [
      { id: 'a', constraints },
      { id: 'b', constraints },
      { id: 'c', constraints },
    ]);
    const previous = createResolvedLayout({
      space: { width: 240, height: 80 },
      placements: {
        a: { x: 0, y: 0, width: 80, height: 80 },
        b: { x: 80, y: 0, width: 80, height: 80 },
        c: { x: 160, y: 0, width: 80, height: 80 },
      },
    });

    const proposal = createAutoLayoutProposal({ intent, previous });
    expect(proposal.effectiveIntent.desiredPlacements?.a).toEqual({
      x: 0,
      y: 0,
      width: 80,
      height: 80,
    });
    expect(proposal.effectiveIntent.desiredPlacements?.b).toEqual({
      x: 80,
      y: 0,
      width: 80,
      height: 80,
    });
    expect(proposal.unplacedItemIds).toEqual(['c']);
    expect(proposal.placementOrigins.c).toBeUndefined();
    expect(proposal.effectiveIntent.desiredPlacements?.c).toBeUndefined();
    expect(proposal.generatedPlacements.c).toBeUndefined();
  });

  it('keeps existing generated placements stable on growth and recovers unplaced items', () => {
    const constraints = {
      preferredWidth: 80,
      preferredHeight: 80,
      minWidth: 20,
      minHeight: 20,
    };
    const smallIntent = intentWith({ width: 80, height: 80 }, [
      { id: 'a', constraints },
      { id: 'b', constraints },
    ]);
    const cycle1 = createAutoLayoutProposal({ intent: smallIntent });
    expect(cycle1.placementOrigins.a).toBe('generated');
    expect(cycle1.unplacedItemIds).toEqual(['b']);

    const previous = createResolvedLayout({
      space: { width: 80, height: 80 },
      placements: { a: cycle1.generatedPlacements.a! },
    });

    const grown = intentWith({ width: 200, height: 80 }, [
      { id: 'a', constraints },
      { id: 'b', constraints },
    ]);
    const cycle2 = createAutoLayoutProposal({ intent: grown, previous });
    expect(cycle2.effectiveIntent.desiredPlacements?.a).toEqual(previous.placements.a);
    expect(cycle2.placementOrigins).toEqual({ a: 'generated', b: 'generated' });
    expect(cycle2.unplacedItemIds).toEqual([]);
    expect(cycle2.generatedPlacements.b).toBeDefined();
  });

  it('hybrid: retains source + stable generated and reflows blocked generated', () => {
    const previous = createResolvedLayout({
      space: { width: 400, height: 200 },
      placements: {
        a: { x: 0, y: 0, width: 100, height: 80 },
        b: { x: 100, y: 0, width: 100, height: 80 },
        c: { x: 200, y: 0, width: 100, height: 80 },
        d: { x: 300, y: 0, width: 100, height: 80 },
      },
    });

    // New source for A occupies former C space — C must reflow; B retains; A/D source.
    const next = intentWith(
      { width: 400, height: 200 },
      [
        { id: 'a', constraints: itemConstraints },
        { id: 'b', constraints: itemConstraints },
        { id: 'c', constraints: itemConstraints },
        { id: 'd', constraints: itemConstraints },
      ],
      {
        a: { x: 200, y: 0, width: 100, height: 80 },
        d: { x: 300, y: 0, width: 100, height: 80 },
      },
    );

    const proposal = createAutoLayoutProposal({ intent: next, previous });
    expect(proposal.placementOrigins).toEqual({
      a: 'source',
      b: 'generated',
      c: 'generated',
      d: 'source',
    });
    expect(proposal.effectiveIntent.desiredPlacements?.b).toEqual({
      x: 100,
      y: 0,
      width: 100,
      height: 80,
    });
    expect(proposal.effectiveIntent.desiredPlacements?.c).not.toEqual({
      x: 200,
      y: 0,
      width: 100,
      height: 80,
    });
    expect(proposal.unplacedItemIds).toEqual([]);
  });

  it('hybrid + unplaced: source retained, generated retained, no-fit stays unplaced', () => {
    const constraints = {
      preferredWidth: 100,
      preferredHeight: 100,
      minWidth: 10,
      minHeight: 10,
    };
    const intent = intentWith(
      { width: 200, height: 100 },
      [
        { id: 'a', constraints },
        { id: 'b', constraints },
        { id: 'c', constraints },
      ],
      {
        a: { x: 0, y: 0, width: 100, height: 100 },
      },
    );
    const previous = createResolvedLayout({
      space: { width: 300, height: 100 },
      placements: {
        a: { x: 0, y: 0, width: 100, height: 100 },
        b: { x: 100, y: 0, width: 100, height: 100 },
        c: { x: 200, y: 0, width: 100, height: 100 },
      },
    });

    const proposal = createAutoLayoutProposal({ intent, previous });
    expect(proposal.placementOrigins).toEqual({ a: 'source', b: 'generated' });
    expect(proposal.unplacedItemIds).toEqual(['c']);
    expect(proposal.placementOrigins.c).toBeUndefined();
    expect(proposal.effectiveIntent.desiredPlacements?.c).toBeUndefined();
  });

  it('source wins occupancy over previous generated geometry', () => {
    const intent = intentWith(
      { width: 300, height: 200 },
      [
        { id: 'a', constraints: itemConstraints },
        { id: 'b', constraints: itemConstraints },
      ],
      {
        a: { x: 50, y: 50, width: 100, height: 80 },
      },
    );
    const previous = createResolvedLayout({
      space: { width: 300, height: 200 },
      placements: {
        b: { x: 50, y: 50, width: 100, height: 80 },
      },
    });

    const proposal = createAutoLayoutProposal({ intent, previous });
    expect(proposal.placementOrigins.a).toBe('source');
    expect(proposal.effectiveIntent.desiredPlacements?.a).toEqual({
      x: 50,
      y: 50,
      width: 100,
      height: 80,
    });
    expect(proposal.placementOrigins.b).toBe('generated');
    expect(proposal.effectiveIntent.desiredPlacements?.b).not.toEqual({
      x: 50,
      y: 50,
      width: 100,
      height: 80,
    });
    expect(
      rectsOverlap(
        proposal.effectiveIntent.desiredPlacements!.a!,
        proposal.effectiveIntent.desiredPlacements!.b!,
      ),
    ).toBe(false);
  });

  it('generated → unplaced → generated keeps origin generated', () => {
    const constraints = {
      preferredWidth: 80,
      preferredHeight: 80,
      minWidth: 10,
      minHeight: 10,
    };
    const large = intentWith({ width: 200, height: 80 }, [
      { id: 'a', constraints },
      { id: 'b', constraints },
    ]);
    const cycle1 = createAutoLayoutProposal({ intent: large });
    expect(cycle1.placementOrigins).toEqual({ a: 'generated', b: 'generated' });

    const midPrevious = createResolvedLayout({
      space: { width: 200, height: 80 },
      placements: {
        a: cycle1.generatedPlacements.a!,
        b: cycle1.generatedPlacements.b!,
      },
    });

    const shrunk = intentWith({ width: 80, height: 80 }, [
      { id: 'a', constraints },
      { id: 'b', constraints },
    ]);
    const cycle2 = createAutoLayoutProposal({ intent: shrunk, previous: midPrevious });
    expect(cycle2.placementOrigins.a).toBe('generated');
    expect(cycle2.unplacedItemIds).toEqual(['b']);
    expect(cycle2.placementOrigins.b).toBeUndefined();

    const shrinkPrevious = createResolvedLayout({
      space: { width: 80, height: 80 },
      placements: { a: cycle2.generatedPlacements.a! },
    });
    const cycle3 = createAutoLayoutProposal({ intent: large, previous: shrinkPrevious });
    expect(cycle3.placementOrigins).toEqual({ a: 'generated', b: 'generated' });
    expect(cycle3.unplacedItemIds).toEqual([]);
    expect(cycle3.effectiveIntent.desiredPlacements?.a).toEqual(shrinkPrevious.placements.a);
  });

  it('source → generated after source removal; generated → source via explicit input', () => {
    const constraints = itemConstraints;
    const asSource = intentWith({ width: 400, height: 300 }, [{ id: 'a', constraints }], {
      a: { x: 80, y: 40, width: 100, height: 80 },
    });
    const cycle1 = createAutoLayoutProposal({ intent: asSource });
    expect(cycle1.placementOrigins.a).toBe('source');

    const previous = createResolvedLayout({
      space: { width: 400, height: 300 },
      placements: { a: { x: 80, y: 40, width: 100, height: 80 } },
    });
    const automatic = intentWith({ width: 400, height: 300 }, [{ id: 'a', constraints }]);
    const cycle2 = createAutoLayoutProposal({ intent: automatic, previous });
    expect(cycle2.placementOrigins.a).toBe('generated');
    expect(cycle2.effectiveIntent.desiredPlacements?.a).toEqual({
      x: 80,
      y: 40,
      width: 100,
      height: 80,
    });

    const againSource = intentWith({ width: 400, height: 300 }, [{ id: 'a', constraints }], {
      a: { x: 10, y: 10, width: 100, height: 80 },
    });
    const cycle3 = createAutoLayoutProposal({
      intent: againSource,
      previous: createResolvedLayout({
        space: { width: 400, height: 300 },
        placements: { a: cycle2.generatedPlacements.a! },
      }),
    });
    expect(cycle3.placementOrigins.a).toBe('source');
    expect(cycle3.effectiveIntent.desiredPlacements?.a).toEqual({
      x: 10,
      y: 10,
      width: 100,
      height: 80,
    });
  });

  it('retains previous x/y with current size when size changes and position remains feasible', () => {
    // Regression A: size change alone must not force first-fit relocation.
    const intent = intentWith({ width: 500, height: 400 }, [
      {
        id: 'b',
        constraints: {
          preferredWidth: 220,
          preferredHeight: 150,
          minWidth: 40,
          minHeight: 20,
        },
      },
    ]);
    const previous = createResolvedLayout({
      space: { width: 500, height: 400 },
      placements: { b: { x: 100, y: 100, width: 200, height: 150 } },
    });

    const cold = createAutoLayoutProposal({ intent });
    expect(cold.effectiveIntent.desiredPlacements?.b).toEqual({
      x: 0,
      y: 0,
      width: 220,
      height: 150,
    });

    const proposal = createAutoLayoutProposal({ intent, previous });
    expect(proposal.placementOrigins.b).toBe('generated');
    expect(proposal.effectiveIntent.desiredPlacements?.b).toEqual({
      x: 100,
      y: 100,
      width: 220,
      height: 150,
    });
  });

  it('rejects retention when current-size rectangle at previous x/y is infeasible', () => {
    // Regression B: grow at same x/y exits container → Stage C reflow.
    const intent = intentWith({ width: 500, height: 300 }, [
      {
        id: 'b',
        constraints: {
          preferredWidth: 400,
          preferredHeight: 150,
          minWidth: 40,
          minHeight: 20,
        },
      },
    ]);
    const previous = createResolvedLayout({
      space: { width: 500, height: 300 },
      placements: { b: { x: 300, y: 100, width: 200, height: 150 } },
    });

    const proposal = createAutoLayoutProposal({ intent, previous });
    expect(proposal.placementOrigins.b).toBe('generated');
    // 300+400 exceeds container → not retained; first-fit takes (0,0).
    expect(proposal.effectiveIntent.desiredPlacements?.b).toEqual({
      x: 0,
      y: 0,
      width: 400,
      height: 150,
    });
  });

  it('rejects resized retention that would overlap Source Intent', () => {
    // Regression C: grow into source occupancy → source wins; generated reflows.
    const intent = intentWith(
      { width: 500, height: 300 },
      [
        {
          id: 'a',
          constraints: {
            preferredWidth: 100,
            preferredHeight: 100,
            minWidth: 40,
            minHeight: 20,
          },
        },
        {
          id: 'b',
          constraints: {
            preferredWidth: 160,
            preferredHeight: 100,
            minWidth: 40,
            minHeight: 20,
          },
        },
      ],
      {
        a: { x: 0, y: 0, width: 100, height: 100 },
      },
    );
    const previous = createResolvedLayout({
      space: { width: 500, height: 300 },
      placements: {
        a: { x: 0, y: 0, width: 100, height: 100 },
        b: { x: 80, y: 0, width: 100, height: 100 },
      },
    });

    const proposal = createAutoLayoutProposal({ intent, previous });
    expect(proposal.placementOrigins.a).toBe('source');
    expect(proposal.effectiveIntent.desiredPlacements?.a).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
    expect(proposal.placementOrigins.b).toBe('generated');
    expect(proposal.effectiveIntent.desiredPlacements?.b).not.toEqual({
      x: 80,
      y: 0,
      width: 160,
      height: 100,
    });
    expect(
      rectsOverlap(
        proposal.effectiveIntent.desiredPlacements!.a!,
        proposal.effectiveIntent.desiredPlacements!.b!,
      ),
    ).toBe(false);
  });

  it('retains earlier resized generated; later overlapping resized candidate reflows', () => {
    // Regression D: declaration order — B retains; C overlaps B after grow → reflow.
    const intent = intentWith({ width: 500, height: 300 }, [
      {
        id: 'b',
        constraints: {
          preferredWidth: 150,
          preferredHeight: 100,
          minWidth: 40,
          minHeight: 20,
        },
      },
      {
        id: 'c',
        constraints: {
          preferredWidth: 150,
          preferredHeight: 100,
          minWidth: 40,
          minHeight: 20,
        },
      },
    ]);
    const previous = createResolvedLayout({
      space: { width: 500, height: 300 },
      placements: {
        b: { x: 0, y: 0, width: 100, height: 100 },
        c: { x: 120, y: 0, width: 100, height: 100 },
      },
    });

    const proposal = createAutoLayoutProposal({ intent, previous });
    expect(proposal.effectiveIntent.desiredPlacements?.b).toEqual({
      x: 0,
      y: 0,
      width: 150,
      height: 100,
    });
    expect(proposal.placementOrigins.c).toBe('generated');
    expect(proposal.effectiveIntent.desiredPlacements?.c).not.toEqual({
      x: 120,
      y: 0,
      width: 150,
      height: 100,
    });
    expect(
      rectsOverlap(
        proposal.effectiveIntent.desiredPlacements!.b!,
        proposal.effectiveIntent.desiredPlacements!.c!,
      ),
    ).toBe(false);
  });

  it('retains previous x/y when dimensions shrink and does not compact to origin', () => {
    const intent = intentWith({ width: 600, height: 400 }, [
      {
        id: 'b',
        constraints: {
          preferredWidth: 220,
          preferredHeight: 180,
          minWidth: 40,
          minHeight: 20,
        },
      },
    ]);
    const previous = createResolvedLayout({
      space: { width: 600, height: 400 },
      placements: { b: { x: 200, y: 100, width: 300, height: 200 } },
    });

    const proposal = createAutoLayoutProposal({ intent, previous });
    expect(proposal.placementOrigins.b).toBe('generated');
    expect(proposal.effectiveIntent.desiredPlacements?.b).toEqual({
      x: 200,
      y: 100,
      width: 220,
      height: 180,
    });
  });

  it('retains previous geometry when size is unchanged', () => {
    const intent = intentWith({ width: 400, height: 300 }, [
      {
        id: 'a',
        constraints: {
          preferredWidth: 100,
          preferredHeight: 80,
          minWidth: 40,
          minHeight: 20,
        },
      },
    ]);
    const previous = createResolvedLayout({
      space: { width: 400, height: 300 },
      placements: { a: { x: 50, y: 50, width: 100, height: 80 } },
    });

    const proposal = createAutoLayoutProposal({ intent, previous });
    expect(proposal.effectiveIntent.desiredPlacements?.a).toEqual({
      x: 50,
      y: 50,
      width: 100,
      height: 80,
    });
  });

  it('adding a new automatic item does not move retained existing items', () => {
    const intent = intentWith({ width: 500, height: 200 }, [
      { id: 'a', constraints: itemConstraints },
      { id: 'b', constraints: itemConstraints },
    ]);
    const previous = createResolvedLayout({
      space: { width: 500, height: 200 },
      placements: {
        a: { x: 100, y: 20, width: 100, height: 80 },
      },
    });

    const proposal = createAutoLayoutProposal({ intent, previous });
    expect(proposal.effectiveIntent.desiredPlacements?.a).toEqual({
      x: 100,
      y: 20,
      width: 100,
      height: 80,
    });
    expect(proposal.placementOrigins.b).toBe('generated');
    expect(proposal.generatedPlacements.b).toBeDefined();
  });

  it('removing an item does not trigger automatic compaction', () => {
    const intent = intentWith({ width: 500, height: 200 }, [
      { id: 'b', constraints: itemConstraints },
    ]);
    const previous = createResolvedLayout({
      space: { width: 500, height: 200 },
      placements: {
        a: { x: 0, y: 0, width: 100, height: 80 },
        b: { x: 150, y: 0, width: 100, height: 80 },
      },
    });

    const proposal = createAutoLayoutProposal({ intent, previous });
    // B stays at previous position even though (0,0) is free — no opportunistic compaction.
    expect(proposal.effectiveIntent.desiredPlacements?.b).toEqual({
      x: 150,
      y: 0,
      width: 100,
      height: 80,
    });
    expect(proposal.placementOrigins.b).toBe('generated');
  });

  it('same current input + same previous → identical proposals (determinism)', () => {
    const buildIntent = () =>
      intentWith(
        { width: 400, height: 300 },
        [
          { id: 'a', constraints: itemConstraints },
          { id: 'b', constraints: itemConstraints },
          { id: 'c', constraints: itemConstraints },
        ],
        {
          a: { x: 0, y: 0, width: 100, height: 80 },
        },
      );
    const previous = createResolvedLayout({
      space: { width: 500, height: 300 },
      placements: {
        a: { x: 0, y: 0, width: 100, height: 80 },
        b: { x: 120, y: 40, width: 100, height: 80 },
        c: { x: 240, y: 40, width: 100, height: 80 },
      },
    });

    const first = createAutoLayoutProposal({ intent: buildIntent(), previous });
    for (let i = 0; i < 50; i += 1) {
      expect(createAutoLayoutProposal({ intent: buildIntent(), previous })).toEqual(first);
    }
  });

  it('does not mutate previous ResolvedLayout', () => {
    const intent = intentWith({ width: 400, height: 300 }, [
      { id: 'a', constraints: itemConstraints },
      { id: 'b', constraints: itemConstraints },
    ]);
    const previous = createResolvedLayout({
      space: { width: 400, height: 300 },
      placements: {
        a: { x: 10, y: 10, width: 100, height: 80 },
        b: { x: 120, y: 10, width: 100, height: 80 },
      },
    });
    const before = structuredClone(previous);

    createAutoLayoutProposal({ intent, previous });
    expect(previous).toEqual(before);
  });

  it('adaptive reflow never fabricates no-fit geometry', () => {
    const intent = intentWith(
      { width: 100, height: 100 },
      [
        { id: 'a', constraints: { preferredWidth: 100, preferredHeight: 100, minWidth: 10 } },
        { id: 'b', constraints: { preferredWidth: 80, preferredHeight: 80, minWidth: 10 } },
      ],
      {
        a: { x: 0, y: 0, width: 100, height: 100 },
      },
    );
    const previous = createResolvedLayout({
      space: { width: 200, height: 100 },
      placements: {
        a: { x: 0, y: 0, width: 100, height: 100 },
        b: { x: 100, y: 0, width: 80, height: 80 },
      },
    });

    const proposal = createAutoLayoutProposal({ intent, previous });
    expect(proposal.unplacedItemIds).toEqual(['b']);
    expect(proposal.effectiveIntent.desiredPlacements?.b).toBeUndefined();
    expect(proposal.generatedPlacements.b).toBeUndefined();
    expect(proposal.placementOrigins.b).toBeUndefined();
  });

  it('composes stable proposal through solveLayout without new validity vocabulary', () => {
    const intent = intentWith({ width: 400, height: 300 }, [
      { id: 'a', constraints: itemConstraints },
      { id: 'b', constraints: itemConstraints },
    ]);
    const previous = createResolvedLayout({
      space: { width: 500, height: 300 },
      placements: {
        a: { x: 40, y: 20, width: 100, height: 80 },
        b: { x: 160, y: 20, width: 100, height: 80 },
      },
    });

    const proposal = createAutoLayoutProposal({ intent, previous });
    const result = solveLayout({ intent: proposal.effectiveIntent, previous });
    expect(['VALID', 'DEGRADED', 'INVALID']).toContain(result.evaluation.state);
    expect(result.evaluation.state).toBe('VALID');
    expect(proposal.placementOrigins).toEqual({ a: 'generated', b: 'generated' });
  });
});
