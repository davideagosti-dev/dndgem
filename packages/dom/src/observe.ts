import { DomAdapterError } from './errors.js';
import {
  measureLayout,
  snapshotsEqual,
  type DomMeasurementSnapshot,
  type MeasureLayoutInput,
} from './measure.js';

export type ResizeObserverConstructor = new (callback: ResizeObserverCallback) => ResizeObserver;

export interface ObserveLayoutInput extends MeasureLayoutInput {
  readonly onMeasure: (snapshot: DomMeasurementSnapshot) => void;
  /**
   * Optional observer constructor. Defaults to `globalThis.ResizeObserver`.
   * Inject in tests; required in environments where ResizeObserver is missing.
   */
  readonly ResizeObserver?: ResizeObserverConstructor;
}

export interface DomMeasurementObserver {
  /** Pull the current normalized snapshot (also emits if it changed). */
  readonly measure: () => DomMeasurementSnapshot;
  /** Disconnect observers, drop element references, ignore later callbacks. */
  readonly dispose: () => void;
}

function resolveResizeObserverConstructor(
  injected: ResizeObserverConstructor | undefined,
): ResizeObserverConstructor {
  if (injected !== undefined) {
    if (typeof injected !== 'function') {
      throw new DomAdapterError(
        'RESIZE_OBSERVER_UNAVAILABLE',
        'ResizeObserver constructor must be a function',
      );
    }
    return injected;
  }

  const globalCtor = (globalThis as { ResizeObserver?: ResizeObserverConstructor }).ResizeObserver;
  if (typeof globalCtor !== 'function') {
    throw new DomAdapterError(
      'RESIZE_OBSERVER_UNAVAILABLE',
      'ResizeObserver is not available in this environment',
    );
  }
  return globalCtor;
}

function isDisconnectedContainer(error: unknown): boolean {
  return error instanceof DomAdapterError && error.code === 'DISCONNECTED_CONTAINER';
}

/**
 * Observe container and item elements; emit normalized snapshots.
 *
 * - Performs a synchronous initial measurement and emits it before subscribing
 *   (no resize event required; a sync observer callback cannot precede it).
 * - On any ResizeObserver notification, remeasures current DOM state.
 *   Callback entry order is ignored.
 * - Exact duplicate snapshots are suppressed (structural compare, no timers).
 * - `dispose()` is idempotent, drops retained element refs, and stops further
 *   callbacks. `measure()` after dispose throws `OBSERVER_DISPOSED`.
 */
export function observeLayout(input: ObserveLayoutInput): DomMeasurementObserver {
  if (input === null || typeof input !== 'object') {
    throw new DomAdapterError('INVALID_OBSERVE_INPUT', 'ObserveLayoutInput must be an object');
  }
  if (typeof input.onMeasure !== 'function') {
    throw new DomAdapterError('INVALID_OBSERVER_CALLBACK', 'onMeasure must be a function');
  }

  const ResizeObserverCtor = resolveResizeObserverConstructor(input.ResizeObserver);
  const onMeasure = input.onMeasure;

  const initial = measureLayout({ container: input.container, items: input.items });
  let container: HTMLElement | undefined = input.container;
  let items: Readonly<Record<string, HTMLElement>> | undefined = Object.freeze({
    ...input.items,
  });

  let disposed = false;
  let lastSnapshot: DomMeasurementSnapshot | undefined;
  let observer: ResizeObserver | undefined;

  const emitIfChanged = (snapshot: DomMeasurementSnapshot): void => {
    if (disposed) {
      return;
    }
    if (lastSnapshot !== undefined && snapshotsEqual(lastSnapshot, snapshot)) {
      return;
    }
    lastSnapshot = snapshot;
    onMeasure(snapshot);
  };

  // Emit the initial snapshot before subscribing so a synchronous ResizeObserver
  // callback cannot precede — or stale-overwrite — the first consumer notification.
  emitIfChanged(initial);

  observer = new ResizeObserverCtor(() => {
    if (disposed) {
      return;
    }
    try {
      if (container === undefined || items === undefined) {
        return;
      }
      emitIfChanged(measureLayout({ container, items }));
    } catch (error) {
      if (isDisconnectedContainer(error)) {
        return;
      }
      throw error;
    }
  });

  if (container === undefined || items === undefined) {
    throw new DomAdapterError('INVALID_OBSERVE_INPUT', 'container and items are required');
  }

  observer.observe(container);
  for (const key of Object.keys(items)) {
    const element = items[key];
    if (element !== undefined) {
      observer.observe(element);
    }
  }

  return {
    measure(): DomMeasurementSnapshot {
      if (disposed) {
        throw new DomAdapterError('OBSERVER_DISPOSED', 'Cannot measure a disposed layout observer');
      }
      if (container === undefined || items === undefined) {
        throw new DomAdapterError('OBSERVER_DISPOSED', 'Cannot measure a disposed layout observer');
      }
      const snapshot = measureLayout({ container, items });
      emitIfChanged(snapshot);
      return snapshot;
    },
    dispose(): void {
      if (disposed) {
        return;
      }
      disposed = true;
      lastSnapshot = undefined;
      observer?.disconnect();
      observer = undefined;
      container = undefined;
      items = undefined;
    },
  };
}
