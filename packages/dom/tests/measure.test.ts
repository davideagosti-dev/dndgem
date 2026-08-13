import { describe, expect, it } from 'vitest';
import { DomAdapterError, measureLayout } from '../src/index.js';
import { fakeElement, spyRect, type FakeBox } from './helpers.js';

function containerAndItem() {
  const containerBox: FakeBox = { left: 100, top: 50, width: 800, height: 600 };
  const itemBox: FakeBox = { left: 140, top: 90, width: 200, height: 100 };
  return {
    containerBox,
    itemBox,
    container: fakeElement(containerBox),
    item: fakeElement(itemBox),
  };
}

describe('measureLayout', () => {
  it('normalizes a container and single item into container-relative Core geometry', () => {
    const { container, item } = containerAndItem();
    const snapshot = measureLayout({ container, items: { card: item } });

    expect(snapshot.space).toEqual({ width: 800, height: 600 });
    expect(snapshot.measurements.card).toEqual({ x: 40, y: 40, width: 200, height: 100 });
    expect(snapshot.unavailable).toEqual([]);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.measurements)).toBe(true);
  });

  it('measures multiple items without mutating caller-owned structures', () => {
    const { container } = containerAndItem();
    const a = fakeElement({ left: 100, top: 50, width: 10, height: 20 });
    const b = fakeElement({ left: 130, top: 80, width: 40, height: 50 });
    const items = { a, b };
    Object.freeze(items);

    const snapshot = measureLayout({ container, items });
    expect(snapshot.measurements.a).toEqual({ x: 0, y: 0, width: 10, height: 20 });
    expect(snapshot.measurements.b).toEqual({ x: 30, y: 30, width: 40, height: 50 });
    expect(items).toEqual({ a, b });
  });

  it('preserves fractional browser geometry', () => {
    const container = fakeElement({ left: 10.25, top: 5.5, width: 100.5, height: 80.25 });
    const item = fakeElement({ left: 23, top: 18.25, width: 12.75, height: 20.25 });
    const snapshot = measureLayout({ container, items: { frac: item } });

    expect(snapshot.space).toEqual({ width: 100.5, height: 80.25 });
    expect(snapshot.measurements.frac).toEqual({
      x: 12.75,
      y: 12.75,
      width: 12.75,
      height: 20.25,
    });
    expect(snapshot.measurements.frac?.width).not.toBe(13);
    expect(snapshot.measurements.frac?.width).not.toBe(12);
  });

  it('allows zero width and zero height', () => {
    const container = fakeElement({ left: 0, top: 0, width: 400, height: 300 });
    const collapsed = fakeElement({ left: 10, top: 10, width: 0, height: 0 });
    const snapshot = measureLayout({ container, items: { hidden: collapsed } });
    expect(snapshot.measurements.hidden).toEqual({ x: 10, y: 10, width: 0, height: 0 });
    expect(snapshot.unavailable).toEqual([]);
  });

  it('keeps relative coordinates stable when viewport origin is offset', () => {
    const { container, item } = containerAndItem();
    const snapshot = measureLayout({ container, items: { card: item } });
    expect(snapshot.measurements.card).toEqual({ x: 40, y: 40, width: 200, height: 100 });
  });

  it('produces valid relative coordinates from negative viewport positions', () => {
    const container = fakeElement({ left: -40, top: -10, width: 200, height: 100 });
    const item = fakeElement({ left: 10, top: 20, width: 50, height: 25 });
    const snapshot = measureLayout({ container, items: { off: item } });
    expect(snapshot.measurements.off).toEqual({ x: 50, y: 30, width: 50, height: 25 });
  });

  it('is independent of equal viewport scroll shifts', () => {
    const containerBox: FakeBox = { left: 100, top: 50, width: 800, height: 600 };
    const itemBox: FakeBox = { left: 140, top: 90, width: 200, height: 100 };
    const before = measureLayout({
      container: fakeElement(containerBox),
      items: { card: fakeElement(itemBox) },
    });

    containerBox.left += 20;
    containerBox.top += 30;
    itemBox.left += 20;
    itemBox.top += 30;

    const after = measureLayout({
      container: fakeElement(containerBox),
      items: { card: fakeElement(itemBox) },
    });

    expect(after.measurements.card).toEqual(before.measurements.card);
    expect(after.space).toEqual(before.space);
  });

  it('reads each element once per measurement cycle', () => {
    const { container, item } = containerAndItem();
    const containerSpy = spyRect(container);
    const itemSpy = spyRect(item);

    measureLayout({ container, items: { card: item } });

    expect(containerSpy).toHaveBeenCalledTimes(1);
    expect(itemSpy).toHaveBeenCalledTimes(1);
  });

  it('skips disconnected items with structured unavailable metadata', () => {
    const container = fakeElement({ left: 0, top: 0, width: 100, height: 100 });
    const live = fakeElement({ left: 10, top: 10, width: 20, height: 20 });
    const detached = fakeElement({
      left: 0,
      top: 0,
      width: 1,
      height: 1,
      connected: false,
    });

    const snapshot = measureLayout({
      container,
      items: { live, gone: detached },
    });

    expect(snapshot.measurements.live).toEqual({ x: 10, y: 10, width: 20, height: 20 });
    expect(snapshot.measurements.gone).toBeUndefined();
    expect(snapshot.unavailable).toEqual([{ id: 'gone', reason: 'disconnected' }]);
  });

  it('throws when the container is missing or disconnected', () => {
    const item = fakeElement({ left: 0, top: 0, width: 1, height: 1 });
    expect(() =>
      measureLayout({ container: undefined as unknown as HTMLElement, items: { item } }),
    ).toThrow(DomAdapterError);

    const detached = fakeElement({ left: 0, top: 0, width: 10, height: 10, connected: false });
    try {
      measureLayout({ container: detached, items: {} });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(DomAdapterError);
      expect((error as DomAdapterError).code).toBe('DISCONNECTED_CONTAINER');
    }
  });

  it('throws for malformed item ids and non-elements', () => {
    const container = fakeElement({ left: 0, top: 0, width: 10, height: 10 });
    expect(() => measureLayout({ container, items: { '': container } })).toThrow(DomAdapterError);
    expect(() =>
      measureLayout({
        container,
        items: { bad: null as unknown as HTMLElement },
      }),
    ).toThrow(DomAdapterError);
    try {
      measureLayout({
        container,
        items: [container] as unknown as Record<string, HTMLElement>,
      });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(DomAdapterError);
      expect((error as DomAdapterError).code).toBe('INVALID_ITEMS');
    }
  });

  it('rejects non-finite browser geometry before Core construction', () => {
    const container = fakeElement({ left: 0, top: 0, width: 10, height: 10 });
    const item = fakeElement({ left: Number.NaN, top: 0, width: 10, height: 10 });
    try {
      measureLayout({ container, items: { bad: item } });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(DomAdapterError);
      expect((error as DomAdapterError).code).toBe('NON_FINITE_GEOMETRY');
    }
  });
});
