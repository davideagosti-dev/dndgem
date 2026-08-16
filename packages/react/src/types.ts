import type { CSSProperties, ReactNode } from 'react';
import type { ContentConstraintsInput, RectInput } from '@dndgem/core';
import type {
  DragCancelEvent,
  DragDropResult,
  DragMechanicsAdapter,
  LayoutSessionState,
  ResizeObserverConstructor,
} from '@dndgem/dom';

export interface DnDGemItemConfig {
  readonly id: string;
  readonly constraints?: ContentConstraintsInput;
}

export interface DnDGemProviderProps {
  readonly items: readonly DnDGemItemConfig[];
  /**
   * Source Intent placements. With `autoLayout`, may be partial or omitted.
   * Without Auto-Layout (default), supply complete desired rectangles as today.
   */
  readonly desiredPlacements?: Readonly<Record<string, RectInput>>;
  /**
   * Opt-in Auto-Layout (default off). Mirrors `createLayoutSession({ autoLayout })`.
   */
  readonly autoLayout?: boolean;
  readonly children: ReactNode;
  readonly onChange?: (state: LayoutSessionState) => void;
  readonly onDrop?: (event: { readonly result: DragDropResult }) => void;
  readonly onCancel?: (event: DragCancelEvent) => void;
  readonly ResizeObserver?: ResizeObserverConstructor;
  /**
   * Optional replaceable drag mechanics. Defaults to the DOM package provider.
   * Inject a fake in tests; not required by application consumers.
   */
  readonly mechanics?: DragMechanicsAdapter;
}

export interface DnDGemItemBinding {
  readonly ref: (element: HTMLElement | null) => void;
  /**
   * Layout-owned style (`position`, `left`, `top`, `width`, `height`, `boxSizing`).
   * Merge after consumer visual styles so DnDGem wins those properties:
   * `style={{ color: '...', ...item.style }}`.
   */
  readonly style: CSSProperties;
}

export interface DnDGemStore {
  readonly state: LayoutSessionState | undefined;
  readonly ready: boolean;
}
