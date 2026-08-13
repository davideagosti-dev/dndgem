import { describe, expect, it } from 'vitest';
import {
  createLayoutIntent,
  createResolvedLayout,
  evaluateLayout,
  solveLayout,
} from '@dndgem/core';
import { measureLayout } from '../src/index.js';
import { fakeElement } from './helpers.js';

describe('DOM → Core solver boundary', () => {
  it('feeds a measurement snapshot into evaluateLayout and solveLayout', () => {
    const container = fakeElement({ left: 20, top: 10, width: 400, height: 200 });
    const item = fakeElement({ left: 20, top: 10, width: 120, height: 80 });
    const snapshot = measureLayout({ container, items: { panel: item } });
    const measured = snapshot.measurements.panel;
    expect(measured).toBeDefined();

    const intent = createLayoutIntent({
      space: snapshot.space,
      items: [
        {
          id: 'panel',
          measuredSize: { width: measured!.width, height: measured!.height },
          constraints: {
            minWidth: 80,
            minHeight: 40,
            preferredWidth: 120,
            preferredHeight: 80,
          },
        },
      ],
      desiredPlacements: snapshot.measurements,
    });

    const evaluation = evaluateLayout(
      intent,
      createResolvedLayout({
        space: snapshot.space,
        placements: snapshot.measurements,
      }),
    );
    expect(evaluation.state).toBe('VALID');

    const solved = solveLayout({ intent });
    expect(solved.resolved.space).toEqual(snapshot.space);
    expect(solved.resolved.placements.panel?.width).toBe(120);
    expect(solved.resolved.placements.panel?.height).toBe(80);
    expect(solved.evaluation.state).toBe('VALID');
  });

  it('omits unmapped intent items from measuredSize rather than inventing geometry', () => {
    const container = fakeElement({ left: 0, top: 0, width: 300, height: 200 });
    const snapshot = measureLayout({
      container,
      items: { visible: fakeElement({ left: 0, top: 0, width: 50, height: 50 }) },
    });

    const intent = createLayoutIntent({
      space: snapshot.space,
      items: [
        {
          id: 'visible',
          measuredSize: {
            width: snapshot.measurements.visible!.width,
            height: snapshot.measurements.visible!.height,
          },
        },
        { id: 'unmapped' },
      ],
    });

    expect(intent.items[0]?.measuredSize).toEqual({ width: 50, height: 50 });
    expect(intent.items[1]?.measuredSize).toBeUndefined();

    const solved = solveLayout({ intent });
    expect(solved.resolved.placements.visible).toBeDefined();
    expect(solved.resolved.placements.unmapped).toBeDefined();
  });

  it('does not invent measuredSize for disconnected mapped items', () => {
    const container = fakeElement({ left: 0, top: 0, width: 200, height: 100 });
    const snapshot = measureLayout({
      container,
      items: {
        live: fakeElement({ left: 0, top: 0, width: 40, height: 20 }),
        gone: fakeElement({ left: 0, top: 0, width: 99, height: 99, connected: false }),
      },
    });

    expect(snapshot.measurements.gone).toBeUndefined();
    expect(snapshot.unavailable).toEqual([{ id: 'gone', reason: 'disconnected' }]);

    const intent = createLayoutIntent({
      space: snapshot.space,
      items: [
        {
          id: 'live',
          measuredSize: {
            width: snapshot.measurements.live!.width,
            height: snapshot.measurements.live!.height,
          },
        },
        { id: 'gone' },
      ],
    });

    expect(intent.items.find((item) => item.id === 'gone')?.measuredSize).toBeUndefined();
    expect(solveLayout({ intent }).resolved.placements.gone).toBeDefined();
  });
});
