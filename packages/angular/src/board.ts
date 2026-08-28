import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import type { ResolvedLayout } from '@dndgem/core';
import {
  createLayoutSession,
  type DragMechanicsAdapter,
  type LayoutSession,
  type LayoutSessionPlanner,
  type LayoutSessionState,
  type ResizeObserverConstructor,
} from '@dndgem/dom';
import type { DnDGemBoardCallbacks, DnDGemBoardConfig, DnDGemItemConfig } from './types.js';

function itemsSignature(items: readonly DnDGemItemConfig[]): string {
  return JSON.stringify(
    items.map((item) => ({
      id: item.id,
      constraints: item.constraints ?? null,
    })),
  );
}

@Injectable()
export class DnDGemBoard {
  readonly state = signal<LayoutSessionState | undefined>(undefined);
  readonly ready = computed(() => this.state() !== undefined);
  /** Incremented when container/item host registration changes. */
  readonly registryGeneration = signal(0);

  private readonly items = signal<readonly DnDGemItemConfig[]>([]);
  private readonly desiredPlacements = signal<DnDGemBoardConfig['desiredPlacements']>(undefined);
  private readonly autoLayout = signal(false);
  private readonly mechanics = signal<DragMechanicsAdapter | undefined>(undefined);
  private readonly resizeObserver = signal<ResizeObserverConstructor | undefined>(undefined);
  private readonly plannerConfigured = signal(false);

  private planner: LayoutSessionPlanner | undefined;
  private onChange: DnDGemBoardCallbacks['onChange'];
  private onDrop: DnDGemBoardCallbacks['onDrop'];
  private onCancel: DnDGemBoardCallbacks['onCancel'];
  private onPlannerEvent: DnDGemBoardCallbacks['onPlannerEvent'];

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
    plannerConfigured: false,
  };
  private session: LayoutSession | undefined;
  private disposed = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.disposed = true;
      this.disposeSession();
    });
  }

  configure(config: DnDGemBoardConfig): void {
    this.items.set(config.items);
    this.desiredPlacements.set(config.desiredPlacements);
    this.autoLayout.set(config.autoLayout === true);
    this.mechanics.set(config.mechanics);
    this.resizeObserver.set(config.ResizeObserver);
    this.planner = config.planner;
    this.plannerConfigured.set(config.planner !== undefined);
  }

  setCallbacks(callbacks: DnDGemBoardCallbacks): void {
    this.onChange = callbacks.onChange;
    this.onDrop = callbacks.onDrop;
    this.onCancel = callbacks.onCancel;
    this.onPlannerEvent = callbacks.onPlannerEvent;
  }

  /**
   * Explicit advisory replan. Always returns a Promise (DND-4.3).
   */
  async replan(): Promise<void> {
    await this.session?.replan();
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

  private bumpRegistry(): void {
    this.registryGeneration.update((value) => value + 1);
  }

  private disposeSession(): void {
    this.session?.dispose();
    this.session = undefined;
    if (!this.disposed) {
      this.state.set(undefined);
    }
  }

  syncSession(): void {
    if (this.disposed) {
      return;
    }
    const items = this.items();
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
        throw new Error(`DnDGemBoard: missing element for item "${item.id}"`);
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
    const desiredKey = JSON.stringify(this.desiredPlacements() ?? null);
    const autoLayout = this.autoLayout();
    const mechanics = this.mechanics();
    const ResizeObserver = this.resizeObserver();
    const plannerConfigured = this.plannerConfigured();
    const sameElements =
      this.lastBound.container === container &&
      descriptors.length === this.lastBound.elements.size &&
      descriptors.every((item) => this.lastBound.elements.get(item.id) === item.element);
    const sameConfig =
      this.lastBound.itemsSig === itemsSig &&
      this.lastBound.desiredKey === desiredKey &&
      this.lastBound.autoLayout === autoLayout &&
      this.lastBound.mechanics === mechanics &&
      this.lastBound.ResizeObserver === ResizeObserver &&
      this.lastBound.plannerConfigured === plannerConfigured;
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
    this.lastBound.plannerConfigured = plannerConfigured;

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
      desiredPlacements: this.desiredPlacements(),
      ...(autoLayout ? { autoLayout: true } : {}),
      previous,
      mechanics,
      ResizeObserver,
      ...(plannerConfigured
        ? {
            planner: (snapshot, context) => {
              const current = this.planner;
              if (current === undefined) {
                return { automaticItemOrder: [] };
              }
              return current(snapshot, context);
            },
            onPlannerEvent: (event) => {
              this.onPlannerEvent?.(event);
            },
          }
        : {}),
      onChange: (next) => {
        this.previousRef.current = next.resolved;
        this.onChange?.(next);
        this.state.set(next);
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
    this.state.set(initial);
  }
}
