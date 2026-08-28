import { useCallback, useContext, type CSSProperties } from 'react';
import { layoutPlacementStyle, type LayoutSessionState } from '@dndgem/dom';
import {
  DnDGemRegistryContext,
  DnDGemSessionCommandsContext,
  DnDGemStateContext,
} from './context.js';
import type { DnDGemItemBinding, DnDGemStore } from './types.js';

function placementStyle(id: string, state: LayoutSessionState | undefined): CSSProperties {
  if (state === undefined) {
    return {};
  }
  const fromPreview =
    state.proposal !== undefined && state.proposal.itemId !== id
      ? state.proposal.preview.resolved.placements[id]
      : undefined;
  const rect = fromPreview ?? state.resolved.placements[id];
  if (rect === undefined) {
    return {};
  }
  return layoutPlacementStyle(rect);
}

export function useDnDGem(): DnDGemStore {
  const registry = useContext(DnDGemRegistryContext);
  const state = useContext(DnDGemStateContext);
  const commands = useContext(DnDGemSessionCommandsContext);
  if (registry === null || commands === null) {
    throw new Error('useDnDGem must be used within a DnDGemProvider');
  }
  return {
    state,
    ready: state !== undefined,
    replan: commands.replan,
  };
}

export function useDnDGemContainer(): (element: HTMLElement | null) => void {
  const registry = useContext(DnDGemRegistryContext);
  if (registry === null) {
    throw new Error('useDnDGemContainer must be used within a DnDGemProvider');
  }
  return registry.registerContainer;
}

export function useDnDGemItem(id: string): DnDGemItemBinding {
  const registry = useContext(DnDGemRegistryContext);
  const state = useContext(DnDGemStateContext);
  if (registry === null) {
    throw new Error('useDnDGemItem must be used within a DnDGemProvider');
  }
  const ref = useCallback(
    (element: HTMLElement | null) => {
      registry.registerItem(id, element);
    },
    [id, registry],
  );
  return {
    ref,
    // Layout properties only. Merge after consumer visual styles.
    style: placementStyle(id, state),
  };
}
