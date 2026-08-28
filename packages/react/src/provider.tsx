import { useCallback, useLayoutEffect, useMemo, useRef, useState, type JSX } from 'react';
import type { ResolvedLayout } from '@dndgem/core';
import { createLayoutSession, type LayoutSession, type LayoutSessionState } from '@dndgem/dom';
import {
  DnDGemRegistryContext,
  DnDGemSessionCommandsContext,
  DnDGemStateContext,
} from './context.js';
import type { DnDGemItemConfig, DnDGemProviderProps } from './types.js';

function itemsSignature(items: readonly DnDGemItemConfig[]): string {
  return JSON.stringify(
    items.map((item) => ({
      id: item.id,
      constraints: item.constraints ?? null,
    })),
  );
}

export function DnDGemProvider(props: DnDGemProviderProps): JSX.Element {
  const [registryGeneration, setRegistryGeneration] = useState(0);
  const [state, setState] = useState<LayoutSessionState | undefined>(undefined);

  const onChangeRef = useRef(props.onChange);
  onChangeRef.current = props.onChange;
  const onDropRef = useRef(props.onDrop);
  onDropRef.current = props.onDrop;
  const onCancelRef = useRef(props.onCancel);
  onCancelRef.current = props.onCancel;
  const onPlannerEventRef = useRef(props.onPlannerEvent);
  onPlannerEventRef.current = props.onPlannerEvent;
  const plannerRef = useRef(props.planner);
  plannerRef.current = props.planner;
  const itemsRef = useRef(props.items);
  itemsRef.current = props.items;
  const desiredRef = useRef(props.desiredPlacements);
  desiredRef.current = props.desiredPlacements;
  const previousRef = useRef<ResolvedLayout | undefined>(undefined);
  const lastDesiredKeyRef = useRef<string | undefined>(undefined);
  const containerRef = useRef<HTMLElement | null>(null);
  const elementsRef = useRef(new Map<string, HTMLElement>());
  const containerTokenRef = useRef(0);
  const itemTokensRef = useRef(new Map<string, number>());
  const sessionRef = useRef<LayoutSession | null>(null);

  const bumpRegistry = useCallback(() => {
    setRegistryGeneration((value) => value + 1);
  }, []);

  const registerContainer = useCallback(
    (element: HTMLElement | null) => {
      if (element === null) {
        const token = containerTokenRef.current + 1;
        containerTokenRef.current = token;
        const current = containerRef.current;
        queueMicrotask(() => {
          if (containerTokenRef.current !== token) {
            return;
          }
          if (containerRef.current === current) {
            containerRef.current = null;
            bumpRegistry();
          }
        });
        return;
      }
      containerTokenRef.current += 1;
      if (containerRef.current === element) {
        return;
      }
      containerRef.current = element;
      bumpRegistry();
    },
    [bumpRegistry],
  );

  const registerItem = useCallback(
    (id: string, element: HTMLElement | null) => {
      if (element === null) {
        const token = (itemTokensRef.current.get(id) ?? 0) + 1;
        itemTokensRef.current.set(id, token);
        const current = elementsRef.current.get(id);
        queueMicrotask(() => {
          if (itemTokensRef.current.get(id) !== token) {
            return;
          }
          if (elementsRef.current.get(id) === current) {
            elementsRef.current.delete(id);
            bumpRegistry();
          }
        });
        return;
      }
      itemTokensRef.current.set(id, (itemTokensRef.current.get(id) ?? 0) + 1);
      if (elementsRef.current.get(id) === element) {
        return;
      }
      elementsRef.current.set(id, element);
      bumpRegistry();
    },
    [bumpRegistry],
  );

  const registry = useMemo(
    () => ({
      registerContainer,
      registerItem,
    }),
    [registerContainer, registerItem],
  );

  const replan = useCallback(async () => {
    const session = sessionRef.current;
    if (session === null) {
      return;
    }
    await session.replan();
  }, []);

  const sessionCommands = useMemo(() => ({ replan }), [replan]);

  const itemIds = itemsSignature(props.items);
  const desiredKey = JSON.stringify(props.desiredPlacements ?? null);
  const plannerConfigured = props.planner !== undefined;

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }
    const descriptors = [];
    for (const item of itemsRef.current) {
      const element = elementsRef.current.get(item.id);
      if (element === undefined) {
        return;
      }
      descriptors.push({
        id: item.id,
        element,
        ...(item.constraints !== undefined ? { constraints: item.constraints } : {}),
      });
    }
    if (descriptors.length === 0) {
      return;
    }

    const desiredChanged =
      lastDesiredKeyRef.current !== undefined && lastDesiredKeyRef.current !== desiredKey;
    lastDesiredKeyRef.current = desiredKey;
    // Explicit-only: omit previous when desiredPlacements change so ADR-0010
    // cannot suppress new author intent. Auto-Layout: keep previous so removed
    // Source Intent items can retain as generated; the session omits solver
    // previous on non-passive Source Intent cycles.
    const previous = desiredChanged && props.autoLayout !== true ? undefined : previousRef.current;

    const session = createLayoutSession({
      container,
      items: descriptors,
      desiredPlacements: desiredRef.current,
      ...(props.autoLayout === true ? { autoLayout: true } : {}),
      previous,
      mechanics: props.mechanics,
      ResizeObserver: props.ResizeObserver,
      ...(plannerConfigured
        ? {
            planner: (snapshot, context) => {
              const current = plannerRef.current;
              if (current === undefined) {
                return { automaticItemOrder: [] };
              }
              return current(snapshot, context);
            },
            onPlannerEvent: (event) => {
              onPlannerEventRef.current?.(event);
            },
          }
        : {}),
      onChange: (next) => {
        previousRef.current = next.resolved;
        onChangeRef.current?.(next);
        setState(next);
      },
      onDrop: (event) => {
        onDropRef.current?.(event);
      },
      onCancel: (event) => {
        onCancelRef.current?.(event);
      },
    });
    sessionRef.current = session;
    const initial = session.getState();
    previousRef.current = initial.resolved;
    setState(initial);
    return () => {
      sessionRef.current = null;
      session.dispose();
    };
  }, [
    registryGeneration,
    itemIds,
    desiredKey,
    props.autoLayout,
    props.mechanics,
    props.ResizeObserver,
    plannerConfigured,
  ]);

  return (
    <DnDGemRegistryContext.Provider value={registry}>
      <DnDGemSessionCommandsContext.Provider value={sessionCommands}>
        <DnDGemStateContext.Provider value={state}>{props.children}</DnDGemStateContext.Provider>
      </DnDGemSessionCommandsContext.Provider>
    </DnDGemRegistryContext.Provider>
  );
}
