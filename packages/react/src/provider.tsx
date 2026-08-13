import { useCallback, useLayoutEffect, useMemo, useRef, useState, type JSX } from 'react';
import type { ResolvedLayout } from '@dndgem/core';
import { createLayoutSession, type LayoutSessionState } from '@dndgem/dom';
import { DnDGemRegistryContext, DnDGemStateContext } from './context.js';
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

  const itemIds = itemsSignature(props.items);
  const desiredKey = JSON.stringify(props.desiredPlacements ?? null);

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
    const previous = desiredChanged ? undefined : previousRef.current;

    const session = createLayoutSession({
      container,
      items: descriptors,
      desiredPlacements: desiredRef.current,
      previous,
      mechanics: props.mechanics,
      ResizeObserver: props.ResizeObserver,
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
    const initial = session.getState();
    previousRef.current = initial.resolved;
    setState(initial);
    return () => {
      session.dispose();
    };
  }, [registryGeneration, itemIds, desiredKey, props.mechanics, props.ResizeObserver]);

  return (
    <DnDGemRegistryContext.Provider value={registry}>
      <DnDGemStateContext.Provider value={state}>{props.children}</DnDGemStateContext.Provider>
    </DnDGemRegistryContext.Provider>
  );
}
