import type { ComputedRef, ShallowRef } from 'vue';
import type { ContentConstraintsInput, RectInput } from '@dndgem/core';
import type {
  DragCancelEvent,
  DragDropResult,
  DragMechanicsAdapter,
  LayoutPlacementStyle,
  LayoutSessionPlanner,
  LayoutSessionPlannerEvent,
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
  /**
   * Optional advisory planner (DND-4.3). Pass-through to DOM session.
   * Invoked only via {@link DnDGemStore.replan} — never on hot paths.
   */
  readonly planner?: LayoutSessionPlanner;
  /**
   * Optional planner lifecycle callback (separate from Core validity).
   */
  readonly onPlannerEvent?: (event: LayoutSessionPlannerEvent) => void;
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
  /**
   * Function ref for the consumer host element (`:ref="item.ref"`).
   * Registration is synchronous during Vue's patch so the board can wait for
   * every declared item before creating the DOM session.
   */
  readonly ref: (element: unknown) => void;
  /**
   * Layout-owned style (`position`, `left`, `top`, `width`, `height`, `boxSizing`).
   * Merge after consumer visual styles so DnDGem wins those properties.
   * Templates unwrap the computed; render functions read `.value`.
   */
  readonly style: ComputedRef<LayoutPlacementStyle | Record<string, never>>;
}

export interface DnDGemStore {
  readonly state: ShallowRef<LayoutSessionState | undefined>;
  readonly ready: ComputedRef<boolean>;
  /**
   * Explicit advisory replan. Always returns a Promise (DND-4.3).
   */
  readonly replan: () => Promise<void>;
}
