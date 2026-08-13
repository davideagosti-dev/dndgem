import { describe, expect, it } from 'vitest';
import { createLayoutIntent, createResolvedLayout } from '@dndgem/core';
import { createDragInteraction, type DragProposal } from '../src/index.js';
import {
  FakeResizeObserver,
  createFakeDragMechanics,
  fakeElement,
  lastFakeObserver,
  resetFakeResizeObservers,
  type FakeBox,
} from './helpers.js';

describe('drag coordinate normalization (ADR-0011)', () => {
  it('uses container-relative geometry when the container is not at the viewport origin', () => {
    resetFakeResizeObservers();
    const containerBox: FakeBox = { left: 240, top: 120, width: 400, height: 300 };
    const itemBox: FakeBox = { left: 280, top: 160, width: 80, height: 40 };
    const mechanics = createFakeDragMechanics();
    const proposals: DragProposal[] = [];
    const intent = createLayoutIntent({
      space: { width: 400, height: 300 },
      items: [
        {
          id: 'tile',
          measuredSize: { width: 80, height: 40 },
          constraints: { minWidth: 10, minHeight: 10 },
        },
      ],
    });

    const interaction = createDragInteraction({
      container: fakeElement(containerBox),
      items: { tile: fakeElement(itemBox) },
      intent,
      previous: createResolvedLayout({
        space: intent.space,
        placements: { tile: { x: 40, y: 40, width: 80, height: 40 } },
      }),
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
      onProposal: (event) => {
        proposals.push(event.proposal);
      },
    });

    mechanics.start('tile');
    mechanics.move('tile', { x: 12, y: 18 });
    expect(proposals[0]?.desiredPlacement).toEqual({ x: 40, y: 40, width: 80, height: 40 });
    expect(proposals.at(-1)?.desiredPlacement).toEqual({ x: 52, y: 58, width: 80, height: 40 });
    interaction.dispose();
  });

  it('preserves fractional translation and baseline geometry', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const proposals: DragProposal[] = [];
    const intent = createLayoutIntent({
      space: { width: 100.5, height: 80.25 },
      items: [{ id: 'frac', measuredSize: { width: 12.75, height: 20.25 } }],
    });
    const interaction = createDragInteraction({
      container: fakeElement({ left: 10.25, top: 5.5, width: 100.5, height: 80.25 }),
      items: {
        frac: fakeElement({ left: 23, top: 18.25, width: 12.75, height: 20.25 }),
      },
      intent,
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
      onProposal: (event) => {
        proposals.push(event.proposal);
      },
    });

    mechanics.start('frac');
    mechanics.move('frac', { x: 0.25, y: 0.125 });
    const placement = proposals.at(-1)?.desiredPlacement;
    expect(placement).toEqual({ x: 13, y: 12.875, width: 12.75, height: 20.25 });
    expect(placement?.width).toBe(12.75);
    expect(placement?.y).toBe(12.875);
    interaction.dispose();
  });

  it('does not confuse equal viewport scroll shifts with layout translation', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const proposals: DragProposal[] = [];
    const containerBox: FakeBox = { left: 100, top: 50, width: 200, height: 100 };
    const itemBox: FakeBox = { left: 130, top: 70, width: 40, height: 20 };
    const intent = createLayoutIntent({
      space: { width: 200, height: 100 },
      items: [{ id: 'a', measuredSize: { width: 40, height: 20 } }],
    });
    const interaction = createDragInteraction({
      container: fakeElement(containerBox),
      items: { a: fakeElement(itemBox) },
      intent,
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
      onProposal: (event) => {
        proposals.push(event.proposal);
      },
    });

    mechanics.start('a');
    expect(proposals[0]?.desiredPlacement).toEqual({ x: 30, y: 20, width: 40, height: 20 });
    containerBox.left -= 80;
    itemBox.left -= 80;
    containerBox.top -= 20;
    itemBox.top -= 20;
    lastFakeObserver().deliver();
    mechanics.move('a', { x: 5, y: 0 });
    expect(proposals.at(-1)?.desiredPlacement).toEqual({ x: 35, y: 20, width: 40, height: 20 });
    interaction.dispose();
  });

  it('uses the latest snapshot space on resize during drag without restamping the drag-start baseline', () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const proposals: DragProposal[] = [];
    const containerBox: FakeBox = { left: 0, top: 0, width: 400, height: 200 };
    const itemBox: FakeBox = { left: 10, top: 10, width: 80, height: 40 };
    const intent = createLayoutIntent({
      space: { width: 400, height: 200 },
      items: [
        {
          id: 'a',
          measuredSize: { width: 80, height: 40 },
          constraints: { minWidth: 10, minHeight: 10, preferredWidth: 80, preferredHeight: 40 },
        },
      ],
    });
    const interaction = createDragInteraction({
      container: fakeElement(containerBox),
      items: { a: fakeElement(itemBox) },
      intent,
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
      onProposal: (event) => {
        proposals.push(event.proposal);
      },
    });

    mechanics.start('a');
    mechanics.move('a', { x: 20, y: 0 });
    expect(proposals.at(-1)?.intent.space).toEqual({ width: 400, height: 200 });
    expect(proposals.at(-1)?.desiredPlacement).toEqual({ x: 30, y: 10, width: 80, height: 40 });

    containerBox.width = 240;
    containerBox.height = 160;
    lastFakeObserver().deliver();

    const afterResize = proposals.at(-1);
    expect(afterResize?.intent.space).toEqual({ width: 240, height: 160 });
    expect(afterResize?.desiredPlacement).toEqual({ x: 30, y: 10, width: 80, height: 40 });

    mechanics.move('a', { x: 24, y: 6 });
    expect(proposals.at(-1)?.desiredPlacement).toEqual({ x: 34, y: 16, width: 80, height: 40 });
    expect(proposals.at(-1)?.intent.space).toEqual({ width: 240, height: 160 });
    interaction.dispose();
  });
});
