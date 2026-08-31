/**
 * DND-BUG-DRAG-INTENT-1 — accepted drag / Source Intent spatial fidelity.
 *
 * Uses styleReflectingElement so post-apply geometry is visible to measurement,
 * matching real DOM behaviour (unlike default fakeElement seed boxes).
 */
import { describe, expect, it } from 'vitest';
import { createAutoLayoutProposal, createLayoutIntent, solveLayout, type Rect } from '@dndgem/core';
import { createLayoutSession, type DragProposal } from '../src/index.js';
import {
  FakeResizeObserver,
  createFakeDragMechanics,
  resetFakeResizeObservers,
  styleReflectingElement,
  type FakeBox,
} from './helpers.js';

const CARD = {
  minWidth: 40,
  minHeight: 40,
  preferredWidth: 100,
  preferredHeight: 80,
} as const;

const SPACE: FakeBox = { left: 0, top: 0, width: 600, height: 400 };

function near(actual: Rect | undefined, expected: Rect, tol = 0.5): boolean {
  if (actual === undefined) {
    return false;
  }
  return (
    Math.abs(actual.x - expected.x) <= tol &&
    Math.abs(actual.y - expected.y) <= tol &&
    Math.abs(actual.width - expected.width) <= tol &&
    Math.abs(actual.height - expected.height) <= tol
  );
}

describe('DND-BUG-DRAG-INTENT-1 — Source Intent fidelity', () => {
  it('preserves sequential feasible A→B→C accepted drops and prior Source Intent', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();

    const session = createLayoutSession({
      container: styleReflectingElement(SPACE),
      items: [
        {
          id: 'a',
          element: styleReflectingElement({ left: 0, top: 0, width: 100, height: 80 }),
          constraints: CARD,
        },
        {
          id: 'b',
          element: styleReflectingElement({ left: 0, top: 0, width: 100, height: 80 }),
          constraints: CARD,
        },
        {
          id: 'c',
          element: styleReflectingElement({ left: 0, top: 0, width: 100, height: 80 }),
          constraints: CARD,
        },
        {
          id: 'd',
          element: styleReflectingElement({ left: 0, top: 0, width: 100, height: 80 }),
          constraints: CARD,
        },
      ],
      autoLayout: true,
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });

    const initial = session.getState();
    expect(initial.solver.evaluation.state).toBe('VALID');

    const A1 = { x: 20, y: 220, width: 100, height: 80 };
    const B1 = { x: 140, y: 220, width: 100, height: 80 };
    const C1 = { x: 260, y: 220, width: 100, height: 80 };

    const dragTo = (itemId: string, target: Rect): void => {
      const start = session.getState().resolved.placements[itemId]!;
      const translation = { x: target.x - start.x, y: target.y - start.y };
      mechanics.start(itemId);
      mechanics.move(itemId, translation);
      mechanics.drop(itemId, translation);
      expect(session.getState().lastDrop?.accepted).toBe(true);
      expect(near(session.getState().lastDrop?.intent.desiredPlacements?.[itemId], target)).toBe(
        true,
      );
      expect(near(session.getState().resolved.placements[itemId], target)).toBe(true);
    };

    dragTo('a', A1);
    expect(near(session.getState().resolved.placements.a, A1)).toBe(true);

    dragTo('b', B1);
    expect(near(session.getState().resolved.placements.a, A1)).toBe(true);
    expect(near(session.getState().resolved.placements.b, B1)).toBe(true);

    dragTo('c', C1);
    const final = session.getState();
    expect(near(final.resolved.placements.a, A1)).toBe(true);
    expect(near(final.resolved.placements.b, B1)).toBe(true);
    expect(near(final.resolved.placements.c, C1)).toBe(true);
    expect(final.solver.evaluation.state).toBe('VALID');

    const placements = Object.values(final.resolved.placements);
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

  it('keeps Metric near a feasible drop below Chart (playground-scale constraints)', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();

    const CHART = {
      minWidth: 120,
      minHeight: 64,
      minUsefulWidth: 180,
      minUsefulHeight: 72,
      preferredWidth: 240,
      preferredHeight: 96,
    } as const;
    const TABLE = {
      minWidth: 160,
      minHeight: 72,
      minUsefulWidth: 220,
      minUsefulHeight: 96,
      preferredWidth: 280,
      preferredHeight: 140,
    } as const;
    const DETAILS = {
      minWidth: 100,
      minHeight: 80,
      minUsefulWidth: 140,
      minUsefulHeight: 120,
      preferredWidth: 180,
      preferredHeight: 160,
    } as const;
    const METRIC = {
      minWidth: 72,
      minHeight: 64,
      minUsefulWidth: 88,
      minUsefulHeight: 72,
      preferredWidth: 96,
      preferredHeight: 80,
    } as const;

    const session = createLayoutSession({
      container: styleReflectingElement({ left: 0, top: 0, width: 900, height: 560 }),
      items: [
        {
          id: 'chart',
          element: styleReflectingElement({ left: 0, top: 0, width: 240, height: 96 }),
          constraints: CHART,
        },
        {
          id: 'table',
          element: styleReflectingElement({ left: 0, top: 0, width: 280, height: 140 }),
          constraints: TABLE,
        },
        {
          id: 'details',
          element: styleReflectingElement({ left: 0, top: 0, width: 180, height: 160 }),
          constraints: DETAILS,
        },
        {
          id: 'metric',
          element: styleReflectingElement({ left: 0, top: 0, width: 96, height: 80 }),
          constraints: METRIC,
        },
      ],
      autoLayout: true,
      desiredPlacements: {
        chart: { x: 12, y: 12, width: 240, height: 96 },
      },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });

    const initial = session.getState();
    expect(initial.solver.evaluation.state).toBe('VALID');
    const chart = initial.resolved.placements.chart!;
    const metricStart = initial.resolved.placements.metric!;
    const metricTarget = {
      x: chart.x,
      y: chart.y + chart.height + 16,
      width: metricStart.width,
      height: metricStart.height,
    };
    const translation = {
      x: metricTarget.x - metricStart.x,
      y: metricTarget.y - metricStart.y,
    };

    mechanics.start('metric');
    mechanics.drop('metric', translation);

    const after = session.getState();
    expect(after.lastDrop?.accepted).toBe(true);
    expect(near(after.resolved.placements.metric, metricTarget)).toBe(true);

    const tableStart = after.resolved.placements.table!;
    mechanics.start('table');
    mechanics.drop('table', { x: 8, y: 4 });
    expect(near(session.getState().resolved.placements.metric, metricTarget)).toBe(true);
    expect(
      near(session.getState().resolved.placements.table, {
        x: tableStart.x + 8,
        y: tableStart.y + 4,
        width: tableStart.width,
        height: tableStart.height,
      }),
    ).toBe(true);

    session.dispose();
  });

  it('after sibling reflow from accepted drop, next drag baseline matches applied visual geometry', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const bEl = styleReflectingElement({ left: 0, top: 0, width: 100, height: 80 });
    const proposals: DragProposal[] = [];

    const session = createLayoutSession({
      container: styleReflectingElement({ left: 0, top: 0, width: 400, height: 300 }),
      items: [
        {
          id: 'a',
          element: styleReflectingElement({ left: 0, top: 0, width: 100, height: 80 }),
          constraints: CARD,
        },
        { id: 'b', element: bEl, constraints: CARD },
        {
          id: 'c',
          element: styleReflectingElement({ left: 0, top: 0, width: 100, height: 80 }),
          constraints: CARD,
        },
      ],
      autoLayout: true,
      desiredPlacements: {
        a: { x: 0, y: 0, width: 100, height: 80 },
      },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
      onChange: (state) => {
        if (state.proposal !== undefined) {
          proposals.push(state.proposal);
        }
      },
    });

    const before = session.getState();
    const bBefore = before.resolved.placements.b!;
    const aStart = before.resolved.placements.a!;
    // Drop A onto generated B → A becomes source occupancy; B reflows.
    mechanics.start('a');
    mechanics.drop('a', { x: bBefore.x - aStart.x, y: bBefore.y - aStart.y });

    const mid = session.getState();
    expect(mid.lastDrop?.accepted).toBe(true);
    const aAfterReflow = mid.resolved.placements.a!;
    const bCommitted = mid.resolved.placements.b!;
    expect(bCommitted.x !== bBefore.x || bCommitted.y !== bBefore.y).toBe(true);
    expect(Number.parseFloat(bEl.style.left)).toBe(bCommitted.x);
    expect(Number.parseFloat(bEl.style.top)).toBe(bCommitted.y);

    // Pointer translation is relative to the visual element (dnd-kit).
    const visualTarget = {
      x: bCommitted.x + 10,
      y: bCommitted.y + 10,
      width: bCommitted.width,
      height: bCommitted.height,
    };
    mechanics.start('b');
    mechanics.move('b', { x: 10, y: 10 });
    const proposal = proposals.at(-1);
    mechanics.drop('b', { x: 10, y: 10 });

    expect(near(proposal?.desiredPlacement, visualTarget)).toBe(true);
    expect(near(session.getState().lastDrop?.intent.desiredPlacements?.b, visualTarget)).toBe(true);
    expect(near(session.getState().resolved.placements.b, visualTarget)).toBe(true);
    expect(near(session.getState().resolved.placements.a, aAfterReflow)).toBe(true);
    expect(session.getState().solver.evaluation.state).toBe('VALID');

    session.dispose();
  });

  it('cancel after preview restore still yields faithful subsequent drag baselines', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const aEl = styleReflectingElement({ left: 0, top: 0, width: 100, height: 80 });

    const session = createLayoutSession({
      container: styleReflectingElement({ left: 0, top: 0, width: 400, height: 300 }),
      items: [
        { id: 'a', element: aEl, constraints: CARD },
        {
          id: 'b',
          element: styleReflectingElement({ left: 0, top: 0, width: 100, height: 80 }),
          constraints: CARD,
        },
      ],
      autoLayout: true,
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });

    const before = session.getState().resolved.placements.a!;
    mechanics.start('a');
    mechanics.move('a', { x: 40, y: 20 });
    mechanics.cancel('a');
    expect(session.getState().resolved.placements.a).toEqual(before);

    const target = {
      x: before.x + 30,
      y: before.y + 40,
      width: before.width,
      height: before.height,
    };
    mechanics.start('a');
    mechanics.drop('a', { x: 30, y: 40 });
    expect(session.getState().lastDrop?.accepted).toBe(true);
    expect(near(session.getState().resolved.placements.a, target)).toBe(true);
    session.dispose();
  });

  it('feasible Source Intent survives Auto-Layout + solveLayout ranking (Core isolate)', () => {
    const sourceA = { x: 20, y: 220, width: 100, height: 80 };
    const intent = createLayoutIntent({
      space: { width: 600, height: 400 },
      items: [
        { id: 'a', constraints: CARD },
        { id: 'b', constraints: CARD },
        { id: 'c', constraints: CARD },
        { id: 'd', constraints: CARD },
      ],
      desiredPlacements: { a: sourceA },
    });
    const proposal = createAutoLayoutProposal({ intent });
    expect(proposal.placementOrigins.a).toBe('source');
    expect(proposal.effectiveIntent.desiredPlacements?.a).toEqual(sourceA);

    const solver = solveLayout({ intent: proposal.effectiveIntent });
    expect(solver.evaluation.state).toBe('VALID');
    expect(solver.resolved.placements.a).toEqual(sourceA);
  });
});
