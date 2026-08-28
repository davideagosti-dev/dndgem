import { computed, inject } from 'vue';
import { layoutPlacementStyle, type LayoutSessionState } from '@dndgem/dom';
import {
  DnDGemRegistryKey,
  DnDGemSessionCommandsKey,
  DnDGemStateKey,
  type DnDGemRegistry,
} from './context.js';
import { unwrapElement } from './elements.js';
import type { DnDGemItemBinding, DnDGemStore } from './types.js';

function requireRegistry(composable: string): DnDGemRegistry {
  const registry = inject(DnDGemRegistryKey);
  if (registry === undefined) {
    throw new Error(`${composable} must be used within a DnDGemProvider`);
  }
  return registry;
}

function placementStyle(
  id: string,
  state: LayoutSessionState | undefined,
): ReturnType<typeof layoutPlacementStyle> | Record<string, never> {
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
  const registry = inject(DnDGemRegistryKey);
  const state = inject(DnDGemStateKey);
  const commands = inject(DnDGemSessionCommandsKey);
  if (registry === undefined || state === undefined || commands === undefined) {
    throw new Error('useDnDGem must be used within a DnDGemProvider');
  }
  return {
    state,
    ready: computed(() => state.value !== undefined),
    replan: commands.replan,
  };
}

export function useDnDGemContainer(): (element: unknown) => void {
  const registry = requireRegistry('useDnDGemContainer');
  return (element: unknown) => {
    registry.registerContainer(unwrapElement(element));
  };
}

export function useDnDGemItem(id: string): DnDGemItemBinding {
  const registry = requireRegistry('useDnDGemItem');
  const state = inject(DnDGemStateKey);
  if (state === undefined) {
    throw new Error('useDnDGemItem must be used within a DnDGemProvider');
  }
  return {
    ref: (element: unknown) => {
      registry.registerItem(id, unwrapElement(element));
    },
    style: computed(() => placementStyle(id, state.value)),
  };
}
