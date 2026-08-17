import type { InjectionKey, ShallowRef } from 'vue';
import type { LayoutSessionState } from '@dndgem/dom';

export interface DnDGemRegistry {
  readonly registerContainer: (element: HTMLElement | null) => void;
  readonly registerItem: (id: string, element: HTMLElement | null) => void;
}

export const DnDGemRegistryKey: InjectionKey<DnDGemRegistry> = Symbol('dndgem.registry');

export const DnDGemStateKey: InjectionKey<ShallowRef<LayoutSessionState | undefined>> =
  Symbol('dndgem.state');
