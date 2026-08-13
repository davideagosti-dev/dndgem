import { describe, expect, it, vi } from 'vitest';
import { DomAdapterError, observeLayout, type DomMeasurementSnapshot } from '../src/index.js';
import {
  FakeResizeObserver,
  fakeElement,
  lastFakeObserver,
  resetFakeResizeObservers,
  type FakeBox,
} from './helpers.js';

function collectSnapshots() {
  const snapshots: DomMeasurementSnapshot[] = [];
  return {
    snapshots,
    onMeasure: (snapshot: DomMeasurementSnapshot) => {
      snapshots.push(snapshot);
    },
  };
}

describe('observeLayout', () => {
  it('emits a synchronous initial snapshot without a resize event', () => {
    resetFakeResizeObservers();
    const containerBox: FakeBox = { left: 0, top: 0, width: 200, height: 100 };
    const itemBox: FakeBox = { left: 10, top: 15, width: 40, height: 30 };
    const { snapshots, onMeasure } = collectSnapshots();

    const observer = observeLayout({
      container: fakeElement(containerBox),
      items: { a: fakeElement(itemBox) },
      onMeasure,
      ResizeObserver: FakeResizeObserver,
    });

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]?.space).toEqual({ width: 200, height: 100 });
    expect(snapshots[0]?.measurements.a).toEqual({ x: 10, y: 15, width: 40, height: 30 });
    expect(lastFakeObserver().observed.size).toBe(2);
    observer.dispose();
  });

  it('remeasures authoritative current DOM state on resize, ignoring entry order', () => {
    resetFakeResizeObservers();
    const containerBox: FakeBox = { left: 0, top: 0, width: 200, height: 100 };
    const itemBox: FakeBox = { left: 10, top: 10, width: 20, height: 20 };
    const { snapshots, onMeasure } = collectSnapshots();

    observeLayout({
      container: fakeElement(containerBox),
      items: { a: fakeElement(itemBox) },
      onMeasure,
      ResizeObserver: FakeResizeObserver,
    });

    containerBox.width = 400;
    containerBox.height = 300;
    itemBox.width = 50;
    itemBox.height = 60;

    const fakeEntries = [{}, {}, {}] as ResizeObserverEntry[];
    lastFakeObserver().deliver(fakeEntries);

    expect(snapshots).toHaveLength(2);
    expect(snapshots[1]?.space).toEqual({ width: 400, height: 300 });
    expect(snapshots[1]?.measurements.a).toEqual({ x: 10, y: 10, width: 50, height: 60 });
  });

  it('updates space when the container resizes and item geometry when an item resizes', () => {
    resetFakeResizeObservers();
    const containerBox: FakeBox = { left: 8, top: 4, width: 100, height: 80 };
    const itemBox: FakeBox = { left: 18, top: 14, width: 30, height: 20 };
    const { snapshots, onMeasure } = collectSnapshots();

    observeLayout({
      container: fakeElement(containerBox),
      items: { tile: fakeElement(itemBox) },
      onMeasure,
      ResizeObserver: FakeResizeObserver,
    });

    containerBox.width = 180;
    lastFakeObserver().deliver();
    expect(snapshots[1]?.space.width).toBe(180);
    expect(snapshots[1]?.measurements.tile).toEqual({ x: 10, y: 10, width: 30, height: 20 });

    itemBox.height = 44;
    lastFakeObserver().deliver();
    expect(snapshots[2]?.measurements.tile?.height).toBe(44);
    expect(snapshots[2]?.space.width).toBe(180);
  });

  it('suppresses exact duplicate snapshots without timers', () => {
    resetFakeResizeObservers();
    const containerBox: FakeBox = { left: 0, top: 0, width: 50, height: 50 };
    const { snapshots, onMeasure } = collectSnapshots();

    observeLayout({
      container: fakeElement(containerBox),
      items: {},
      onMeasure,
      ResizeObserver: FakeResizeObserver,
    });

    lastFakeObserver().deliver();
    lastFakeObserver().deliver();
    expect(snapshots).toHaveLength(1);
  });

  it('disconnects on dispose, is idempotent, and emits no further callbacks', () => {
    resetFakeResizeObservers();
    const containerBox: FakeBox = { left: 0, top: 0, width: 50, height: 50 };
    const { snapshots, onMeasure } = collectSnapshots();

    const observer = observeLayout({
      container: fakeElement(containerBox),
      items: { a: fakeElement({ left: 1, top: 1, width: 2, height: 2 }) },
      onMeasure,
      ResizeObserver: FakeResizeObserver,
    });

    const fake = lastFakeObserver();
    observer.dispose();
    observer.dispose();

    expect(fake.disconnected).toBe(true);
    expect(fake.observed.size).toBe(0);

    containerBox.width = 90;
    fake.deliver();
    expect(snapshots).toHaveLength(1);

    expect(() => observer.measure()).toThrow(DomAdapterError);
    try {
      observer.measure();
    } catch (error) {
      expect((error as DomAdapterError).code).toBe('OBSERVER_DISPOSED');
    }
  });

  it('emits the initial snapshot before a synchronous ResizeObserver callback', () => {
    resetFakeResizeObservers();
    const containerBox: FakeBox = { left: 0, top: 0, width: 50, height: 50 };
    const { snapshots, onMeasure } = collectSnapshots();

    class SyncResizeObserver extends FakeResizeObserver {
      override observe(target: Element): void {
        super.observe(target);
        containerBox.width = 90;
        this.deliver();
      }
    }

    observeLayout({
      container: fakeElement(containerBox),
      items: {},
      onMeasure,
      ResizeObserver: SyncResizeObserver,
    });

    expect(snapshots).toHaveLength(2);
    expect(snapshots[0]?.space.width).toBe(50);
    expect(snapshots[1]?.space.width).toBe(90);
    expect(snapshots[snapshots.length - 1]?.space.width).toBe(90);
  });

  it('throws when ResizeObserver is unavailable and no constructor is injected', () => {
    const previous = (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
    delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;

    try {
      expect(() =>
        observeLayout({
          container: fakeElement({ left: 0, top: 0, width: 10, height: 10 }),
          items: {},
          onMeasure: vi.fn(),
        }),
      ).toThrow(DomAdapterError);
    } finally {
      if (previous !== undefined) {
        (globalThis as { ResizeObserver?: unknown }).ResizeObserver = previous;
      }
    }
  });
});
