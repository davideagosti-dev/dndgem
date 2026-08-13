import { vi } from 'vitest';

export interface FakeBox {
  left: number;
  top: number;
  width: number;
  height: number;
  connected?: boolean;
}

export function fakeElement(box: FakeBox): HTMLElement {
  const element = {
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
