import type { ContentConstraintsInput, RectInput } from '@dndgem/core';
import type {
  DragCancelEvent,
  DragDropResult,
  DragMechanicsAdapter,
  LayoutSessionPlanner,
  LayoutSessionPlannerEvent,
  LayoutSessionState,
  ResizeObserverConstructor,
} from '@dndgem/dom';

export interface DnDGemItemConfig {
  readonly id: string;
  readonly constraints?: ContentConstraintsInput;
}

/**
 * Board configuration owned by `dndgemBoard`.
 * Mirrors DOM `createLayoutSession` inputs that the adapter is allowed to pass through.
 */
export interface DnDGemBoardConfig {
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
   * Invoked only via {@link DnDGemBoard.replan} — never on hot paths.
   */
  readonly planner?: LayoutSessionPlanner;
  readonly ResizeObserver?: ResizeObserverConstructor;
  /**
   * Optional replaceable drag mechanics. Defaults to the DOM package provider.
   * Inject a fake in tests; not required by application consumers.
   */
  readonly mechanics?: DragMechanicsAdapter;
}

export interface DnDGemBoardCallbacks {
  readonly onChange?: (state: LayoutSessionState) => void;
  readonly onDrop?: (event: { readonly result: DragDropResult }) => void;
  readonly onCancel?: (event: DragCancelEvent) => void;
  /**
   * Optional planner lifecycle callback (separate from Core validity).
   */
  readonly onPlannerEvent?: (event: LayoutSessionPlannerEvent) => void;
}
