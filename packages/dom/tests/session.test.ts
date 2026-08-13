import { describe, expect, it } from 'vitest';
import { createResolvedLayout, solveLayout } from '@dndgem/core';
import {
  DomAdapterError,
  createLayoutSession,
  type DragDropResult,
  type LayoutSessionState,
} from '../src/index.js';
import {
  FakeResizeObserver,
  createFakeDragMechanics,
  fakeElement,
  lastFakeObserver,
  resetFakeResizeObservers,
  type FakeBox,
} from './helpers.js';

describe('createLayoutSession', () => {
  it('measures, solves, and applies the initial resolved layout by ItemId', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const chart = fakeElement({ left: 8, top: 8, width: 160, height: 80 });
    const table = fakeElement({ left: 180, top: 8, width: 200, height: 100 });
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 480, height: 240 }),
      items: [
        {
          id: 'chart',
          element: chart,
          constraints: {
            minWidth: 80,
            minHeight: 40,
            minUsefulWidth: 120,
            preferredWidth: 160,
            preferredHeight: 80,
          },
        },
        {
          id: 'table',
          element: table,
          constraints: {
            minWidth: 120,
            minHeight: 60,
            minUsefulWidth: 180,
            preferredWidth: 200,
            preferredHeight: 100,
          },
        },
      ],
      desiredPlacements: {
        chart: { x: 8, y: 8, width: 160, height: 80 },
        table: { x: 180, y: 8, width: 200, height: 100 },
      },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });

    const state = session.getState();
    expect(state.phase).toBe('idle');
    expect(state.resolved.placements.chart).toEqual({ x: 8, y: 8, width: 160, height: 80 });
    expect(state.resolved.placements.table).toEqual({ x: 180, y: 8, width: 200, height: 100 });
    expect(chart.style.left).toBe('8px');
    expect(chart.style.width).toBe('160px');
    expect(table.style.left).toBe('180px');
    expect(table.style.width).toBe('200px');
    expect(table.style.left).not.toBe(chart.style.left);
    session.dispose();
  });

  it('matches Core solveLayout for the same normalized initial inputs', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 400, height: 200 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: { minWidth: 40, minHeight: 20, preferredWidth: 80, preferredHeight: 40 },
        },
      ],
      desiredPlacements: { a: { x: 0, y: 0, width: 80, height: 40 } },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    const core = solveLayout({ intent: session.getState().intent });
    expect(session.getState().resolved.placements).toEqual(core.resolved.placements);
    expect(session.getState().solver.winnerId).toBe(core.winnerId);
    session.dispose();
  });

  it('applies solver preview to siblings during drag and commits an accepted drop', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const a = fakeElement({ left: 0, top: 0, width: 80, height: 40 });
    const b = fakeElement({ left: 120, top: 0, width: 60, height: 40 });
    const drops: DragDropResult[] = [];
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 400, height: 200 }),
      items: [
        {
          id: 'a',
          element: a,
          constraints: { minWidth: 20, minHeight: 10, preferredWidth: 80, preferredHeight: 40 },
        },
        {
          id: 'b',
          element: b,
          constraints: { minWidth: 20, minHeight: 10, preferredWidth: 60, preferredHeight: 40 },
        },
      ],
      desiredPlacements: {
        a: { x: 0, y: 0, width: 80, height: 40 },
        b: { x: 120, y: 0, width: 60, height: 40 },
      },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
      onDrop: (event) => {
        drops.push(event.result);
      },
    });

    mechanics.start('a');
    mechanics.move('a', { x: 16, y: 8 });
    expect(session.getState().phase).toBe('dragging');
    expect(session.getState().proposal?.itemId).toBe('a');
    expect(session.getState().proposal?.desiredPlacement).toEqual({
      x: 16,
      y: 8,
      width: 80,
      height: 40,
    });
    expect(b.style.left).toBe('120px');
    expect(a.style.left).toBe('0px');

    mechanics.drop('a', { x: 16, y: 8 });
    expect(drops[0]?.accepted).toBe(true);
    expect(session.getState().phase).toBe('idle');
    expect(session.getState().resolved.placements.a).toEqual({
      x: 16,
      y: 8,
      width: 80,
      height: 40,
    });
    expect(session.getState().resolved.placements.b).toEqual({
      x: 120,
      y: 0,
      width: 60,
      height: 40,
    });
    expect(a.style.left).toBe('16px');
    expect(a.style.top).toBe('8px');
    expect(b.style.left).toBe('120px');
    session.dispose();
  });

  it('restores the committed layout on cancel', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const a = fakeElement({ left: 0, top: 0, width: 80, height: 40 });
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 400, height: 200 }),
      items: [
        {
          id: 'a',
          element: a,
          constraints: { minWidth: 20, minHeight: 10, preferredWidth: 80, preferredHeight: 40 },
        },
      ],
      desiredPlacements: { a: { x: 0, y: 0, width: 80, height: 40 } },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    mechanics.start('a');
    mechanics.move('a', { x: 24, y: 12 });
    mechanics.cancel('a');
    expect(session.getState().phase).toBe('idle');
    expect(session.getState().proposal).toBeUndefined();
    expect(session.getState().resolved.placements.a).toEqual({ x: 0, y: 0, width: 80, height: 40 });
    expect(a.style.left).toBe('0px');
    expect(a.style.top).toBe('0px');
    session.dispose();
  });

  it('rejects an unsatisfiable drop and preserves the previous layout', () => {
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
      desiredPlacements: { a: { x: 10, y: 10, width: 80, height: 80 } },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    const before = session.getState().resolved;
    mechanics.start('a');
    mechanics.drop('a', { x: 5, y: 5 });
    expect(session.getState().lastDrop?.accepted).toBe(false);
    expect(session.getState().lastDrop?.solver.evaluation.state).toBe('INVALID');
    expect(session.getState().resolved).toBe(before);
    expect(a.style.left).toBe(`${before.placements.a?.x ?? 0}px`);
    session.dispose();
  });

  it('re-solves on idle container resize without a second observer family', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const containerBox: FakeBox = { left: 0, top: 0, width: 400, height: 200 };
    const a = fakeElement({ left: 0, top: 0, width: 80, height: 40 });
    const session = createLayoutSession({
      container: fakeElement(containerBox),
      items: [
        {
          id: 'a',
          element: a,
          constraints: { minWidth: 20, minHeight: 10, preferredWidth: 80, preferredHeight: 40 },
        },
      ],
      desiredPlacements: { a: { x: 0, y: 0, width: 80, height: 40 } },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    expect(FakeResizeObserver.instances).toHaveLength(1);
    const before = session.getState().resolved.placements.a;
    containerBox.width = 90;
    lastFakeObserver().deliver();
    expect(session.getState().resolved.space.width).toBe(90);
    expect(session.getState().resolved.placements.a).toEqual(before);
    session.dispose();
  });

  it('does not emit a runaway loop when applied layout matches the next snapshot', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const changes: LayoutSessionState[] = [];
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 400, height: 200 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: { minWidth: 20, minHeight: 10, preferredWidth: 80, preferredHeight: 40 },
        },
      ],
      desiredPlacements: { a: { x: 0, y: 0, width: 80, height: 40 } },
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

  it('dispose is idempotent and getState after dispose throws', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 200, height: 100 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 40, height: 20 }),
          constraints: { minWidth: 10, minHeight: 10 },
        },
      ],
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    session.dispose();
    session.dispose();
    expect(() => session.getState()).toThrow(DomAdapterError);
    expect(mechanics.isConnected()).toBe(false);
  });

  it('does not emit callbacks after dispose', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    let changes = 0;
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 200, height: 100 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 40, height: 20 }),
          constraints: { minWidth: 10, minHeight: 10 },
        },
      ],
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
      onChange: () => {
        changes += 1;
      },
    });
    const before = changes;
    session.dispose();
    lastFakeObserver().deliver();
    expect(changes).toBe(before);
  });

  it('rejects duplicate item ids', () => {
    resetFakeResizeObservers();
    const element = fakeElement({ left: 0, top: 0, width: 10, height: 10 });
    expect(() =>
      createLayoutSession({
        container: fakeElement({ left: 0, top: 0, width: 100, height: 100 }),
        items: [
          { id: 'a', element },
          { id: 'a', element },
        ],
        mechanics: createFakeDragMechanics().adapter,
        ResizeObserver: FakeResizeObserver,
      }),
    ).toThrow(DomAdapterError);
  });

  it('initial solve without previous matches Core solveLayout for the same intent', () => {
    resetFakeResizeObservers();
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 400, height: 200 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: { minWidth: 20, minHeight: 10, preferredWidth: 80, preferredHeight: 40 },
        },
      ],
      desiredPlacements: { a: { x: 24, y: 8, width: 80, height: 40 } },
      mechanics: createFakeDragMechanics().adapter,
      ResizeObserver: FakeResizeObserver,
    });
    const state = session.getState();
    const independent = solveLayout({ intent: state.intent });
    expect(independent.resolved.placements).toEqual(state.resolved.placements);
    expect(independent.evaluation.state).toBe(state.solver.evaluation.state);
    session.dispose();
  });

  it('honors explicit desired placements when previous is omitted', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const first = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 400, height: 200 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: { minWidth: 20, minHeight: 10, preferredWidth: 80, preferredHeight: 40 },
        },
      ],
      desiredPlacements: { a: { x: 0, y: 0, width: 80, height: 40 } },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    const committed = first.getState().resolved;
    expect(committed.placements.a).toEqual({ x: 0, y: 0, width: 80, height: 40 });
    first.dispose();

    const next = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 400, height: 200 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: { minWidth: 20, minHeight: 10, preferredWidth: 80, preferredHeight: 40 },
        },
      ],
      desiredPlacements: { a: { x: 40, y: 8, width: 80, height: 40 } },
      mechanics: createFakeDragMechanics().adapter,
      ResizeObserver: FakeResizeObserver,
    });
    expect(next.getState().resolved.placements.a).toEqual({ x: 40, y: 8, width: 80, height: 40 });
    next.dispose();
  });

  it('uses previous as a stability reference when supplied for continuation', () => {
    resetFakeResizeObservers();
    const previous = createResolvedLayout({
      space: { width: 400, height: 200 },
      placements: { a: { x: 0, y: 0, width: 80, height: 40 } },
    });
    const continued = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 400, height: 200 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: { minWidth: 20, minHeight: 10, preferredWidth: 80, preferredHeight: 40 },
        },
      ],
      desiredPlacements: { a: { x: 40, y: 8, width: 80, height: 40 } },
      previous,
      mechanics: createFakeDragMechanics().adapter,
      ResizeObserver: FakeResizeObserver,
    });
    expect(continued.getState().resolved.placements.a).toEqual({
      x: 0,
      y: 0,
      width: 80,
      height: 40,
    });
    continued.dispose();
  });
});
