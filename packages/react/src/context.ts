import { createContext } from 'react';
import type { LayoutSessionState } from '@dndgem/dom';

export interface DnDGemRegistry {
  readonly registerContainer: (element: HTMLElement | null) => void;
  readonly registerItem: (id: string, element: HTMLElement | null) => void;
}

export const DnDGemRegistryContext = createContext<DnDGemRegistry | null>(null);

export const DnDGemStateContext = createContext<LayoutSessionState | undefined>(undefined);
