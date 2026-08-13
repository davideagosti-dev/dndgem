import { describe, expect, it } from 'vitest';
import { createResolvedLayout } from '@dndgem/core';
import {
  DomAdapterError,
  applyLayoutPlacements,
  layoutPlacementStyle,
  prepareLayoutContainer,
} from '../src/index.js';
import { fakeElement } from './helpers.js';

describe('layoutPlacementStyle', () => {
  it('maps a Rect to absolute border-box CSS without design properties', () => {
    const style = layoutPlacementStyle({ x: 12, y: 8, width: 120, height: 40 });
    expect(style).toEqual({
      position: 'absolute',
      boxSizing: 'border-box',
      left: '12px',
      top: '8px',
      width: '120px',
      height: '40px',
    });
    expect('color' in style).toBe(false);
    expect('transform' in style).toBe(false);
    expect('zIndex' in style).toBe(false);
  });

  it('is deterministic for the same Rect', () => {
    const rect = { x: 0.5, y: -2, width: 10, height: 4 };
    expect(layoutPlacementStyle(rect)).toEqual(layoutPlacementStyle(rect));
  });
});

describe('applyLayoutPlacements', () => {
  it('writes resolved geometry onto the matching ItemId element', () => {
    const chart = fakeElement({ left: 0, top: 0, width: 10, height: 10 });
    const table = fakeElement({ left: 0, top: 0, width: 10, height: 10 });
    applyLayoutPlacements({
      items: { chart, table },
      layout: createResolvedLayout({
        space: { width: 400, height: 200 },
        placements: {
          chart: { x: 16, y: 8, width: 180, height: 80 },
          table: { x: 200, y: 8, width: 160, height: 120 },
        },
      }),
    });
    expect(chart.style.left).toBe('16px');
    expect(chart.style.top).toBe('8px');
    expect(chart.style.width).toBe('180px');
    expect(chart.style.height).toBe('80px');
    expect(chart.style.position).toBe('absolute');
    expect(chart.style.boxSizing).toBe('border-box');
    expect(table.style.left).toBe('200px');
    expect(table.style.width).toBe('160px');
  });

  it('does not overwrite unrelated visual styles', () => {
    const chart = fakeElement({ left: 0, top: 0, width: 10, height: 10 });
    chart.style.color = 'rgb(1, 2, 3)';
    chart.style.background = 'navy';
    chart.style.zIndex = '4';
    applyLayoutPlacements({
      items: { chart },
      layout: createResolvedLayout({
        space: { width: 400, height: 200 },
        placements: { chart: { x: 16, y: 8, width: 180, height: 80 } },
      }),
    });
    expect(chart.style.color).toBe('rgb(1, 2, 3)');
    expect(chart.style.background).toBe('navy');
    expect(chart.style.zIndex).toBe('4');
    expect(chart.style.left).toBe('16px');
  });

  it('does not write another item id onto the wrong element', () => {
    const a = fakeElement({ left: 0, top: 0, width: 1, height: 1 });
    const b = fakeElement({ left: 0, top: 0, width: 1, height: 1 });
    applyLayoutPlacements({
      items: { a, b },
      layout: createResolvedLayout({
        space: { width: 100, height: 100 },
        placements: {
          a: { x: 1, y: 2, width: 10, height: 20 },
          b: { x: 30, y: 4, width: 11, height: 21 },
        },
      }),
    });
    expect(a.style.left).toBe('1px');
    expect(b.style.left).toBe('30px');
    expect(a.style.width).toBe('10px');
    expect(b.style.width).toBe('11px');
  });

  it('skips the active item id so pointer-follow transforms are not overwritten', () => {
    const a = fakeElement({ left: 0, top: 0, width: 1, height: 1 });
    const b = fakeElement({ left: 0, top: 0, width: 1, height: 1 });
    a.style.left = '0px';
    applyLayoutPlacements({
      items: { a, b },
      layout: createResolvedLayout({
        space: { width: 100, height: 100 },
        placements: {
          a: { x: 40, y: 40, width: 10, height: 10 },
          b: { x: 8, y: 8, width: 12, height: 12 },
        },
      }),
      skipItemId: 'a',
    });
    expect(a.style.left).toBe('0px');
    expect(b.style.left).toBe('8px');
  });

  it('rejects a non-object items map', () => {
    expect(() =>
      applyLayoutPlacements({
        items: [] as unknown as Record<string, HTMLElement>,
        layout: createResolvedLayout({ space: { width: 1, height: 1 }, placements: {} }),
      }),
    ).toThrow(DomAdapterError);
  });
});

describe('prepareLayoutContainer', () => {
  it('sets relative positioning when the container is static', () => {
    const container = fakeElement({ left: 0, top: 0, width: 100, height: 100 });
    prepareLayoutContainer(container);
    expect(container.style.position).toBe('relative');
  });

  it('does not override an already positioned container', () => {
    const container = fakeElement({ left: 0, top: 0, width: 100, height: 100 });
    container.style.position = 'absolute';
    prepareLayoutContainer(container);
    expect(container.style.position).toBe('absolute');
  });
});
