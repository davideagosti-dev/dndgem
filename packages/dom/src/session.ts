import {
  createAutoLayoutProposal,
  createLayoutIntent,
  solveLayout,
  type ContentConstraintsInput,
  type LayoutIntent,
  type LayoutItemInput,
  type Rect,
  type RectInput,
  type ResolvedLayout,
  type SolverResult,
} from '@dndgem/core';
import { applyLayoutPlacements, prepareLayoutContainer } from './apply.js';
import { DomAdapterError } from './errors.js';
import {
  createDragInteraction,
  type DragCancelEvent,
  type DragDropResult,
  type DragInteraction,
  type DragMechanicsAdapter,
  type DragPhase,
  type DragProposal,
} from './interaction.js';
import { measureLayout, snapshotsEqual, type DomMeasurementSnapshot } from './measure.js';
import type { ResizeObserverConstructor } from './observe.js';

export interface LayoutSessionItemInput {
  readonly id: string;
  readonly element: HTMLElement;
  readonly constraints?: ContentConstraintsInput;
}

/**
 * Opt-in Auto-Layout session state (DND-3.4).
 * Present only when `autoLayout: true` was supplied to {@link createLayoutSession}.
 *
 * `proposalUnplacedItemIds` lists automatic items for which the Core Auto-Layout
 * **proposal** layer found no non-overlapping placement. This is proposal
 * completeness metadata only — not solver INVALID, and not “absent from
 * {@link ResolvedLayout}” (the solver may still place those items independently).
 */
export interface LayoutSessionAutoLayoutState {
  readonly enabled: true;
  readonly proposalUnplacedItemIds: readonly string[];
}

/**
 * Structural planning snapshot accepted by an optional session planner.
 * Compatible with `@dndgem/intelligence` PlanningSnapshot without importing it.
 */
export interface LayoutSessionPlanningSnapshot {
  readonly intent: LayoutIntent;
  readonly previous?: ResolvedLayout;
  readonly prominence?: Readonly<Record<string, number>>;
}

/**
 * Invoke-time planner context. AbortSignal is runtime-only (not serializable).
 */
export interface LayoutSessionPlannerContext {
  readonly requestId: number;
  readonly signal?: AbortSignal;
}

/**
 * Advisory planner output consumed by the session (automatic-item order only).
 */
export interface LayoutSessionPlanningProposal {
  readonly automaticItemOrder: readonly string[];
}

/**
 * Optional provider-neutral planner injected into the DOM session (DND-4.3).
 * Sync or async. DOM does not depend on `@dndgem/intelligence`.
 */
export type LayoutSessionPlanner = (
  snapshot: LayoutSessionPlanningSnapshot,
  context?: LayoutSessionPlannerContext,
) => LayoutSessionPlanningProposal | Promise<LayoutSessionPlanningProposal>;

/**
 * Optional planner lifecycle events. Distinct from Core VALID / DEGRADED / INVALID.
 */
export type LayoutSessionPlannerStatus =
  'planning' | 'applied' | 'fallback' | 'cancelled' | 'stale' | 'error';

export interface LayoutSessionPlannerEvent {
  readonly requestId: number;
  readonly status: LayoutSessionPlannerStatus;
  readonly proposalSource?: 'custom' | 'declaration';
  readonly fallbackReason?: 'planner-throw' | 'cancelled';
}

export interface LayoutSessionState {
  readonly intent: LayoutIntent;
  readonly resolved: ResolvedLayout;
  readonly solver: SolverResult;
  readonly phase: DragPhase;
  readonly activeItemId?: string;
  readonly proposal?: DragProposal;
  readonly lastDrop?: DragDropResult;
  readonly autoLayout?: LayoutSessionAutoLayoutState;
}

export interface LayoutSessionInput {
  readonly container: HTMLElement;
  readonly items: readonly LayoutSessionItemInput[];
  /**
   * Source Intent placements. With `autoLayout: true`, may be partial or omitted;
   * remaining items are placed automatically. With Auto-Layout off (default),
   * the existing explicit seeding path requires complete geometry via this map,
   * previous layout, or measurement.
   */
  readonly desiredPlacements?: Readonly<Record<string, RectInput>>;
  /**
   * Opt-in Auto-Layout (default `false`). When enabled, the session retains
   * Source Intent separately from generated placements and composes
   * `createAutoLayoutProposal` → `solveLayout`.
   */
  readonly autoLayout?: boolean;
  /**
   * Optional advisory layout planner (DND-4.3). Invoked only by explicit
   * {@link LayoutSession.replan} — never from pointermove, drag preview,
   * ResizeObserver, passive resize, accepted drop, or every solve.
   *
   * When omitted, `replan()` recomposes with Phase 3 declaration-order Auto-Layout.
   * Initial layout always uses Phase 3 declaration order (planner never blocks first paint).
   */
  readonly planner?: LayoutSessionPlanner;
  /**
   * Optional planner lifecycle callback (separate from Core validity).
   */
  readonly onPlannerEvent?: (event: LayoutSessionPlannerEvent) => void;
  /**
   * Optional last committed layout for *continuation* solves (constraint
   * updates, remount, idle resize after the first commit).
   *
   * Omit this when the caller is supplying a new explicit author
   * `desiredPlacements` (initial mount or an external intent change). Passing
   * `previous` in that case lets ADR-0010 `preserve-previous` suppress the new
   * desired placement — the same class of bug DND-1.6 avoided for drag.
   *
   * With `autoLayout: true`, `previous` is a stability signal for the Core
   * proposal (and for passive resize solves). It is never treated as Source Intent.
   *
   * Never supplied on the drag proposal path (`createDragInteraction`).
   */
  readonly previous?: ResolvedLayout;
  readonly onChange?: (state: LayoutSessionState) => void;
  readonly onDrop?: (event: { readonly result: DragDropResult }) => void;
  readonly onCancel?: (event: DragCancelEvent) => void;
  readonly ResizeObserver?: ResizeObserverConstructor;
  /**
   * Optional replaceable drag mechanics. Defaults to the internal provider.
   * Inject a fake in unit tests; not required by Vanilla/React consumers.
   */
  readonly mechanics?: DragMechanicsAdapter;
}

export interface LayoutSession {
  readonly getState: () => LayoutSessionState;
  /**
   * Explicit advisory replan (DND-4.3). Always returns a Promise for a stable
   * consumer contract (sync planners resolve immediately).
   *
   * With no planner: Phase 3 declaration-order Auto-Layout recomposition.
   * With a planner: invoke → normalize via Core → solve → commit only if current.
   */
  readonly replan: () => Promise<void>;
  readonly dispose: () => void;
}

function assertSessionInput(input: LayoutSessionInput): void {
  if (input === null || typeof input !== 'object') {
    throw new DomAdapterError('INVALID_SESSION_INPUT', 'LayoutSessionInput must be an object');
  }
  if (input.container === null || input.container === undefined) {
    throw new DomAdapterError('MISSING_CONTAINER', 'container is required');
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new DomAdapterError('INVALID_SESSION_INPUT', 'items must be a non-empty array');
  }
  if (input.autoLayout !== undefined && typeof input.autoLayout !== 'boolean') {
    throw new DomAdapterError(
      'INVALID_SESSION_INPUT',
      'autoLayout must be a boolean when provided',
    );
  }
  if (input.planner !== undefined && typeof input.planner !== 'function') {
    throw new DomAdapterError('INVALID_SESSION_INPUT', 'planner must be a function when provided');
  }
  if (input.onPlannerEvent !== undefined && typeof input.onPlannerEvent !== 'function') {
    throw new DomAdapterError(
      'INVALID_SESSION_INPUT',
      'onPlannerEvent must be a function when provided',
    );
  }
}

function cloneRect(rect: Rect | RectInput): RectInput {
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}

function cloneDesiredMap(
  desired: Readonly<Record<string, RectInput>> | undefined,
): Record<string, RectInput> {
  if (desired === undefined) {
    return {};
  }
  const next: Record<string, RectInput> = {};
  for (const [key, rect] of Object.entries(desired)) {
    if (rect !== undefined) {
      next[key] = cloneRect(rect);
    }
  }
  return next;
}

function sourceDesiredKey(desired: Readonly<Record<string, RectInput>>): string {
  const keys = Object.keys(desired).sort();
  const normalized: Record<string, RectInput> = {};
  for (const key of keys) {
    const rect = desired[key];
    if (rect !== undefined) {
      normalized[key] = rect;
    }
  }
  return JSON.stringify(normalized);
}

function rectsEqual(a: Rect, b: Rect): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

function resolvedLayoutsEqual(a: ResolvedLayout, b: ResolvedLayout): boolean {
  if (a.space.width !== b.space.width || a.space.height !== b.space.height) {
    return false;
  }
  const aKeys = Object.keys(a.placements);
  const bKeys = Object.keys(b.placements);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  for (const key of aKeys) {
    const left = a.placements[key];
    const right = b.placements[key];
    if (left === undefined || right === undefined || !rectsEqual(left, right)) {
      return false;
    }
  }
  return true;
}

function freezeState(state: LayoutSessionState): LayoutSessionState {
  const frozen: {
    -readonly [K in keyof LayoutSessionState]?: LayoutSessionState[K];
  } = {
    intent: state.intent,
    resolved: state.resolved,
    solver: state.solver,
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
  if (state.autoLayout !== undefined) {
    frozen.autoLayout = Object.freeze({
      enabled: true as const,
      proposalUnplacedItemIds: Object.freeze([...state.autoLayout.proposalUnplacedItemIds]),
    });
  }
  return Object.freeze(frozen) as LayoutSessionState;
}

function toElementMap(
  items: readonly LayoutSessionItemInput[],
): Readonly<Record<string, HTMLElement>> {
  const elements: Record<string, HTMLElement> = {};
  const seen = new Set<string>();
  for (const item of items) {
    if (typeof item.id !== 'string' || item.id.length === 0 || item.id.trim().length === 0) {
      throw new DomAdapterError('INVALID_ITEM_ID', 'Item id must be a non-empty string');
    }
    if (seen.has(item.id)) {
      throw new DomAdapterError('DUPLICATE_ITEM_ID', `Duplicate session item id: "${item.id}"`);
    }
    seen.add(item.id);
    if (item.element === null || item.element === undefined) {
      throw new DomAdapterError('INVALID_ELEMENT', `items["${item.id}"] must be a DOM element`);
    }
    elements[item.id] = item.element;
  }
  return Object.freeze(elements);
}

function toItemInputs(
  descriptors: readonly LayoutSessionItemInput[],
  snapshot: DomMeasurementSnapshot,
): LayoutItemInput[] {
  return descriptors.map((item) => {
    const measured = snapshot.measurements[item.id];
    const input: LayoutItemInput = {
      id: item.id,
      ...(item.constraints !== undefined ? { constraints: { ...item.constraints } } : {}),
      ...(measured !== undefined
        ? { measuredSize: { width: measured.width, height: measured.height } }
        : {}),
    };
    return input;
  });
}

function seedDesiredPlacements(
  descriptors: readonly LayoutSessionItemInput[],
  snapshot: DomMeasurementSnapshot,
  originalDesired: Readonly<Record<string, RectInput>> | undefined,
  previous: ResolvedLayout | undefined,
): Record<string, RectInput> {
  const seeded: Record<string, RectInput> = {};
  for (const item of descriptors) {
    const fromPrevious = previous?.placements[item.id];
    if (fromPrevious !== undefined) {
      seeded[item.id] = cloneRect(fromPrevious);
      continue;
    }
    const fromDesired = originalDesired?.[item.id];
    if (fromDesired !== undefined) {
      seeded[item.id] = fromDesired;
      continue;
    }
    const fromSnapshot = snapshot.measurements[item.id];
    if (fromSnapshot !== undefined) {
      seeded[item.id] = cloneRect(fromSnapshot);
    }
  }
  return seeded;
}

function buildExplicitIntent(
  descriptors: readonly LayoutSessionItemInput[],
  snapshot: DomMeasurementSnapshot,
  originalDesired: Readonly<Record<string, RectInput>> | undefined,
  previous: ResolvedLayout | undefined,
): LayoutIntent {
  return createLayoutIntent({
    space: snapshot.space,
    items: toItemInputs(descriptors, snapshot),
    desiredPlacements: seedDesiredPlacements(descriptors, snapshot, originalDesired, previous),
  });
}

/**
 * Vanilla / shared integration: measure → solve → apply, then compose
 * `createDragInteraction` for drag preview and drop. React wraps this session;
 * it must not reimplement solving.
 *
 * Idle resize and constraint-continuation solves use
 * `solveLayout({ intent, previous })` so ADR-0010 stability can keep a
 * still-valid layout. Explicit author `desiredPlacements` (no `previous`) and
 * drag proposals stay on `solveLayout({ intent })` without Core `previous`.
 *
 * With `autoLayout: true`, the session owns Source Intent separately from
 * generated placements. Effective intent is never persisted as Source Intent.
 */
export function createLayoutSession(input: LayoutSessionInput): LayoutSession {
  assertSessionInput(input);

  const descriptors = Object.freeze([...input.items]);
  const elements = toElementMap(descriptors);
  const autoLayoutEnabled = input.autoLayout === true;
  const planner = input.planner;
  const onPlannerEvent = input.onPlannerEvent;
  /** Durable Source Intent — never overwritten by generated/effective geometry. */
  const sourceDesired = cloneDesiredMap(input.desiredPlacements);
  const originalDesired = input.desiredPlacements;
  const onChange = input.onChange;
  const onDrop = input.onDrop;
  const onCancel = input.onCancel;

  let disposed = false;
  let reconnecting = false;
  let interaction: DragInteraction | undefined;
  let lastSnapshot: DomMeasurementSnapshot | undefined;
  let committedIntent: LayoutIntent | undefined;
  let committedResolved: ResolvedLayout | undefined = input.previous;
  let committedSolver: SolverResult | undefined;
  let lastDrop: DragDropResult | undefined;
  let proposalUnplacedItemIds: readonly string[] = Object.freeze([]);
  let lastSourceKey = '';
  /** Last advisory automatic order from a successful replan (retained for idle recomposes). */
  let lastAutomaticItemOrder: readonly string[] | undefined;
  let plannerRequestId = 0;
  let activePlannerAbort: AbortController | undefined;

  const requireState = (): LayoutSessionState => {
    if (
      committedIntent === undefined ||
      committedResolved === undefined ||
      committedSolver === undefined
    ) {
      throw new DomAdapterError('INVALID_SESSION_INPUT', 'Layout session has no committed layout');
    }
    const drag = interaction?.getState();
    return freezeState({
      intent: committedIntent,
      resolved: committedResolved,
      solver: committedSolver,
      phase: drag?.phase ?? 'idle',
      activeItemId: drag?.activeItemId,
      proposal: drag?.proposal,
      lastDrop: drag?.lastDrop ?? lastDrop,
      ...(autoLayoutEnabled
        ? {
            autoLayout: {
              enabled: true as const,
              proposalUnplacedItemIds,
            },
          }
        : {}),
    });
  };

  const emit = (): void => {
    if (disposed) {
      return;
    }
    onChange?.(requireState());
  };

  const applyCommitted = (skipItemId?: string): void => {
    if (committedResolved === undefined) {
      return;
    }
    applyLayoutPlacements({
      items: elements,
      layout: committedResolved,
      skipItemId,
    });
  };

  const applyPreview = (proposal: DragProposal): void => {
    const previewLayout = proposal.preview.resolved;
    applyLayoutPlacements({
      items: elements,
      layout: previewLayout,
      skipItemId: proposal.itemId,
    });
  };

  const commitSolver = (intent: LayoutIntent, solver: SolverResult): void => {
    committedIntent = intent;
    committedResolved = solver.resolved;
    committedSolver = solver;
  };

  const buildSourceIntent = (snapshot: DomMeasurementSnapshot): LayoutIntent => {
    const items = toItemInputs(descriptors, snapshot);
    if (Object.keys(sourceDesired).length === 0) {
      return createLayoutIntent({
        space: snapshot.space,
        items,
      });
    }
    return createLayoutIntent({
      space: snapshot.space,
      items,
      desiredPlacements: { ...sourceDesired },
    });
  };

  /**
   * Auto-Layout idle / continuation solve.
   * `previous` feeds the proposal for generated retention. Solver `previous` is
   * supplied only on passive continuation (unchanged Source Intent) so ADR-0010
   * cannot suppress a newly promoted / updated Source Intent rect.
   *
   * Optional `automaticItemOrder` is advisory only (from explicit replan). Idle
   * resize / drop recomposes reuse the last successful order without re-invoking
   * the planner.
   */
  const solveAutoLayoutIdle = (
    snapshot: DomMeasurementSnapshot,
    previous: ResolvedLayout | undefined,
    allowSolvePrevious: boolean,
    automaticItemOrder?: readonly string[],
  ): { intent: LayoutIntent; solver: SolverResult; unplaced: readonly string[] } => {
    const sourceIntent = buildSourceIntent(snapshot);
    const proposal = createAutoLayoutProposal({
      intent: sourceIntent,
      ...(previous !== undefined ? { previous } : {}),
      ...(automaticItemOrder !== undefined ? { automaticItemOrder } : {}),
    });
    const solver = solveLayout({
      intent: proposal.effectiveIntent,
      ...(allowSolvePrevious && previous !== undefined ? { previous } : {}),
    });
    return {
      intent: proposal.effectiveIntent,
      solver,
      unplaced: proposal.unplacedItemIds,
    };
  };

  const connectInteraction = (): void => {
    if (committedIntent === undefined || committedResolved === undefined) {
      throw new DomAdapterError('INVALID_SESSION_INPUT', 'Cannot connect interaction before solve');
    }
    reconnecting = true;
    interaction?.dispose();
    interaction = createDragInteraction({
      container: input.container,
      items: elements,
      intent: committedIntent,
      previous: committedResolved,
      mechanics: input.mechanics,
      ResizeObserver: input.ResizeObserver,
      onMeasure: handleMeasure,
      onProposal: (event) => {
        if (disposed) {
          return;
        }
        applyPreview(event.proposal);
        emit();
      },
      onDrop: (event) => {
        if (disposed) {
          return;
        }
        lastDrop = event.result;
        if (event.result.accepted && event.result.resolved !== undefined) {
          if (autoLayoutEnabled) {
            const itemId = event.result.itemId;
            const acceptedDesired = event.result.intent.desiredPlacements?.[itemId];
            if (acceptedDesired !== undefined) {
              // Promote ONLY the active item to Source Intent (generated → source).
              // Sibling rects seeded for drag stability must not become Source Intent.
              sourceDesired[itemId] = cloneRect(acceptedDesired);
            }
            const snapshot = lastSnapshot;
            if (snapshot !== undefined) {
              // Recompose from durable Source Intent + previous sibling geometry.
              // Omit solver previous so the new Source Intent wins (ADR-0010).
              // Do NOT invoke the optional planner on accepted drop (DND-4.3).
              const next = solveAutoLayoutIdle(
                snapshot,
                event.result.resolved,
                false,
                lastAutomaticItemOrder,
              );
              proposalUnplacedItemIds = Object.freeze([...next.unplaced]);
              lastSourceKey = sourceDesiredKey(sourceDesired);
              commitSolver(next.intent, next.solver);
              applyCommitted();
            } else {
              commitSolver(event.result.intent, event.result.solver);
              applyCommitted();
            }
          } else {
            commitSolver(event.result.intent, event.result.solver);
            applyCommitted();
          }
        } else {
          applyCommitted();
        }
        onDrop?.(event);
        emit();
      },
      onCancel: (event) => {
        if (disposed) {
          return;
        }
        applyCommitted();
        onCancel?.(event);
        emit();
      },
    });
    reconnecting = false;
  };

  const handleIdleSnapshot = (snapshot: DomMeasurementSnapshot): boolean => {
    if (autoLayoutEnabled) {
      const currentKey = sourceDesiredKey(sourceDesired);
      // Passive continuation: Source Intent unchanged since the last idle commit.
      // First solve (lastSourceKey === '') and post-drag recomposes omit solver previous.
      const allowSolvePrevious =
        committedResolved !== undefined && currentKey === lastSourceKey && lastSourceKey !== '';
      const solved = solveAutoLayoutIdle(
        snapshot,
        committedResolved,
        allowSolvePrevious,
        lastAutomaticItemOrder,
      );
      proposalUnplacedItemIds = Object.freeze([...solved.unplaced]);
      lastSourceKey = currentKey;
      if (
        committedResolved !== undefined &&
        resolvedLayoutsEqual(solved.solver.resolved, committedResolved)
      ) {
        committedIntent = solved.intent;
        committedSolver = solved.solver;
        return false;
      }
      commitSolver(solved.intent, solved.solver);
      applyCommitted();
      return true;
    }

    const intent = buildExplicitIntent(descriptors, snapshot, originalDesired, committedResolved);
    const solver = solveLayout({
      intent,
      ...(committedResolved !== undefined ? { previous: committedResolved } : {}),
    });
    if (
      committedResolved !== undefined &&
      resolvedLayoutsEqual(solver.resolved, committedResolved)
    ) {
      committedIntent = intent;
      committedSolver = solver;
      return false;
    }
    commitSolver(intent, solver);
    applyCommitted();
    return true;
  };

  function handleMeasure(snapshot: DomMeasurementSnapshot): void {
    if (disposed) {
      return;
    }
    if (lastSnapshot !== undefined && snapshotsEqual(lastSnapshot, snapshot)) {
      return;
    }
    lastSnapshot = snapshot;

    const phase = interaction?.getState().phase ?? 'idle';
    if (phase === 'dragging') {
      return;
    }

    const changed = handleIdleSnapshot(snapshot);
    if (changed && !reconnecting) {
      connectInteraction();
    }
    emit();
  }

  prepareLayoutContainer(input.container);

  const initialSnapshot = measureLayout({
    container: input.container,
    items: elements,
  });
  lastSnapshot = initialSnapshot;
  // Initial layout is always Phase 3 declaration-order Auto-Layout (or explicit).
  // Optional planners run only via explicit replan() so async planners never block
  // first paint and sync/async session semantics stay uniform.
  handleIdleSnapshot(initialSnapshot);
  connectInteraction();
  emit();

  const replan = async (): Promise<void> => {
    if (disposed) {
      throw new DomAdapterError('SESSION_DISPOSED', 'Cannot replan a disposed layout session');
    }

    const snapshot = lastSnapshot;
    if (snapshot === undefined) {
      return;
    }

    activePlannerAbort?.abort();
    const requestId = plannerRequestId + 1;
    plannerRequestId = requestId;
    // AbortController is constructed only at invoke time (SSR-safe module load).
    const abortController = new AbortController();
    activePlannerAbort = abortController;

    onPlannerEvent?.({ requestId, status: 'planning' });

    let automaticItemOrder: readonly string[] | undefined;
    let proposalSource: 'custom' | 'declaration' = 'declaration';
    let eventStatus: LayoutSessionPlannerStatus = 'applied';
    let fallbackReason: LayoutSessionPlannerEvent['fallbackReason'];

    if (planner !== undefined) {
      const planningSnapshot: LayoutSessionPlanningSnapshot = {
        intent: buildSourceIntent(snapshot),
        ...(committedResolved !== undefined ? { previous: committedResolved } : {}),
      };
      try {
        const proposal = await Promise.resolve(
          planner(planningSnapshot, {
            requestId,
            signal: abortController.signal,
          }),
        );
        if (disposed) {
          onPlannerEvent?.({
            requestId,
            status: 'cancelled',
            fallbackReason: 'cancelled',
          });
          return;
        }
        if (requestId !== plannerRequestId) {
          onPlannerEvent?.({ requestId, status: 'stale' });
          return;
        }
        if (abortController.signal.aborted) {
          onPlannerEvent?.({
            requestId,
            status: 'cancelled',
            fallbackReason: 'cancelled',
          });
          return;
        }
        automaticItemOrder = proposal.automaticItemOrder;
        proposalSource = 'custom';
      } catch {
        if (disposed) {
          onPlannerEvent?.({
            requestId,
            status: 'cancelled',
            fallbackReason: 'cancelled',
          });
          return;
        }
        if (requestId !== plannerRequestId) {
          onPlannerEvent?.({ requestId, status: 'stale' });
          return;
        }
        if (abortController.signal.aborted) {
          onPlannerEvent?.({
            requestId,
            status: 'cancelled',
            fallbackReason: 'cancelled',
          });
          return;
        }
        // Custom planner failure → Phase 3 declaration-order Auto-Layout.
        // Deterministic local planner fallback lives in `@dndgem/intelligence`
        // (`runLayoutPlanner` / `createOrchestratedLayoutPlanner`) when consumers
        // compose that package outside DOM.
        automaticItemOrder = undefined;
        proposalSource = 'declaration';
        eventStatus = 'fallback';
        fallbackReason = 'planner-throw';
      }
    }

    if (disposed) {
      onPlannerEvent?.({
        requestId,
        status: 'cancelled',
        fallbackReason: 'cancelled',
      });
      return;
    }
    if (requestId !== plannerRequestId) {
      onPlannerEvent?.({ requestId, status: 'stale' });
      return;
    }
    if (abortController.signal.aborted) {
      onPlannerEvent?.({ requestId, status: 'cancelled', fallbackReason: 'cancelled' });
      return;
    }

    if (!autoLayoutEnabled) {
      // Explicit-only sessions: replan recomposes from current measurements without
      // an advisory order (parity no-op relative to idle continuation).
      const intent = buildExplicitIntent(descriptors, snapshot, originalDesired, committedResolved);
      const solver = solveLayout({
        intent,
        ...(committedResolved !== undefined ? { previous: committedResolved } : {}),
      });
      if (requestId !== plannerRequestId || disposed) {
        onPlannerEvent?.({
          requestId,
          status: disposed ? 'cancelled' : 'stale',
          ...(disposed ? { fallbackReason: 'cancelled' as const } : {}),
        });
        return;
      }
      commitSolver(intent, solver);
      applyCommitted();
      if (!reconnecting) {
        connectInteraction();
      }
      emit();
      onPlannerEvent?.({ requestId, status: 'applied', proposalSource: 'declaration' });
      return;
    }

    // Explicit replan omits Auto-Layout `previous` so Stage B retention cannot
    // freeze the prior declaration-order competition; planner order must compete fresh.
    // Source Intent remains in buildSourceIntent / desiredPlacements.
    const solved = solveAutoLayoutIdle(snapshot, undefined, false, automaticItemOrder);

    if (requestId !== plannerRequestId || disposed) {
      onPlannerEvent?.({
        requestId,
        status: disposed ? 'cancelled' : 'stale',
        ...(disposed ? { fallbackReason: 'cancelled' as const } : {}),
      });
      return;
    }

    lastAutomaticItemOrder =
      automaticItemOrder !== undefined ? Object.freeze([...automaticItemOrder]) : undefined;
    proposalUnplacedItemIds = Object.freeze([...solved.unplaced]);
    lastSourceKey = sourceDesiredKey(sourceDesired);
    commitSolver(solved.intent, solved.solver);
    applyCommitted();
    if (!reconnecting) {
      connectInteraction();
    }
    emit();
    onPlannerEvent?.({
      requestId,
      status: eventStatus,
      proposalSource,
      ...(fallbackReason !== undefined ? { fallbackReason } : {}),
    });
  };

  return {
    getState(): LayoutSessionState {
      if (disposed) {
        throw new DomAdapterError(
          'SESSION_DISPOSED',
          'Cannot read state from a disposed layout session',
        );
      }
      return requireState();
    },
    replan,
    dispose(): void {
      if (disposed) {
        return;
      }
      disposed = true;
      activePlannerAbort?.abort();
      activePlannerAbort = undefined;
      interaction?.dispose();
      interaction = undefined;
      lastSnapshot = undefined;
      lastDrop = undefined;
      lastAutomaticItemOrder = undefined;
      // Layout-related inline styles are left in place. DnDGem owns
      // position/left/top/width/height/box-sizing/transform on mapped items
      // after mount; the consumer resets them if a pre-session look is needed.
    },
  };
}
