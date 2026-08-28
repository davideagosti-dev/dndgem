import { defineComponent, onBeforeUnmount, provide, shallowRef, watch, type PropType } from 'vue';
import type { RectInput, ResolvedLayout } from '@dndgem/core';
import {
  createLayoutSession,
  type DragCancelEvent,
  type DragDropResult,
  type DragMechanicsAdapter,
  type LayoutSession,
  type LayoutSessionPlanner,
  type LayoutSessionPlannerEvent,
  type LayoutSessionState,
  type ResizeObserverConstructor,
} from '@dndgem/dom';
import { DnDGemRegistryKey, DnDGemSessionCommandsKey, DnDGemStateKey } from './context.js';
import type { DnDGemItemConfig } from './types.js';

function itemsSignature(items: readonly DnDGemItemConfig[]): string {
  return JSON.stringify(
    items.map((item) => ({
      id: item.id,
      constraints: item.constraints ?? null,
    })),
  );
}

export const DnDGemProvider = defineComponent({
  name: 'DnDGemProvider',
  inheritAttrs: false,
  props: {
    items: {
      type: Array as PropType<readonly DnDGemItemConfig[]>,
      required: true,
    },
    desiredPlacements: {
      type: Object as PropType<Readonly<Record<string, RectInput>>>,
      default: undefined,
    },
    autoLayout: {
      type: Boolean,
      default: false,
    },
    planner: {
      type: Function as PropType<LayoutSessionPlanner>,
      default: undefined,
    },
    onPlannerEvent: {
      type: Function as PropType<(event: LayoutSessionPlannerEvent) => void>,
      default: undefined,
    },
    onChange: {
      type: Function as PropType<(state: LayoutSessionState) => void>,
      default: undefined,
    },
    onDrop: {
      type: Function as PropType<(event: { readonly result: DragDropResult }) => void>,
      default: undefined,
    },
    onCancel: {
      type: Function as PropType<(event: DragCancelEvent) => void>,
      default: undefined,
    },
    ResizeObserver: {
      type: Function as unknown as PropType<ResizeObserverConstructor>,
      default: undefined,
    },
    mechanics: {
      type: Object as PropType<DragMechanicsAdapter>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const registryGeneration = shallowRef(0);
    const state = shallowRef<LayoutSessionState | undefined>(undefined);

    const onChangeRef = shallowRef(props.onChange);
    const onDropRef = shallowRef(props.onDrop);
    const onCancelRef = shallowRef(props.onCancel);
    const onPlannerEventRef = shallowRef(props.onPlannerEvent);
    const plannerRef = shallowRef(props.planner);
    const itemsRef = shallowRef(props.items);
    const desiredRef = shallowRef(props.desiredPlacements);
    const previousRef = shallowRef<ResolvedLayout | undefined>(undefined);
    const lastDesiredKeyRef = shallowRef<string | undefined>(undefined);

    watch(
      () => props.onChange,
      (value) => {
        onChangeRef.value = value;
      },
    );
    watch(
      () => props.onDrop,
      (value) => {
        onDropRef.value = value;
      },
    );
    watch(
      () => props.onCancel,
      (value) => {
        onCancelRef.value = value;
      },
    );
    watch(
      () => props.onPlannerEvent,
      (value) => {
        onPlannerEventRef.value = value;
      },
    );
    watch(
      () => props.planner,
      (value) => {
        plannerRef.value = value;
      },
    );
    watch(
      () => props.items,
      (value) => {
        itemsRef.value = value;
      },
    );
    watch(
      () => props.desiredPlacements,
      (value) => {
        desiredRef.value = value;
      },
    );

    const containerRef = { current: null as HTMLElement | null };
    const elementsRef = { current: new Map<string, HTMLElement>() };
    const containerTokenRef = { current: 0 };
    const itemTokensRef = { current: new Map<string, number>() };
    const lastBound = {
      container: null as HTMLElement | null,
      elements: new Map<string, HTMLElement>(),
      itemsSig: '',
      desiredKey: '',
      autoLayout: false,
      mechanics: undefined as DragMechanicsAdapter | undefined,
      ResizeObserver: undefined as ResizeObserverConstructor | undefined,
      plannerConfigured: false,
    };
    let session: LayoutSession | undefined;

    const bumpRegistry = (): void => {
      registryGeneration.value += 1;
    };

    const registerContainer = (element: HTMLElement | null): void => {
      if (element === null) {
        const token = containerTokenRef.current + 1;
        containerTokenRef.current = token;
        const current = containerRef.current;
        queueMicrotask(() => {
          if (containerTokenRef.current !== token) {
            return;
          }
          if (containerRef.current !== current) {
            return;
          }
          if (current !== null && current.isConnected) {
            return;
          }
          containerRef.current = null;
          bumpRegistry();
        });
        return;
      }
      containerTokenRef.current += 1;
      if (containerRef.current === element) {
        return;
      }
      containerRef.current = element;
      bumpRegistry();
    };

    const registerItem = (id: string, element: HTMLElement | null): void => {
      if (element === null) {
        const token = (itemTokensRef.current.get(id) ?? 0) + 1;
        itemTokensRef.current.set(id, token);
        const current = elementsRef.current.get(id);
        queueMicrotask(() => {
          if (itemTokensRef.current.get(id) !== token) {
            return;
          }
          if (elementsRef.current.get(id) !== current) {
            return;
          }
          if (current !== undefined && current.isConnected) {
            return;
          }
          elementsRef.current.delete(id);
          bumpRegistry();
        });
        return;
      }
      itemTokensRef.current.set(id, (itemTokensRef.current.get(id) ?? 0) + 1);
      if (elementsRef.current.get(id) === element) {
        return;
      }
      elementsRef.current.set(id, element);
      bumpRegistry();
    };

    const registry = {
      registerContainer,
      registerItem,
    };

    const replan = async (): Promise<void> => {
      await session?.replan();
    };

    provide(DnDGemRegistryKey, registry);
    provide(DnDGemSessionCommandsKey, { replan });
    provide(DnDGemStateKey, state);

    const disposeSession = (): void => {
      session?.dispose();
      session = undefined;
    };

    watch(
      [
        registryGeneration,
        () => itemsSignature(props.items),
        () => JSON.stringify(props.desiredPlacements ?? null),
        () => props.autoLayout === true,
        () => props.mechanics,
        () => props.ResizeObserver,
        () => props.planner !== undefined,
      ],
      () => {
        const container = containerRef.current;
        const incomplete =
          container === null || itemsRef.value.some((item) => !elementsRef.current.has(item.id));
        if (incomplete) {
          if (session !== undefined && lastBound.container?.isConnected) {
            return;
          }
          disposeSession();
          return;
        }

        const descriptors = itemsRef.value.map((item) => {
          const element = elementsRef.current.get(item.id);
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
          disposeSession();
          return;
        }
        const itemsSig = itemsSignature(props.items);
        const desiredKey = JSON.stringify(props.desiredPlacements ?? null);
        const autoLayout = props.autoLayout === true;
        const plannerConfigured = props.planner !== undefined;
        const sameElements =
          lastBound.container === container &&
          descriptors.length === lastBound.elements.size &&
          descriptors.every((item) => lastBound.elements.get(item.id) === item.element);
        const sameConfig =
          lastBound.itemsSig === itemsSig &&
          lastBound.desiredKey === desiredKey &&
          lastBound.autoLayout === autoLayout &&
          lastBound.mechanics === props.mechanics &&
          lastBound.ResizeObserver === props.ResizeObserver &&
          lastBound.plannerConfigured === plannerConfigured;
        if (session !== undefined && sameConfig && sameElements) {
          return;
        }

        disposeSession();
        lastBound.container = container;
        lastBound.elements = new Map(descriptors.map((item) => [item.id, item.element]));
        lastBound.itemsSig = itemsSig;
        lastBound.desiredKey = desiredKey;
        lastBound.autoLayout = autoLayout;
        lastBound.mechanics = props.mechanics;
        lastBound.ResizeObserver = props.ResizeObserver;
        lastBound.plannerConfigured = plannerConfigured;

        const desiredChanged =
          lastDesiredKeyRef.value !== undefined && lastDesiredKeyRef.value !== desiredKey;
        lastDesiredKeyRef.value = desiredKey;
        // Explicit-only: omit previous when desiredPlacements change so ADR-0010
        // cannot suppress new author intent. Auto-Layout: keep previous so removed
        // Source Intent items can retain as generated; the session omits solver
        // previous on non-passive Source Intent cycles.
        const previous =
          desiredChanged && props.autoLayout !== true ? undefined : previousRef.value;

        session = createLayoutSession({
          container,
          items: descriptors,
          desiredPlacements: desiredRef.value,
          ...(props.autoLayout === true ? { autoLayout: true } : {}),
          previous,
          mechanics: props.mechanics,
          ResizeObserver: props.ResizeObserver,
          ...(plannerConfigured
            ? {
                planner: (snapshot, context) => {
                  const current = plannerRef.value;
                  if (current === undefined) {
                    return { automaticItemOrder: [] };
                  }
                  return current(snapshot, context);
                },
                onPlannerEvent: (event) => {
                  onPlannerEventRef.value?.(event);
                },
              }
            : {}),
          onChange: (next) => {
            previousRef.value = next.resolved;
            onChangeRef.value?.(next);
            state.value = next;
          },
          onDrop: (event) => {
            onDropRef.value?.(event);
          },
          onCancel: (event) => {
            onCancelRef.value?.(event);
          },
        });
        const initial = session.getState();
        previousRef.value = initial.resolved;
        state.value = initial;
      },
      { flush: 'post', immediate: true },
    );

    onBeforeUnmount(() => {
      disposeSession();
    });

    return () => slots.default?.() ?? null;
  },
});
