import { DomainError } from './errors.js';
import { evaluateLayout, type LayoutEvaluation, type ScoreBreakdown } from './evaluate.js';
import type { Rect, Size } from './geometry.js';
import { createRect } from './geometry.js';
import { itemIdToString } from './identity.js';
import type { LayoutIntent } from './intent.js';
import type { LayoutItem } from './item.js';
import { createResolvedLayout, type ResolvedLayout } from './resolved.js';
import { resolveItemSize, type SizingMode } from './sizing.js';
import type { ValidityState } from './validity.js';

/**
 * Input to the adaptive layout solver (DND-1.4 / ADR-0010).
 *
 * `intent` is author structure; `previous` is optional prior resolved output
 * used only for stability and reflow explainability — never mutated.
 */
export interface SolverInput {
  readonly intent: LayoutIntent;
  readonly previous?: ResolvedLayout;
}

/** Strategy name appearing on candidate summaries (public result vocabulary). */
export type SolverStrategy =
  | 'preserve-previous'
  | 'preserve-desired'
  | 'row-preferred'
  | 'row-useful'
  | 'row-minimal'
  | 'column-preferred'
  | 'column-useful'
  | 'column-minimal';

export type SolverSelectionCode =
  | 'ONLY_CANDIDATE'
  | 'BETTER_VALIDITY'
  | 'BETTER_SCORE'
  | 'STABILITY'
  | 'CANDIDATE_ORDER'
  | 'UNSATISFIABLE';

/**
 * Why the winning candidate was selected over the runner-up (if any).
 */
export interface SolverSelectionReason {
  readonly code: SolverSelectionCode;
  readonly detail: string;
  readonly winnerId: string;
  readonly comparedToId?: string;
}

/**
 * Compact per-candidate ranking snapshot (not a full evaluation dump).
 */
export interface SolverCandidateSummary {
  readonly id: string;
  readonly strategy: SolverStrategy;
  /** Zero-based generation ordinal — lower wins equal validity/score/stability. */
  readonly ordinal: number;
  readonly state: ValidityState;
  readonly score: ScoreBreakdown;
  /** Sum of squared top-left deltas vs previous (0 when no previous). */
  readonly stabilityDistance: number;
}

/**
 * Deterministic solver output: resolved layout + evaluation + selection metadata.
 */
export interface SolverResult {
  readonly resolved: ResolvedLayout;
  readonly evaluation: LayoutEvaluation;
  /**
   * True when a previous layout was supplied and the winner's placements differ
   * from previous placements (structural equality on x/y/width/height).
   * Space-only changes with identical placements do not set `reflowed`.
   */
  readonly reflowed: boolean;
  readonly winnerId: string;
  readonly selection: SolverSelectionReason;
  /** Candidates in generation order (same order every run for the same input). */
  readonly candidates: readonly SolverCandidateSummary[];
}

type PackAxis = 'row' | 'column';

type InternalCandidate = {
  readonly id: string;
  readonly strategy: SolverStrategy;
  readonly ordinal: number;
  readonly resolved: ResolvedLayout;
  readonly evaluation: LayoutEvaluation;
  readonly stabilityDistance: number;
};

const VALIDITY_RANK: Record<ValidityState, number> = {
  VALID: 2,
  DEGRADED: 1,
  INVALID: 0,
};

function freezeScore(score: ScoreBreakdown): ScoreBreakdown {
  return Object.freeze({
    total: score.total,
    usefulness: score.usefulness,
    preference: score.preference,
  });
}

function freezeSelection(selection: SolverSelectionReason): SolverSelectionReason {
  const frozen: {
    -readonly [K in keyof SolverSelectionReason]?: SolverSelectionReason[K];
  } = {
    code: selection.code,
    detail: selection.detail,
    winnerId: selection.winnerId,
  };
  if (selection.comparedToId !== undefined) {
    frozen.comparedToId = selection.comparedToId;
  }
  return Object.freeze(frozen) as SolverSelectionReason;
}

function freezeSummary(summary: SolverCandidateSummary): SolverCandidateSummary {
  return Object.freeze({
    id: summary.id,
    strategy: summary.strategy,
    ordinal: summary.ordinal,
    state: summary.state,
    score: freezeScore(summary.score),
    stabilityDistance: summary.stabilityDistance,
  });
}

function assertSolverInput(input: SolverInput): void {
  if (input === null || typeof input !== 'object') {
    throw new DomainError('INVALID_SOLVER_INPUT', 'SolverInput must be an object');
  }
  if (input.intent === null || typeof input.intent !== 'object') {
    throw new DomainError('INVALID_SOLVER_INPUT', 'SolverInput.intent is required');
  }
  if (!Array.isArray(input.intent.items)) {
    throw new DomainError('INVALID_SOLVER_INPUT', 'SolverInput.intent.items must be an array');
  }
  if (
    input.previous !== undefined &&
    (input.previous === null || typeof input.previous !== 'object')
  ) {
    throw new DomainError(
      'INVALID_SOLVER_INPUT',
      'SolverInput.previous must be a ResolvedLayout when provided',
    );
  }
}

function packPlacements(
  items: readonly LayoutItem[],
  mode: SizingMode,
  axis: PackAxis,
  space: Size,
): Record<string, Rect> {
  const placements: Record<string, Rect> = {};
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;
  let colWidth = 0;

  for (const item of items) {
    const size = resolveItemSize(item, mode, space);
    const key = itemIdToString(item.id);

    if (axis === 'row') {
      if (cursorX > 0 && cursorX + size.width > space.width) {
        cursorX = 0;
        cursorY += rowHeight;
        rowHeight = 0;
      }
      placements[key] = createRect({
        x: cursorX,
        y: cursorY,
        width: size.width,
        height: size.height,
      });
      cursorX += size.width;
      rowHeight = Math.max(rowHeight, size.height);
    } else {
      if (cursorY > 0 && cursorY + size.height > space.height) {
        cursorY = 0;
        cursorX += colWidth;
        colWidth = 0;
      }
      placements[key] = createRect({
        x: cursorX,
        y: cursorY,
        width: size.width,
        height: size.height,
      });
      cursorY += size.height;
      colWidth = Math.max(colWidth, size.width);
    }
  }

  return placements;
}

function adaptPlacementsToSpace(
  source: Readonly<Record<string, Rect>>,
  items: readonly LayoutItem[],
  itemKeys: readonly string[],
  space: Size,
): Record<string, Rect> | undefined {
  // Preserve prior/desired positions; shrink axes that exceed current space/max.
  // Undersized results may evaluate as INVALID (honest hard-min failure).
  const byId = new Map(items.map((item) => [itemIdToString(item.id), item]));
  const placements: Record<string, Rect> = {};

  for (const key of itemKeys) {
    const rect = source[key];
    const item = byId.get(key);
    if (rect === undefined || item === undefined) {
      return undefined;
    }

    let width = rect.width;
    let height = rect.height;
    if (width > space.width) {
      width = space.width;
    }
    if (height > space.height) {
      height = space.height;
    }
    const { maxWidth, maxHeight } = item.constraints;
    if (maxWidth !== undefined && width > maxWidth) {
      width = maxWidth;
    }
    if (maxHeight !== undefined && height > maxHeight) {
      height = maxHeight;
    }

    placements[key] = createRect({
      x: rect.x,
      y: rect.y,
      width,
      height,
    });
  }

  return placements;
}

/**
 * Stability distance vs previous placements.
 * Only item ids present in both layouts contribute; unmatched ids are skipped
 * (MVP: no edit-distance penalty for add/remove — ordinal/score still decide).
 */
function stabilityDistance(
  placements: Readonly<Record<string, Rect>>,
  previous: ResolvedLayout | undefined,
  itemKeys: readonly string[],
): number {
  if (previous === undefined) {
    return 0;
  }
  let sum = 0;
  for (const key of itemKeys) {
    const next = placements[key];
    const prev = previous.placements[key];
    if (next === undefined || prev === undefined) {
      continue;
    }
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const dw = next.width - prev.width;
    const dh = next.height - prev.height;
    sum += dx * dx + dy * dy + dw * dw + dh * dh;
  }
  return sum;
}

function placementsEqual(
  a: Readonly<Record<string, Rect>>,
  b: Readonly<Record<string, Rect>>,
  itemKeys: readonly string[],
): boolean {
  for (const key of itemKeys) {
    const left = a[key];
    const right = b[key];
    if (left === undefined || right === undefined) {
      return false;
    }
    if (
      left.x !== right.x ||
      left.y !== right.y ||
      left.width !== right.width ||
      left.height !== right.height
    ) {
      return false;
    }
  }
  return Object.keys(a).length === itemKeys.length && Object.keys(b).length === itemKeys.length;
}

function buildCandidate(
  strategy: SolverStrategy,
  ordinal: number,
  intent: LayoutIntent,
  placements: Record<string, Rect>,
  previous: ResolvedLayout | undefined,
  itemKeys: readonly string[],
): InternalCandidate {
  const resolved = createResolvedLayout({
    space: intent.space,
    placements,
  });
  const evaluation = evaluateLayout(intent, resolved);
  const id = `${ordinal}:${strategy}`;
  return {
    id,
    strategy,
    ordinal,
    resolved,
    evaluation,
    stabilityDistance: stabilityDistance(placements, previous, itemKeys),
  };
}

/**
 * Bounded deterministic candidate set.
 * Strategies are attempted in fixed order (preserve*, then row/column packs);
 * missing preserve sources simply omit that candidate (no randomness).
 */
function generateCandidates(
  intent: LayoutIntent,
  previous: ResolvedLayout | undefined,
): InternalCandidate[] {
  const itemKeys = intent.items.map((item) => itemIdToString(item.id));
  const candidates: InternalCandidate[] = [];
  let ordinal = 0;

  const tryPush = (
    strategy: SolverStrategy,
    placements: Record<string, Rect> | undefined,
  ): void => {
    if (placements === undefined) {
      return;
    }
    candidates.push(buildCandidate(strategy, ordinal, intent, placements, previous, itemKeys));
    ordinal += 1;
  };

  if (previous !== undefined) {
    tryPush(
      'preserve-previous',
      adaptPlacementsToSpace(previous.placements, intent.items, itemKeys, intent.space),
    );
  }

  if (intent.desiredPlacements !== undefined) {
    tryPush(
      'preserve-desired',
      adaptPlacementsToSpace(intent.desiredPlacements, intent.items, itemKeys, intent.space),
    );
  }

  const packed: ReadonlyArray<{ strategy: SolverStrategy; mode: SizingMode; axis: PackAxis }> = [
    { strategy: 'row-preferred', mode: 'preferred', axis: 'row' },
    { strategy: 'row-useful', mode: 'useful', axis: 'row' },
    { strategy: 'row-minimal', mode: 'minimal', axis: 'row' },
    { strategy: 'column-preferred', mode: 'preferred', axis: 'column' },
    { strategy: 'column-useful', mode: 'useful', axis: 'column' },
    { strategy: 'column-minimal', mode: 'minimal', axis: 'column' },
  ];

  for (const entry of packed) {
    tryPush(entry.strategy, packPlacements(intent.items, entry.mode, entry.axis, intent.space));
  }

  return candidates;
}

/**
 * Complete comparator (ADR-0010):
 * 1. validity tier (VALID > DEGRADED > INVALID)
 * 2. higher total score
 * 3. lower stability distance (prefer less movement vs previous)
 * 4. lower generation ordinal
 *
 * Returns negative if `a` ranks better than `b`.
 */
function compareCandidates(a: InternalCandidate, b: InternalCandidate): number {
  const validityDelta = VALIDITY_RANK[b.evaluation.state] - VALIDITY_RANK[a.evaluation.state];
  if (validityDelta !== 0) {
    return validityDelta;
  }
  if (a.evaluation.score.total !== b.evaluation.score.total) {
    return b.evaluation.score.total - a.evaluation.score.total;
  }
  if (a.stabilityDistance !== b.stabilityDistance) {
    return a.stabilityDistance - b.stabilityDistance;
  }
  return a.ordinal - b.ordinal;
}

function selectionBetween(
  winner: InternalCandidate,
  other: InternalCandidate,
): SolverSelectionReason {
  const validityDelta =
    VALIDITY_RANK[winner.evaluation.state] - VALIDITY_RANK[other.evaluation.state];
  if (validityDelta !== 0) {
    return freezeSelection({
      code: 'BETTER_VALIDITY',
      detail: `${winner.evaluation.state} outranks ${other.evaluation.state}`,
      winnerId: winner.id,
      comparedToId: other.id,
    });
  }
  if (winner.evaluation.score.total !== other.evaluation.score.total) {
    return freezeSelection({
      code: 'BETTER_SCORE',
      detail: `total ${winner.evaluation.score.total} > ${other.evaluation.score.total}`,
      winnerId: winner.id,
      comparedToId: other.id,
    });
  }
  if (winner.stabilityDistance !== other.stabilityDistance) {
    return freezeSelection({
      code: 'STABILITY',
      detail: `stabilityDistance ${winner.stabilityDistance} < ${other.stabilityDistance}`,
      winnerId: winner.id,
      comparedToId: other.id,
    });
  }
  return freezeSelection({
    code: 'CANDIDATE_ORDER',
    detail: `generation ordinal ${winner.ordinal} < ${other.ordinal}`,
    winnerId: winner.id,
    comparedToId: other.id,
  });
}

/**
 * Deterministic adaptive layout solver.
 *
 * Pipeline: validate input → generate bounded candidates → evaluate via
 * {@link evaluateLayout} → rank (validity → score → stability → ordinal) →
 * return resolved layout with selection metadata.
 *
 * Same input always yields the same candidate set, order, winner, and metadata.
 * Does not mutate caller-owned objects. Does not use time, randomness, or DOM.
 */
export function solveLayout(input: SolverInput): SolverResult {
  assertSolverInput(input);

  const { intent, previous } = input;
  const itemKeys = intent.items.map((item) => itemIdToString(item.id));

  // Empty layout: explicit VALID / score 1 policy (same as evaluateLayout).
  if (intent.items.length === 0) {
    const resolved = createResolvedLayout({
      space: intent.space,
      placements: {},
    });
    const evaluation = evaluateLayout(intent, resolved);
    const winnerId = '0:empty';
    return Object.freeze({
      resolved,
      evaluation,
      reflowed: false,
      winnerId,
      selection: freezeSelection({
        code: 'ONLY_CANDIDATE',
        detail: 'empty layout has a single neutral solution',
        winnerId,
      }),
      candidates: Object.freeze([
        freezeSummary({
          id: winnerId,
          strategy: 'row-preferred',
          ordinal: 0,
          state: evaluation.state,
          score: evaluation.score,
          stabilityDistance: 0,
        }),
      ]),
    });
  }

  const candidates = generateCandidates(intent, previous);
  if (candidates.length === 0) {
    throw new DomainError('NO_CANDIDATES', 'Solver produced no candidates for a non-empty intent');
  }

  let winner = candidates[0]!;
  for (let i = 1; i < candidates.length; i += 1) {
    const candidate = candidates[i]!;
    if (compareCandidates(candidate, winner) < 0) {
      winner = candidate;
    }
  }

  const ranked = [...candidates].sort(compareCandidates);
  const runnerUp = ranked.length > 1 ? ranked[1] : undefined;

  let selection: SolverSelectionReason;
  if (runnerUp === undefined) {
    selection = freezeSelection({
      code: 'ONLY_CANDIDATE',
      detail: 'single generated candidate',
      winnerId: winner.id,
    });
  } else if (
    winner.evaluation.state === 'INVALID' &&
    ranked.every((c) => c.evaluation.state === 'INVALID')
  ) {
    selection = freezeSelection({
      code: 'UNSATISFIABLE',
      detail: 'all candidates are INVALID; returning best deterministic INVALID result',
      winnerId: winner.id,
      comparedToId: runnerUp.id,
    });
  } else {
    selection = selectionBetween(winner, runnerUp);
  }

  const reflowed =
    previous !== undefined &&
    !placementsEqual(winner.resolved.placements, previous.placements, itemKeys);

  return Object.freeze({
    resolved: winner.resolved,
    evaluation: winner.evaluation,
    reflowed,
    winnerId: winner.id,
    selection,
    candidates: Object.freeze(
      candidates.map((c) =>
        freezeSummary({
          id: c.id,
          strategy: c.strategy,
          ordinal: c.ordinal,
          state: c.evaluation.state,
          score: c.evaluation.score,
          stabilityDistance: c.stabilityDistance,
        }),
      ),
    ),
  });
}
