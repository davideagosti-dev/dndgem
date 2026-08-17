import type { DragMechanicsAdapter, DragMechanicsContext } from '@dndgem/dom';
import type { Action } from 'svelte/action';

export interface FakeBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function stubRect(element: HTMLElement, box: FakeBox): void {
  element.getBoundingClientRect = () => ({
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
  });
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

export interface FakeDragController {
  readonly adapter: DragMechanicsAdapter;
  start(itemId: string): void;
  move(itemId: string, translation: { readonly x: number; readonly y: number }): void;
  drop(itemId: string, translation: { readonly x: number; readonly y: number }): void;
  cancel(itemId: string): void;
  isConnected(): boolean;
  connectCount(): number;
}

export function createFakeDragMechanics(): FakeDragController {
  let context: DragMechanicsContext | undefined;
  let connects = 0;

  return {
    adapter: {
      connect(next) {
        connects += 1;
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
    connectCount() {
      return connects;
    },
  };
}

export interface HostActionParams {
  readonly box: FakeBox;
  readonly action: Action<HTMLElement, string | undefined>;
  readonly arg?: string;
}

export const hostAction: Action<HTMLElement, HostActionParams> = (node, params) => {
  stubRect(node, params.box);
  const result =
    params.arg !== undefined ? params.action(node, params.arg) : params.action(node, undefined);
  return {
    update(next) {
      stubRect(node, next.box);
      result?.update?.(next.arg);
    },
    destroy() {
      result?.destroy?.();
    },
  };
};
