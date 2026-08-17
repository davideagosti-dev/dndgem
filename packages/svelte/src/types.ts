import type { Snippet } from 'svelte';
import type { Action } from 'svelte/action';
import type { Readable } from 'svelte/store';
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

/**
 * Board configuration owned by `DnDGemProvider`.
 * Mirrors DOM `createLayoutSession` inputs that the adapter is allowed to pass through.
 */
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
  readonly onChange?: (state: LayoutSessionState) => void;
  readonly onDrop?: (event: { readonly result: DragDropResult }) => void;
  readonly onCancel?: (event: DragCancelEvent) => void;
  readonly ResizeObserver?: ResizeObserverConstructor;
  /**
   * Optional replaceable drag mechanics. Defaults to the DOM package provider.
   * Inject a fake in tests; not required by application consumers.
   */
  readonly mechanics?: DragMechanicsAdapter;
  /**
   * Board content. Rendered with no wrapper DOM.
   * Snippet arguments bind host actions and expose session state as plain values.
   */
  readonly children: Snippet<[DnDGemSnippetProps]>;
}

export interface DnDGemSnippetProps {
  readonly state: LayoutSessionState | undefined;
  readonly ready: boolean;
  readonly dndgemContainer: Action<HTMLElement>;
  readonly dndgemItem: Action<HTMLElement, string>;
}

export interface DnDGemStore {
  readonly state: Readable<LayoutSessionState | undefined>;
  readonly ready: Readable<boolean>;
}
