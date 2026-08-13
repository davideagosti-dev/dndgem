import {
  createLayoutIntent,
  createPoint,
  createRect,
  itemIdToString,
  solveLayout,
  type LayoutIntent,
  type LayoutItem,
  type LayoutItemInput,
  type Point,
  type Rect,
  type ResolvedLayout,
  type SolverResult,
} from '@dndgem/core';
import { DomAdapterError } from './errors.js';
import {
  observeLayout,
  type DomMeasurementObserver,
  type ResizeObserverConstructor,
} from './observe.js';
import type { DomMeasurementSnapshot } from './measure.js';
import { dndKitMechanicsAdapter } from './dnd-kit-mechanics.js';

/**
 * Vendor-neutral cumulative translation in the same CSS-pixel client space
 * as `getBoundingClientRect()` (ADR-0011). Container-relative proposal:
 *
 * ```text
 * x = baseline.x + translation.x
 * y = baseline.y + translation.y
 * ```
 *
 * Client deltas equal container-relative deltas while the container origin
 * is held from the drag-start measurement snapshot.
 */
export interface DragTranslation {
  readonly x: number;
  readonly y: number;
}

export type DragPhase = 'idle' | 'dragging';

/**
 * Proposed desired placement for the active item — not a resolved layout.
 */
export interface DragProposal {
  readonly itemId: string;
  readonly translation: Point;
  readonly desiredPlacement: Rect;
  readonly intent: LayoutIntent;
  readonly preview: SolverResult;
}

export interface DragDropResult {
  readonly accepted: boolean;
  readonly itemId: string;
  /** Authoritative intent after this drop (previous intent when rejected). */
  readonly intent: LayoutIntent;
  /** Authoritative resolved layout after this drop (previous when rejected). */
  readonly resolved?: ResolvedLayout;
  /** Solver output for the proposed intent (surfaced even when rejected). */
  readonly solver: SolverResult;
  readonly previousIntent: LayoutIntent;
  readonly previousResolved?: ResolvedLayout;
}

export interface DragInteractionState {
  readonly phase: DragPhase;
  readonly activeItemId?: string;
  readonly proposal?: DragProposal;
  readonly lastDrop?: DragDropResult;
}

export interface DragStartEvent {
  readonly itemId: string;
  readonly baseline: Rect;
}

export interface DragProposalEvent {
  readonly proposal: DragProposal;
}

export interface DragDropEvent {
  readonly result: DragDropResult;
}

export interface DragCancelEvent {
  readonly itemId: string;
}

export interface DragPointerStart {
  readonly itemId: string;
}

export interface DragPointerMove {
  readonly itemId: string;
  readonly translation: DragTranslation;
}

export interface DragPointerEnd {
  readonly itemId: string;
  readonly translation: DragTranslation;
}

export interface DragPointerCancel {
  readonly itemId: string;
}

/**
 * DnDGem-owned replaceable mechanics seam (ADR-0004).
 * Must not carry dnd-kit types.
 */
export interface DragMechanicsContext {
  readonly container: HTMLElement;
  readonly items: Readonly<Record<string, HTMLElement>>;
  readonly onStart: (input: DragPointerStart) => void;
  readonly onMove: (input: DragPointerMove) => void;
  readonly onDrop: (input: DragPointerEnd) => void;
  readonly onCancel: (input: DragPointerCancel) => void;
}

export interface DragMechanicsSession {
  readonly dispose: () => void;
}

export interface DragMechanicsAdapter {
  readonly connect: (context: DragMechanicsContext) => DragMechanicsSession;
}

export interface DragInteractionInput {
  readonly container: HTMLElement;
  readonly items: Readonly<Record<string, HTMLElement>>;
  readonly intent: LayoutIntent;
  readonly previous?: ResolvedLayout;
  readonly onStart?: (event: DragStartEvent) => void;
  readonly onProposal?: (event: DragProposalEvent) => void;
  readonly onDrop?: (event: DragDropEvent) => void;
  readonly onCancel?: (event: DragCancelEvent) => void;
  readonly ResizeObserver?: ResizeObserverConstructor;
  /**
   * Optional replaceable drag mechanics. Defaults to the internal @dnd-kit/dom
   * adapter. Inject a fake in unit tests; never required by DND-1.7 consumers.
   */
  readonly mechanics?: DragMechanicsAdapter;
}

export interface DragInteraction {
  readonly getState: () => DragInteractionState;
  readonly dispose: () => void;
}

interface ActiveDrag {
  readonly itemId: string;
  readonly baseline: Rect;
  translation: Point;
  proposal: DragProposal;
}

function assertInteractionInput(input: DragInteractionInput): void {
  if (input === null || typeof input !== 'object') {
    throw new DomAdapterError(
      'INVALID_INTERACTION_INPUT',
      'DragInteractionInput must be an object',
    );
  }
  if (input.intent === null || typeof input.intent !== 'object') {
    throw new DomAdapterError('INVALID_INTERACTION_INPUT', 'intent is required');
  }
  if (!Array.isArray(input.intent.items)) {
    throw new DomAdapterError('INVALID_INTERACTION_INPUT', 'intent.items must be an array');
  }
  if (
    input.previous !== undefined &&
    (input.previous === null || typeof input.previous !== 'object')
  ) {
    throw new DomAdapterError(
      'INVALID_INTERACTION_INPUT',
      'previous must be a ResolvedLayout when provided',
    );
  }
  if (input.mechanics !== undefined) {
    if (
      input.mechanics === null ||
      typeof input.mechanics !== 'object' ||
      typeof input.mechanics.connect !== 'function'
    ) {
      throw new DomAdapterError(
        'INVALID_INTERACTION_INPUT',
        'mechanics.connect must be a function',
      );
    }
  }
}

function intentItemKeys(intent: LayoutIntent): ReadonlySet<string> {
  return new Set(intent.items.map((item) => itemIdToString(item.id)));
}

function toItemInputs(items: readonly LayoutItem[]): LayoutItemInput[] {
  return items.map((item) => {
    const input: LayoutItemInput = {
      id: itemIdToString(item.id),
      constraints: { ...item.constraints },
      ...(item.measuredSize !== undefined
        ? {
            measuredSize: {
              width: item.measuredSize.width,
              height: item.measuredSize.height,
            },
          }
        : {}),
    };
    return input;
  });
}

function cloneDesired(desired: Readonly<Record<string, Rect>> | undefined): Record<string, Rect> {
  if (desired === undefined) {
    return {};
  }
  const next: Record<string, Rect> = {};
  for (const key of Object.keys(desired)) {
    const rect = desired[key];
    if (rect !== undefined) {
      next[key] = rect;
    }
  }
  return next;
}

/**
 * Seed sibling desired placements from the last committed layout.
 *
 * Order is deliberate: previous resolved (authoritative output) before stale
 * author desired, then the current measurement snapshot. Intent item
 * declaration order is the only semantic iteration order.
 */
function seedPlacements(
  intent: LayoutIntent,
  snapshot: DomMeasurementSnapshot,
  previous: ResolvedLayout | undefined,
): Record<string, Rect> {
  const seeded: Record<string, Rect> = {};
  const originalDesired = cloneDesired(intent.desiredPlacements);
  for (const item of intent.items) {
    const key = itemIdToString(item.id);
    const fromPrevious = previous?.placements[key];
    if (fromPrevious !== undefined) {
      seeded[key] = fromPrevious;
      continue;
    }
    const fromDesired = originalDesired[key];
    if (fromDesired !== undefined) {
      seeded[key] = fromDesired;
      continue;
    }
    const fromSnapshot = snapshot.measurements[key];
    if (fromSnapshot !== undefined) {
      seeded[key] = fromSnapshot;
    }
  }
  return seeded;
}

function proposePlacement(baseline: Rect, translation: Point): Rect {
  return createRect({
    x: baseline.x + translation.x,
    y: baseline.y + translation.y,
    width: baseline.width,
    height: baseline.height,
  });
}

function readTranslation(input: DragTranslation): Point {
  return createPoint(input.x, input.y);
}

function isAcceptableSolverResult(result: SolverResult): boolean {
  return result.evaluation.state === 'VALID' || result.evaluation.state === 'DEGRADED';
}

function freezeProposal(proposal: DragProposal): DragProposal {
  return Object.freeze({
    itemId: proposal.itemId,
    translation: proposal.translation,
    desiredPlacement: proposal.desiredPlacement,
    intent: proposal.intent,
    preview: proposal.preview,
  });
}

function freezeDropResult(result: DragDropResult): DragDropResult {
  const frozen: {
    -readonly [K in keyof DragDropResult]?: DragDropResult[K];
  } = {
    accepted: result.accepted,
    itemId: result.itemId,
    intent: result.intent,
    solver: result.solver,
    previousIntent: result.previousIntent,
  };
  if (result.resolved !== undefined) {
    frozen.resolved = result.resolved;
  }
  if (result.previousResolved !== undefined) {
    frozen.previousResolved = result.previousResolved;
  }
  return Object.freeze(frozen) as DragDropResult;
}

function freezeState(state: DragInteractionState): DragInteractionState {
  const frozen: {
    -readonly [K in keyof DragInteractionState]?: DragInteractionState[K];
  } = {
    phase: state.phase,
  };
  if (state.activeItemId !== undefined) {
    frozen.activeItemId = state.activeItemId;
  }
  if (state.proposal !== undefined) {
    frozen.proposal = state.proposal;
  }
  if (state.lastDrop !== undefined) {
    frozen.lastDrop = state.lastDrop;
  }
  return Object.freeze(frozen) as DragInteractionState;
}

function buildProposedIntent(
  intent: LayoutIntent,
  snapshot: DomMeasurementSnapshot,
  previous: ResolvedLayout | undefined,
  itemId: string,
  desiredPlacement: Rect,
): LayoutIntent {
  const desired = seedPlacements(intent, snapshot, previous);
  desired[itemId] = desiredPlacement;
  return createLayoutIntent({
    space: snapshot.space,
    items: toItemInputs(intent.items),
    desiredPlacements: desired,
  });
}

function solveProposed(intent: LayoutIntent): SolverResult {
  // ADR-0010 ranks validity → score → stability vs `previous` → ordinal.
  // Passing the last commit as Core `previous` would generate preserve-previous
  // with stabilityDistance 0, which beats an equally valid preserve-desired
  // that contains the user's new placement. Interaction therefore omits
  // `previous` and encodes sibling stability by seeding their last committed
  // placements into desiredPlacements (preserve-desired keeps them put).
  return solveLayout({ intent });
}

/**
 * Create a vendor-isolated drag interaction bound to a container and item map.
 *
 * Drag mechanics (default: @dnd-kit/dom) produce a translation. DnDGem turns
 * that into a container-relative `LayoutIntent` proposal and asks Core
 * `solveLayout` whether to accept, reflow, or reject.
 */
export function createDragInteraction(input: DragInteractionInput): DragInteraction {
  assertInteractionInput(input);

  const onStart = input.onStart;
  const onProposal = input.onProposal;
  const onDrop = input.onDrop;
  const onCancel = input.onCancel;
  const mechanics = input.mechanics ?? dndKitMechanicsAdapter;

  const items = Object.freeze({ ...input.items });
  const intentItemIds = intentItemKeys(input.intent);

  let disposed = false;
  let latestSnapshot: DomMeasurementSnapshot | undefined;
  let authoritativeIntent = input.intent;
  let authoritativeResolved = input.previous;
  let active: ActiveDrag | undefined;
  let lastDrop: DragDropResult | undefined;
  let observer: DomMeasurementObserver | undefined;
  let session: DragMechanicsSession | undefined;

  const emitProposal = (proposal: DragProposal): void => {
    if (disposed) {
      return;
    }
    onProposal?.({ proposal });
  };

  const buildProposal = (itemId: string, baseline: Rect, translation: Point): DragProposal => {
    if (latestSnapshot === undefined) {
      throw new DomAdapterError('INVALID_INTERACTION_INPUT', 'measurement snapshot is required');
    }
    const desiredPlacement = proposePlacement(baseline, translation);
    const proposedIntent = buildProposedIntent(
      authoritativeIntent,
      latestSnapshot,
      authoritativeResolved,
      itemId,
      desiredPlacement,
    );
    const preview = solveProposed(proposedIntent);
    return freezeProposal({
      itemId,
      translation,
      desiredPlacement,
      intent: proposedIntent,
      preview,
    });
  };

  const requireItem = (itemId: string): void => {
    if (typeof itemId !== 'string' || itemId.length === 0 || itemId.trim().length === 0) {
      throw new DomAdapterError('INVALID_ITEM_ID', 'Item id must be a non-empty string');
    }
    if (!intentItemIds.has(itemId)) {
      throw new DomAdapterError(
        'UNKNOWN_ITEM',
        `Item "${itemId}" is not present in the LayoutIntent`,
      );
    }
    if (items[itemId] === undefined) {
      throw new DomAdapterError('UNKNOWN_ITEM', `Item "${itemId}" is not mapped to a DOM element`);
    }
  };

  const handleStart = (itemId: string): void => {
    if (disposed) {
      return;
    }
    requireItem(itemId);
    if (latestSnapshot === undefined) {
      throw new DomAdapterError('INVALID_INTERACTION_INPUT', 'measurement snapshot is required');
    }
    const baseline = latestSnapshot.measurements[itemId];
    if (baseline === undefined) {
      throw new DomAdapterError('ITEM_UNAVAILABLE', `Item "${itemId}" has no current measurement`);
    }
    const translation = createPoint(0, 0);
    const proposal = buildProposal(itemId, baseline, translation);
    active = { itemId, baseline, translation, proposal };
    lastDrop = undefined;
    onStart?.({ itemId, baseline });
    emitProposal(proposal);
  };

  const handleMove = (itemId: string, translationInput: DragTranslation): void => {
    if (disposed) {
      return;
    }
    if (active === undefined || active.itemId !== itemId) {
      handleStart(itemId);
    }
    if (active === undefined) {
      return;
    }
    const translation = readTranslation(translationInput);
    const proposal = buildProposal(itemId, active.baseline, translation);
    active.translation = translation;
    active.proposal = proposal;
    emitProposal(proposal);
  };

  const clearActive = (): void => {
    active = undefined;
  };

  const handleDrop = (itemId: string, translationInput: DragTranslation): void => {
    if (disposed) {
      return;
    }
    if (active === undefined || active.itemId !== itemId) {
      handleStart(itemId);
    }
    if (active === undefined) {
      return;
    }
    const translation = readTranslation(translationInput);
    const proposal = buildProposal(itemId, active.baseline, translation);
    const previousIntent = authoritativeIntent;
    const previousResolved = authoritativeResolved;
    const solver = proposal.preview;
    const accepted = isAcceptableSolverResult(solver);

    const result = freezeDropResult({
      accepted,
      itemId,
      intent: accepted ? proposal.intent : previousIntent,
      resolved: accepted ? solver.resolved : previousResolved,
      solver,
      previousIntent,
      previousResolved,
    });

    if (accepted) {
      authoritativeIntent = proposal.intent;
      authoritativeResolved = solver.resolved;
    }

    lastDrop = result;
    clearActive();
    onDrop?.({ result });
  };

  const handleCancel = (itemId: string): void => {
    if (disposed) {
      return;
    }
    if (active === undefined) {
      return;
    }
    if (active.itemId !== itemId) {
      return;
    }
    clearActive();
    onCancel?.({ itemId });
  };

  observer = observeLayout({
    container: input.container,
    items,
    onMeasure: (snapshot) => {
      if (disposed) {
        return;
      }
      latestSnapshot = snapshot;
      if (active === undefined) {
        return;
      }
      const proposal = buildProposal(active.itemId, active.baseline, active.translation);
      active.proposal = proposal;
      emitProposal(proposal);
    },
    ResizeObserver: input.ResizeObserver,
  });

  try {
    session = mechanics.connect({
      container: input.container,
      items,
      onStart: (event) => {
        handleStart(event.itemId);
      },
      onMove: (event) => {
        handleMove(event.itemId, event.translation);
      },
      onDrop: (event) => {
        handleDrop(event.itemId, event.translation);
      },
      onCancel: (event) => {
        handleCancel(event.itemId);
      },
    });
  } catch (error) {
    observer.dispose();
    if (error instanceof DomAdapterError) {
      throw error;
    }
    throw new DomAdapterError(
      'PROVIDER_UNAVAILABLE',
      'Drag mechanics adapter failed to connect in this environment',
    );
  }

  return {
    getState(): DragInteractionState {
      if (disposed) {
        throw new DomAdapterError(
          'INTERACTION_DISPOSED',
          'Cannot read state from a disposed drag interaction',
        );
      }
      if (active !== undefined) {
        return freezeState({
          phase: 'dragging',
          activeItemId: active.itemId,
          proposal: active.proposal,
          lastDrop,
        });
      }
      return freezeState({
        phase: 'idle',
        lastDrop,
      });
    },
    dispose(): void {
      if (disposed) {
        return;
      }
      disposed = true;
      active = undefined;
      lastDrop = undefined;
      latestSnapshot = undefined;
      session?.dispose();
      session = undefined;
      observer?.dispose();
      observer = undefined;
    },
  };
}
