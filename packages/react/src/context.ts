import { createContext } from 'react';
import type { LayoutSessionState } from '@dndgem/dom';

export interface DnDGemRegistry {
  readonly registerContainer: (element: HTMLElement | null) => void;
  readonly registerItem: (id: string, element: HTMLElement | null) => void;
}

export interface DnDGemSessionCommands {
  readonly replan: () => Promise<void>;
}

export const DnDGemRegistryContext = createContext<DnDGemRegistry | null>(null);

export const DnDGemStateContext = createContext<LayoutSessionState | undefined>(undefined);

export const DnDGemSessionCommandsContext = createContext<DnDGemSessionCommands | null>(null);
