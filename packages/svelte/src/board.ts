import { derived, readonly, writable, type Readable, type Writable } from 'svelte/store';
import type { ResolvedLayout } from '@dndgem/core';
import {
  createLayoutSession,
  type DragMechanicsAdapter,
  type LayoutSession,
  type LayoutSessionState,
  type ResizeObserverConstructor,
} from '@dndgem/dom';
import type { DnDGemItemConfig, DnDGemProviderProps } from './types.js';

function itemsSignature(items: readonly DnDGemItemConfig[]): string {
  return JSON.stringify(
    items.map((item) => ({
      id: item.id,
      constraints: item.constraints ?? null,
    })),
  );
}

export class DnDGemBoard {
  readonly stateStore: Writable<LayoutSessionState | undefined> = writable(undefined);
  readonly readyStore: Readable<boolean> = derived(this.stateStore, (state) => state !== undefined);
  private onRegistryChange: (() => void) | undefined;

  private items: readonly DnDGemItemConfig[] = [];
  private desiredPlacements: DnDGemProviderProps['desiredPlacements'];
  private autoLayout = false;
  private mechanics: DragMechanicsAdapter | undefined;
  private resizeObserver: ResizeObserverConstructor | undefined;

  private onChange: DnDGemProviderProps['onChange'];
  private onDrop: DnDGemProviderProps['onDrop'];
  private onCancel: DnDGemProviderProps['onCancel'];

  private readonly containerRef: { current: HTMLElement | null } = { current: null };
  private readonly elementsRef: { current: Map<string, HTMLElement> } = {
    current: new Map(),
  };
  private readonly containerTokenRef: { current: number } = { current: 0 };
  private readonly itemTokensRef: { current: Map<string, number> } = { current: new Map() };
  private readonly previousRef: { current: ResolvedLayout | undefined } = { current: undefined };
  private readonly lastDesiredKeyRef: { current: string | undefined } = { current: undefined };
  private readonly lastBound = {
    container: null as HTMLElement | null,
    elements: new Map<string, HTMLElement>(),
    itemsSig: '',
    desiredKey: '',
    autoLayout: false,
    mechanics: undefined as DragMechanicsAdapter | undefined,
    ResizeObserver: undefined as ResizeObserverConstructor | undefined,
  };
  private session: LayoutSession | undefined;
  private disposed = false;

  configure(
    config: Pick<
      DnDGemProviderProps,
      'items' | 'desiredPlacements' | 'autoLayout' | 'mechanics' | 'ResizeObserver'
    >,
  ): void {
    this.items = config.items;
    this.desiredPlacements = config.desiredPlacements;
    this.autoLayout = config.autoLayout === true;
    this.mechanics = config.mechanics;
    this.resizeObserver = config.ResizeObserver;
  }

  setCallbacks(callbacks: Pick<DnDGemProviderProps, 'onChange' | 'onDrop' | 'onCancel'>): void {
    this.onChange = callbacks.onChange;
    this.onDrop = callbacks.onDrop;
    this.onCancel = callbacks.onCancel;
  }

  setRegistryListener(listener: () => void): void {
    this.onRegistryChange = listener;
  }

  registerContainer(element: HTMLElement | null): void {
    if (this.disposed) {
      return;
    }
    if (element === null) {
      const token = this.containerTokenRef.current + 1;
      this.containerTokenRef.current = token;
      const current = this.containerRef.current;
      queueMicrotask(() => {
        if (this.disposed || this.containerTokenRef.current !== token) {
          return;
        }
        if (this.containerRef.current !== current) {
          return;
        }
        if (current !== null && current.isConnected) {
          return;
        }
        this.containerRef.current = null;
        this.bumpRegistry();
      });
      return;
    }
    this.containerTokenRef.current += 1;
    if (this.containerRef.current === element) {
      return;
    }
    this.containerRef.current = element;
    this.bumpRegistry();
  }

  registerItem(id: string, element: HTMLElement | null): void {
    if (this.disposed) {
      return;
    }
    if (element === null) {
      const token = (this.itemTokensRef.current.get(id) ?? 0) + 1;
      this.itemTokensRef.current.set(id, token);
      const current = this.elementsRef.current.get(id);
      queueMicrotask(() => {
        if (this.disposed || this.itemTokensRef.current.get(id) !== token) {
          return;
        }
        if (this.elementsRef.current.get(id) !== current) {
          return;
        }
        if (current !== undefined && current.isConnected) {
          return;
        }
        this.elementsRef.current.delete(id);
        this.bumpRegistry();
      });
      return;
    }
    this.itemTokensRef.current.set(id, (this.itemTokensRef.current.get(id) ?? 0) + 1);
    if (this.elementsRef.current.get(id) === element) {
      return;
    }
    this.elementsRef.current.set(id, element);
    this.bumpRegistry();
  }

  dispose(): void {
    this.disposed = true;
    this.disposeSession();
  }

  private bumpRegistry(): void {
    this.onRegistryChange?.();
  }

  private disposeSession(): void {
    this.session?.dispose();
    this.session = undefined;
    if (!this.disposed) {
      this.stateStore.set(undefined);
    }
  }

  syncSession(): void {
    if (this.disposed) {
      return;
    }
    const items = this.items;
    const container = this.containerRef.current;
    const incomplete =
      container === null || items.some((item) => !this.elementsRef.current.has(item.id));
    if (incomplete) {
      if (this.session !== undefined && this.lastBound.container?.isConnected) {
        return;
      }
      this.disposeSession();
      return;
    }

    const descriptors = items.map((item) => {
      const element = this.elementsRef.current.get(item.id);
      if (element === undefined) {
        throw new Error(`DnDGemProvider: missing element for item "${item.id}"`);
      }
      return {
        id: item.id,
        element,
        ...(item.constraints !== undefined ? { constraints: item.constraints } : {}),
      };
    });
    if (descriptors.length === 0) {
      this.disposeSession();
      return;
    }

    const itemsSig = itemsSignature(items);
    const desiredKey = JSON.stringify(this.desiredPlacements ?? null);
    const autoLayout = this.autoLayout;
    const mechanics = this.mechanics;
    const ResizeObserver = this.resizeObserver;
    const sameElements =
      this.lastBound.container === container &&
      descriptors.length === this.lastBound.elements.size &&
      descriptors.every((item) => this.lastBound.elements.get(item.id) === item.element);
    const sameConfig =
      this.lastBound.itemsSig === itemsSig &&
      this.lastBound.desiredKey === desiredKey &&
      this.lastBound.autoLayout === autoLayout &&
      this.lastBound.mechanics === mechanics &&
      this.lastBound.ResizeObserver === ResizeObserver;
    if (this.session !== undefined && sameConfig && sameElements) {
      return;
    }

    this.disposeSession();
    this.lastBound.container = container;
    this.lastBound.elements = new Map(descriptors.map((item) => [item.id, item.element]));
    this.lastBound.itemsSig = itemsSig;
    this.lastBound.desiredKey = desiredKey;
    this.lastBound.autoLayout = autoLayout;
    this.lastBound.mechanics = mechanics;
    this.lastBound.ResizeObserver = ResizeObserver;

    const desiredChanged =
      this.lastDesiredKeyRef.current !== undefined && this.lastDesiredKeyRef.current !== desiredKey;
    this.lastDesiredKeyRef.current = desiredKey;
    // Explicit-only: omit previous when desiredPlacements change so ADR-0010
    // cannot suppress new author intent. Auto-Layout: keep previous so removed
    // Source Intent items can retain as generated; the session omits solver
    // previous on non-passive Source Intent cycles.
    const previous = desiredChanged && autoLayout !== true ? undefined : this.previousRef.current;

    this.session = createLayoutSession({
      container,
      items: descriptors,
      desiredPlacements: this.desiredPlacements,
      ...(autoLayout ? { autoLayout: true } : {}),
      previous,
      mechanics,
      ResizeObserver,
      onChange: (next) => {
        this.previousRef.current = next.resolved;
        this.onChange?.(next);
        this.stateStore.set(next);
      },
      onDrop: (event) => {
        this.onDrop?.(event);
      },
      onCancel: (event) => {
        this.onCancel?.(event);
      },
    });
    const initial = this.session.getState();
    this.previousRef.current = initial.resolved;
    this.stateStore.set(initial);
  }

  asStore(): {
    readonly state: Readable<LayoutSessionState | undefined>;
    readonly ready: Readable<boolean>;
  } {
    return {
      state: readonly(this.stateStore),
      ready: this.readyStore,
    };
  }
}
