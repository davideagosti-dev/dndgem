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
    // Previous is only a solve-time stability signal — proposal ignores it by design.
    const previous = createResolvedLayout({
      space: { width: 400, height: 300 },
      placements: { a: { x: 50, y: 50, width: 100, height: 80 } },
    });

    const proposal = createAutoLayoutProposal({ intent });
    expect(proposal.placementOrigins.a).toBe('generated');
    expect(proposal.effectiveIntent.desiredPlacements?.a).not.toEqual(previous.placements.a);

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
