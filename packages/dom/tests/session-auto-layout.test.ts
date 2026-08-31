import { describe, expect, it } from 'vitest';
import { createAutoLayoutProposal, createLayoutIntent, solveLayout } from '@dndgem/core';
import { createLayoutSession, type LayoutSessionState } from '../src/index.js';
import {
  FakeResizeObserver,
  createFakeDragMechanics,
  fakeElement,
  lastFakeObserver,
  resetFakeResizeObservers,
  styleReflectingElement,
  type FakeBox,
} from './helpers.js';

const SMALL = {
  minWidth: 20,
  minHeight: 10,
  preferredWidth: 80,
  preferredHeight: 40,
} as const;

describe('createLayoutSession — Auto-Layout (DND-3.4)', () => {
  it('keeps Auto-Layout off by default and omits autoLayout state', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 400, height: 200 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: SMALL,
        },
      ],
      desiredPlacements: { a: { x: 0, y: 0, width: 80, height: 40 } },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    expect(session.getState().autoLayout).toBeUndefined();
    expect(session.getState().resolved.placements.a).toEqual({
      x: 0,
      y: 0,
      width: 80,
      height: 40,
    });
    session.dispose();
  });

  it('places all items when fully automatic (no desiredPlacements)', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 400, height: 200 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: SMALL,
        },
        {
          id: 'b',
          element: fakeElement({ left: 0, top: 0, width: 60, height: 40 }),
          constraints: {
            minWidth: 20,
            minHeight: 10,
            preferredWidth: 60,
            preferredHeight: 40,
          },
        },
      ],
      autoLayout: true,
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    const state = session.getState();
    expect(state.autoLayout?.enabled).toBe(true);
    expect(state.autoLayout?.proposalUnplacedItemIds).toEqual([]);
    expect(state.resolved.placements.a).toBeDefined();
    expect(state.resolved.placements.b).toBeDefined();
    session.dispose();
  });

  it('preserves hybrid Source Intent and generates the remainder', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 600, height: 300 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 100, height: 80 }),
          constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 },
        },
        {
          id: 'b',
          element: fakeElement({ left: 0, top: 0, width: 100, height: 80 }),
          constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 },
        },
        {
          id: 'c',
          element: fakeElement({ left: 0, top: 0, width: 100, height: 80 }),
          constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 },
        },
        {
          id: 'd',
          element: fakeElement({ left: 0, top: 0, width: 100, height: 80 }),
          constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 },
        },
      ],
      autoLayout: true,
      desiredPlacements: {
        a: { x: 0, y: 0, width: 100, height: 80 },
        d: { x: 400, y: 0, width: 100, height: 80 },
      },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    const state = session.getState();
    expect(state.resolved.placements.a).toEqual({ x: 0, y: 0, width: 100, height: 80 });
    expect(state.resolved.placements.d).toEqual({ x: 400, y: 0, width: 100, height: 80 });
    expect(state.resolved.placements.b).toBeDefined();
    expect(state.resolved.placements.c).toBeDefined();
    expect(state.autoLayout?.proposalUnplacedItemIds).toEqual([]);
    session.dispose();
  });

  it('surfaces proposalUnplacedItemIds without fabricating Auto-Layout geometry', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 100, height: 100 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 100, height: 100 }),
          constraints: { preferredWidth: 100, preferredHeight: 100, minWidth: 10 },
        },
        {
          id: 'b',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 80 }),
          constraints: { preferredWidth: 80, preferredHeight: 80, minWidth: 10 },
        },
      ],
      autoLayout: true,
      desiredPlacements: {
        a: { x: 0, y: 0, width: 100, height: 100 },
      },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    expect(session.getState().autoLayout?.proposalUnplacedItemIds).toEqual(['b']);
    session.dispose();
  });

  it('keeps proposalUnplacedItemIds when the solver still resolves that item', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 100, height: 100 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 100, height: 100 }),
          constraints: { preferredWidth: 100, preferredHeight: 100, minWidth: 10 },
        },
        {
          id: 'b',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 80 }),
          constraints: { preferredWidth: 80, preferredHeight: 80, minWidth: 10 },
        },
      ],
      autoLayout: true,
      desiredPlacements: {
        a: { x: 0, y: 0, width: 100, height: 100 },
      },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    const state = session.getState();
    // Proposal layer: B has no non-overlapping Auto-Layout placement.
    expect(state.autoLayout?.proposalUnplacedItemIds).toEqual(['b']);
    // Solver may still pack B independently — completeness ≠ final placement existence.
    expect(state.resolved.placements.b).toBeDefined();
    expect(['VALID', 'DEGRADED', 'INVALID']).toContain(state.solver.evaluation.state);
    session.dispose();
  });

  it('keeps proposalUnplacedItemIds independent when the solver is INVALID', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 50, height: 50 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 50, height: 50 }),
          constraints: { preferredWidth: 50, preferredHeight: 50, minWidth: 10, minHeight: 10 },
        },
        {
          id: 'b',
          element: fakeElement({ left: 0, top: 0, width: 40, height: 40 }),
          // Individually infeasible hard mins → solver INVALID; proposal also cannot place B.
          constraints: {
            preferredWidth: 200,
            preferredHeight: 200,
            minWidth: 200,
            minHeight: 200,
          },
        },
      ],
      autoLayout: true,
      desiredPlacements: {
        a: { x: 0, y: 0, width: 50, height: 50 },
      },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    const state = session.getState();
    expect(state.autoLayout?.proposalUnplacedItemIds).toEqual(['b']);
    expect(state.solver.evaluation.state).toBe('INVALID');
    session.dispose();
  });

  it('passive resize keeps Source Intent and does not promote generated to source', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const containerBox: FakeBox = { left: 0, top: 0, width: 600, height: 300 };
    const session = createLayoutSession({
      container: fakeElement(containerBox),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 100, height: 80 }),
          constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 },
        },
        {
          id: 'b',
          element: fakeElement({ left: 0, top: 0, width: 100, height: 80 }),
          constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 },
        },
        {
          id: 'c',
          element: fakeElement({ left: 0, top: 0, width: 100, height: 80 }),
          constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 },
        },
      ],
      autoLayout: true,
      desiredPlacements: {
        a: { x: 10, y: 10, width: 100, height: 80 },
      },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    const before = session.getState();
    const bBefore = before.resolved.placements.b;
    expect(bBefore).toBeDefined();

    containerBox.width = 580;
    lastFakeObserver().deliver();

    const after = session.getState();
    expect(after.resolved.placements.a).toEqual({ x: 10, y: 10, width: 100, height: 80 });
    expect(after.resolved.placements.b).toEqual(bBefore);

    // Source Intent remains only A: Core proposal with only A as source + previous matches.
    const proposal = createAutoLayoutProposal({
      intent: createLayoutIntent({
        space: after.resolved.space,
        items: [
          { id: 'a', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
          { id: 'b', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
          { id: 'c', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
        ],
        desiredPlacements: { a: { x: 10, y: 10, width: 100, height: 80 } },
      }),
      previous: before.resolved,
    });
    expect(proposal.placementOrigins).toEqual({
      a: 'source',
      b: 'generated',
      c: 'generated',
    });
    session.dispose();
  });

  it('promotes only the dragged item from generated to Source Intent on accept', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 600, height: 300 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: SMALL,
        },
        {
          id: 'b',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: SMALL,
        },
        {
          id: 'c',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: SMALL,
        },
      ],
      autoLayout: true,
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    const initial = session.getState();
    expect(initial.resolved.placements.a).toBeDefined();
    expect(initial.resolved.placements.c).toBeDefined();

    mechanics.start('b');
    mechanics.move('b', { x: 40, y: 20 });
    mechanics.drop('b', { x: 40, y: 20 });

    expect(session.getState().lastDrop?.accepted).toBe(true);
    const after = session.getState();
    // Fake elements do not update getBoundingClientRect after apply, so drag
    // baseline is the measurement box (0,0) + translation — not the prior
    // Auto-Layout resolved coordinate. Provenance is what this sprint locks.
    expect(after.resolved.placements.b).toEqual({
      x: 40,
      y: 20,
      width: 80,
      height: 40,
    });

    // Durable Source Intent is only B — siblings must remain automatic/generated.
    const proposal = createAutoLayoutProposal({
      intent: createLayoutIntent({
        space: after.resolved.space,
        items: [
          { id: 'a', constraints: SMALL },
          { id: 'b', constraints: SMALL },
          { id: 'c', constraints: SMALL },
        ],
        desiredPlacements: {
          b: after.resolved.placements.b!,
        },
      }),
      previous: after.resolved,
    });
    expect(proposal.placementOrigins).toEqual({
      a: 'generated',
      b: 'source',
      c: 'generated',
    });
    expect(proposal.placementOrigins.a).not.toBe('source');
    expect(proposal.placementOrigins.c).not.toBe('source');
    session.dispose();
  });

  it('does not promote provenance on cancel', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 400, height: 200 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: SMALL,
        },
        {
          id: 'b',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: SMALL,
        },
      ],
      autoLayout: true,
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    const before = session.getState().resolved;
    mechanics.start('b');
    mechanics.move('b', { x: 24, y: 12 });
    mechanics.cancel('b');
    expect(session.getState().resolved.placements).toEqual(before.placements);

    const proposal = createAutoLayoutProposal({
      intent: createLayoutIntent({
        space: before.space,
        items: [
          { id: 'a', constraints: SMALL },
          { id: 'b', constraints: SMALL },
        ],
      }),
      previous: before,
    });
    expect(proposal.placementOrigins).toEqual({ a: 'generated', b: 'generated' });
    session.dispose();
  });

  it('does not promote provenance on reject', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const a = fakeElement({ left: 10, top: 10, width: 80, height: 80 });
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 50, height: 50 }),
      items: [
        {
          id: 'a',
          element: a,
          constraints: { minWidth: 200, minHeight: 200 },
        },
      ],
      autoLayout: true,
      desiredPlacements: { a: { x: 10, y: 10, width: 80, height: 80 } },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    const before = session.getState().resolved;
    mechanics.start('a');
    mechanics.drop('a', { x: 5, y: 5 });
    expect(session.getState().lastDrop?.accepted).toBe(false);
    expect(session.getState().resolved).toBe(before);
    session.dispose();
  });

  it('keeps an existing Source Intent item as source after accepted drag', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 400, height: 200 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: SMALL,
        },
        {
          id: 'b',
          element: fakeElement({ left: 0, top: 0, width: 60, height: 40 }),
          constraints: { minWidth: 20, minHeight: 10, preferredWidth: 60, preferredHeight: 40 },
        },
      ],
      autoLayout: true,
      desiredPlacements: {
        a: { x: 0, y: 0, width: 80, height: 40 },
      },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    mechanics.start('a');
    mechanics.drop('a', { x: 16, y: 8 });
    expect(session.getState().lastDrop?.accepted).toBe(true);
    expect(session.getState().resolved.placements.a).toEqual({
      x: 16,
      y: 8,
      width: 80,
      height: 40,
    });

    const after = session.getState();
    const proposal = createAutoLayoutProposal({
      intent: createLayoutIntent({
        space: after.resolved.space,
        items: [
          { id: 'a', constraints: SMALL },
          {
            id: 'b',
            constraints: { minWidth: 20, minHeight: 10, preferredWidth: 60, preferredHeight: 40 },
          },
        ],
        desiredPlacements: { a: { x: 16, y: 8, width: 80, height: 40 } },
      }),
      previous: after.resolved,
    });
    expect(proposal.placementOrigins.a).toBe('source');
    expect(proposal.placementOrigins.b).toBe('generated');
    session.dispose();
  });

  it('retains dragged Source Intent across passive resize when feasible', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const containerBox: FakeBox = { left: 0, top: 0, width: 600, height: 300 };
    const session = createLayoutSession({
      container: fakeElement(containerBox),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: SMALL,
        },
        {
          id: 'b',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: SMALL,
        },
      ],
      autoLayout: true,
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    mechanics.start('b');
    mechanics.drop('b', { x: 30, y: 10 });
    const dragged = session.getState().resolved.placements.b;
    expect(dragged).toBeDefined();

    containerBox.width = 580;
    lastFakeObserver().deliver();
    expect(session.getState().resolved.placements.b).toEqual(dragged);
    session.dispose();
  });

  it('allows a later session to drop Source Intent so the item becomes automatic again', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const items = [
      {
        id: 'a',
        element: fakeElement({ left: 0, top: 0, width: 100, height: 80 }),
        constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 },
      },
      {
        id: 'b',
        element: fakeElement({ left: 0, top: 0, width: 100, height: 80 }),
        constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 },
      },
    ] as const;
    const first = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 500, height: 300 }),
      items: [...items],
      autoLayout: true,
      desiredPlacements: { a: { x: 20, y: 20, width: 100, height: 80 } },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    const previous = first.getState().resolved;
    first.dispose();

    resetFakeResizeObservers();
    const second = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 500, height: 300 }),
      items: [...items],
      autoLayout: true,
      previous,
      mechanics: createFakeDragMechanics().adapter,
      ResizeObserver: FakeResizeObserver,
    });
    const proposal = createAutoLayoutProposal({
      intent: createLayoutIntent({
        space: { width: 500, height: 300 },
        items: [
          { id: 'a', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
          { id: 'b', constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 } },
        ],
      }),
      previous,
    });
    expect(proposal.placementOrigins.a).toBe('generated');
    expect(second.getState().resolved.placements.a).toEqual(
      proposal.effectiveIntent.desiredPlacements?.a,
    );
    second.dispose();
  });

  it('keeps committed solver VALID during drag even when desired placement overlaps a sibling', () => {
    // Contract: visual / desired overlap during pointer drag is a transient preview.
    // Session `solver` remains the last committed evaluation; VALID ≠ “no preview overlap”.
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const a = fakeElement({ left: 0, top: 0, width: 100, height: 80 });
    const b = fakeElement({ left: 120, top: 0, width: 100, height: 80 });
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 600, height: 300 }),
      items: [
        {
          id: 'a',
          element: a,
          constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 },
        },
        {
          id: 'b',
          element: b,
          constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 },
        },
      ],
      autoLayout: true,
      desiredPlacements: {
        a: { x: 0, y: 0, width: 100, height: 80 },
        b: { x: 120, y: 0, width: 100, height: 80 },
      },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });

    const before = session.getState();
    expect(before.solver.evaluation.state).toBe('VALID');
    expect(before.phase).toBe('idle');

    // Drag B onto A's footprint (desired overlaps committed A).
    mechanics.start('b');
    mechanics.move('b', { x: -100, y: 0 });

    const mid = session.getState();
    expect(mid.phase).toBe('dragging');
    expect(mid.solver.evaluation.state).toBe(before.solver.evaluation.state);
    expect(mid.solver.evaluation.score.total).toBe(before.solver.evaluation.score.total);
    expect(mid.proposal?.desiredPlacement).toEqual({
      x: 20,
      y: 0,
      width: 100,
      height: 80,
    });
    // Active item left/top are not rewritten during preview (pointer / provider owns motion).
    expect(b.style.left).toBe('120px');
    // Desired proposal overlaps sibling A's committed rect — intentional transient geometry.
    const desired = mid.proposal!.desiredPlacement;
    const sibling = mid.resolved.placements.a!;
    expect(desired.x).toBeLessThan(sibling.x + sibling.width);
    expect(desired.x + desired.width).toBeGreaterThan(sibling.x);

    mechanics.cancel('b');
    expect(session.getState().phase).toBe('idle');
    expect(session.getState().resolved.placements).toEqual(before.resolved.placements);
    session.dispose();
  });

  it('recomposes generated siblings without overlap after an accepted drag into free space', () => {
    // Narrow contract: free-space / generated reflow. Does not claim that every
    // accepted drop (e.g. source→source onto another source) is overlap-free —
    // Auto-Layout does not relocate explicit Source Intent.
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 600, height: 300 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 100, height: 80 }),
          constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 },
        },
        {
          id: 'b',
          element: fakeElement({ left: 0, top: 0, width: 100, height: 80 }),
          constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 },
        },
        {
          id: 'c',
          element: fakeElement({ left: 0, top: 0, width: 100, height: 80 }),
          constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 },
        },
      ],
      autoLayout: true,
      desiredPlacements: {
        a: { x: 0, y: 0, width: 100, height: 80 },
      },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });

    const before = session.getState();
    expect(before.autoLayout?.proposalUnplacedItemIds).toEqual([]);
    expect(before.resolved.placements.b).toBeDefined();

    // Translation is relative to the fake measurement baseline (0,0), not Auto-Layout x/y.
    mechanics.start('b');
    mechanics.move('b', { x: 400, y: 200 });
    mechanics.drop('b', { x: 400, y: 200 });

    const after = session.getState();
    expect(after.lastDrop?.accepted).toBe(true);
    expect(after.phase).toBe('idle');
    expect(after.autoLayout?.proposalUnplacedItemIds).toEqual([]);
    const placements = Object.values(after.resolved.placements);
    for (let i = 0; i < placements.length; i += 1) {
      for (let j = i + 1; j < placements.length; j += 1) {
        const left = placements[i]!;
        const right = placements[j]!;
        const overlaps = !(
          left.x + left.width <= right.x ||
          right.x + right.width <= left.x ||
          left.y + left.height <= right.y ||
          right.y + right.height <= left.y
        );
        expect(overlaps).toBe(false);
      }
    }
    session.dispose();
  });

  it('does not emit a runaway resize loop with Auto-Layout enabled', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const changes: LayoutSessionState[] = [];
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 400, height: 200 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: SMALL,
        },
      ],
      autoLayout: true,
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
      onChange: (state) => {
        changes.push(state);
      },
    });
    const afterMount = changes.length;
    lastFakeObserver().deliver();
    lastFakeObserver().deliver();
    expect(changes.length).toBe(afterMount);
    session.dispose();
  });

  /**
   * DND-BUG-DOM-RESIZE-1: idle resize that changes resolved geometry reconnects
   * the drag interaction. Real DOM remasures after apply see new item rects;
   * the reconnect path must not read state from the disposed prior interaction.
   */
  it('survives VALID → DEGRADED idle resize without disposed-interaction error', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const containerBox: FakeBox = { left: 0, top: 0, width: 636, height: 360 };
    const detailsConstraints = {
      preferredWidth: 200,
      preferredHeight: 300,
      minWidth: 40,
      minHeight: 40,
      minUsefulWidth: 180,
      minUsefulHeight: 280,
    } as const;
    const companionConstraints = {
      preferredWidth: 180,
      preferredHeight: 120,
      minWidth: 40,
      minHeight: 40,
      minUsefulWidth: 160,
      minUsefulHeight: 100,
    } as const;

    // Core-only proof for the same geometry (no DomAdapterError path).
    const coreTall = solveLayout({
      intent: createAutoLayoutProposal({
        intent: createLayoutIntent({
          space: { width: 636, height: 360 },
          items: [
            { id: 'details', constraints: detailsConstraints },
            { id: 'companion', constraints: companionConstraints },
          ],
        }),
      }).effectiveIntent,
    });
    expect(coreTall.evaluation.state).toBe('VALID');
    const coreShort = solveLayout({
      intent: createAutoLayoutProposal({
        intent: createLayoutIntent({
          space: { width: 636, height: 250 },
          items: [
            { id: 'details', constraints: detailsConstraints },
            { id: 'companion', constraints: companionConstraints },
          ],
        }),
      }).effectiveIntent,
    });
    expect(coreShort.evaluation.state).toBe('DEGRADED');

    const session = createLayoutSession({
      container: styleReflectingElement(containerBox),
      items: [
        {
          id: 'details',
          element: styleReflectingElement({ left: 0, top: 0, width: 200, height: 300 }),
          constraints: detailsConstraints,
        },
        {
          id: 'companion',
          element: styleReflectingElement({ left: 0, top: 0, width: 180, height: 120 }),
          constraints: companionConstraints,
        },
      ],
      autoLayout: true,
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });

    expect(session.getState().solver.evaluation.state).toBe('VALID');
    expect(mechanics.isConnected()).toBe(true);

    containerBox.height = 250;
    expect(() => {
      lastFakeObserver().deliver();
    }).not.toThrow();

    const degraded = session.getState();
    expect(degraded.solver.evaluation.state).toBe('DEGRADED');
    expect(degraded.resolved.space.height).toBe(250);
    expect(mechanics.isConnected()).toBe(true);

    // Expand again → VALID (lifecycle still healthy after DEGRADED reconnect).
    containerBox.height = 360;
    expect(() => {
      lastFakeObserver().deliver();
    }).not.toThrow();
    expect(session.getState().solver.evaluation.state).toBe('VALID');
    expect(session.getState().resolved.space.height).toBe(360);

    // Drag/cancel still works after the DEGRADED resize cycle.
    mechanics.start('companion');
    mechanics.move('companion', { x: 8, y: 4 });
    expect(session.getState().phase).toBe('dragging');
    mechanics.cancel('companion');
    expect(session.getState().phase).toBe('idle');

    session.dispose();
  });
});

describe('createLayoutSession — Auto-Layout input validation', () => {
  it('rejects non-boolean autoLayout', () => {
    resetFakeResizeObservers();
    expect(() =>
      createLayoutSession({
        container: fakeElement({ left: 0, top: 0, width: 100, height: 100 }),
        items: [
          {
            id: 'a',
            element: fakeElement({ left: 0, top: 0, width: 40, height: 20 }),
            constraints: { minWidth: 10, minHeight: 10 },
          },
        ],
        // @ts-expect-error intentional invalid input
        autoLayout: 'yes',
        mechanics: createFakeDragMechanics().adapter,
        ResizeObserver: FakeResizeObserver,
      }),
    ).toThrow(/autoLayout/);
  });
});
