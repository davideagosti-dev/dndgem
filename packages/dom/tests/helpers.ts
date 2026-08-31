import { vi } from 'vitest';
import type { DragMechanicsAdapter, DragMechanicsContext } from '../src/index.js';

export interface FakeBox {
  left: number;
  top: number;
  width: number;
  height: number;
  connected?: boolean;
}

export function fakeElement(box: FakeBox): HTMLElement {
  const style: Record<string, string> = {
    position: '',
    boxSizing: '',
    left: '',
    top: '',
    width: '',
    height: '',
    right: '',
    bottom: '',
    transform: '',
  };
  const element = {
    style,
    get isConnected() {
      return box.connected !== false;
    },
    getBoundingClientRect() {
      return {
        x: box.left,
        y: box.top,
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        right: box.left + box.width,
        bottom: box.top + box.height,
        toJSON() {
          return {};
        },
      };
    },
  };
  return element as unknown as HTMLElement;
}

/**
 * Like `fakeElement`, but `getBoundingClientRect` reflects applied inline
 * placement styles (px). Needed to exercise real reconnect remasure after
 * `applyLayoutPlacements` — default fakes keep the seed box unchanged.
 */
export function styleReflectingElement(box: FakeBox): HTMLElement {
  const style: Record<string, string> = {
    position: '',
    boxSizing: '',
    left: '',
    top: '',
    width: '',
    height: '',
    right: '',
    bottom: '',
    transform: '',
  };

  const readPx = (value: string, fallback: number): number => {
    if (value.endsWith('px')) {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return fallback;
  };

  const element = {
    style,
    get isConnected() {
      return box.connected !== false;
    },
    getBoundingClientRect() {
      const left = readPx(style.left ?? '', box.left);
      const top = readPx(style.top ?? '', box.top);
      const width = readPx(style.width ?? '', box.width);
      const height = readPx(style.height ?? '', box.height);
      return {
        x: left,
        y: top,
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        toJSON() {
          return {};
        },
      };
    },
  };
  return element as unknown as HTMLElement;
}

export class FakeResizeObserver implements ResizeObserver {
  static instances: FakeResizeObserver[] = [];

  readonly callback: ResizeObserverCallback;
  readonly observed = new Set<Element>();
  disconnected = false;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    FakeResizeObserver.instances.push(this);
  }

  observe(target: Element): void {
    if (this.disconnected) {
      return;
    }
    this.observed.add(target);
  }

  unobserve(target: Element): void {
    this.observed.delete(target);
  }

  disconnect(): void {
    this.disconnected = true;
    this.observed.clear();
  }

  deliver(entries: ResizeObserverEntry[] = []): void {
    if (this.disconnected) {
      return;
    }
    this.callback(entries, this);
  }
}

export function resetFakeResizeObservers(): void {
  FakeResizeObserver.instances = [];
}

export function lastFakeObserver(): FakeResizeObserver {
  const instance = FakeResizeObserver.instances.at(-1);
  if (instance === undefined) {
    throw new Error('expected a FakeResizeObserver instance');
  }
  return instance;
}

export function spyRect(element: HTMLElement) {
  return vi.spyOn(element, 'getBoundingClientRect');
}

export interface FakeDragController {
  readonly adapter: DragMechanicsAdapter;
  start(itemId: string): void;
  move(itemId: string, translation: { readonly x: number; readonly y: number }): void;
  drop(itemId: string, translation: { readonly x: number; readonly y: number }): void;
  cancel(itemId: string): void;
  isConnected(): boolean;
}

export function createFakeDragMechanics(): FakeDragController {
  let context: DragMechanicsContext | undefined;

  return {
    adapter: {
      connect(next) {
        context = next;
        return {
          dispose() {
            context = undefined;
          },
        };
      },
    },
    start(itemId) {
      if (context === undefined) {
        throw new Error('fake drag mechanics are not connected');
      }
      context.onStart({ itemId });
    },
    move(itemId, translation) {
      if (context === undefined) {
        throw new Error('fake drag mechanics are not connected');
      }
      context.onMove({ itemId, translation });
    },
    drop(itemId, translation) {
      if (context === undefined) {
        throw new Error('fake drag mechanics are not connected');
      }
      context.onDrop({ itemId, translation });
    },
    cancel(itemId) {
      if (context === undefined) {
        throw new Error('fake drag mechanics are not connected');
      }
      context.onCancel({ itemId });
    },
    isConnected() {
      return context !== undefined;
    },
  };
}
