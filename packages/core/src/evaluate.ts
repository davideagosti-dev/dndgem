import type { ContentConstraints } from './constraints.js';
import { DomainError } from './errors.js';
import type { Size } from './geometry.js';
import { itemIdToString } from './identity.js';
import type { LayoutIntent } from './intent.js';
import type { LayoutItem } from './item.js';
import { assertNonNegativeFinite } from './numbers.js';
import type { ResolvedLayout } from './resolved.js';
import type { ValidityState } from './validity.js';

/**
 * Structured reason codes for placement evaluation (ADR-0002 / DND-1.3).
 * Codes are the source of truth; do not treat display text as authoritative.
 */
export const VALIDITY_REASON_CODES = [
  'WIDTH_BELOW_MIN',
  'WIDTH_ABOVE_MAX',
  'HEIGHT_BELOW_MIN',
  'HEIGHT_ABOVE_MAX',
  'WIDTH_BELOW_USEFUL',
  'HEIGHT_BELOW_USEFUL',
  'WIDTH_OFF_PREFERRED',
  'HEIGHT_OFF_PREFERRED',
] as const;

export type ValidityReasonCode = (typeof VALIDITY_REASON_CODES)[number];

/** Semantic family of a reason — distinct from validity state aggregation. */
export type ValidityReasonKind = 'hard' | 'usefulness' | 'preference';

export type ValidityAxis = 'width' | 'height';

/**
 * Explainable, serializable reason for a placement evaluation outcome.
 * Preference misses are recorded for scoring/debug and do not change validity state.
 */
export interface ValidityReason {
  readonly code: ValidityReasonCode;
  readonly kind: ValidityReasonKind;
  readonly axis: ValidityAxis;
  /** Allocated dimension that was evaluated. */
  readonly allocated: number;
  /** Constraint threshold compared against `allocated`. */
  readonly threshold: number;
}

/**
 * Deterministic score breakdown.
 *
 * Convention (ADR-0009):
 * - Higher is better
 * - Each component and `total` are finite and in [0, 1]
 * - INVALID placements force `total` (and components) to 0
 */
export interface ScoreBreakdown {
  readonly total: number;
  readonly usefulness: number;
  readonly preference: number;
}

/**
 * Result of evaluating one item's allocated size against its constraints.
 */
export interface ItemPlacementEvaluation {
  readonly state: ValidityState;
  readonly score: ScoreBreakdown;
  readonly reasons: readonly ValidityReason[];
}

/**
 * Layout-level aggregation of per-item placement evaluations.
 * Does not move, generate, or optimize placements.
 */
export interface LayoutEvaluation {
  readonly state: ValidityState;
  readonly score: ScoreBreakdown;
  /** Per-item results keyed by {@link import('./identity.js').ItemId} string form. */
  readonly items: Readonly<Record<string, ItemPlacementEvaluation>>;
}

/** Usefulness weight in non-invalid total score (preference takes the remainder). */
export const SCORE_USEFULNESS_WEIGHT = 0.7 as const;

/** Preference weight in non-invalid total score. */
export const SCORE_PREFERENCE_WEIGHT = 0.3 as const;

type AxisConstraints = {
  readonly min: number | undefined;
  readonly max: number | undefined;
  readonly minUseful: number | undefined;
  readonly preferred: number | undefined;
};

type AxisEvaluation = {
  readonly state: ValidityState;
  readonly usefulness: number;
  readonly preference: number;
  readonly reasons: readonly ValidityReason[];
};

const SEVERITY: Record<ValidityState, number> = {
  VALID: 0,
  DEGRADED: 1,
  INVALID: 2,
};

function worseState(a: ValidityState, b: ValidityState): ValidityState {
  return SEVERITY[a] >= SEVERITY[b] ? a : b;
}

function clampUnit(value: number): number {
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
}

function mean2(a: number, b: number): number {
  return (a + b) / 2;
}

function freezeScore(score: ScoreBreakdown): ScoreBreakdown {
  return Object.freeze({
    total: score.total,
    usefulness: score.usefulness,
    preference: score.preference,
  });
}

function freezeReasons(reasons: readonly ValidityReason[]): readonly ValidityReason[] {
  return Object.freeze(reasons.map((reason) => Object.freeze({ ...reason })));
}

function freezeItemEvaluation(evaluation: ItemPlacementEvaluation): ItemPlacementEvaluation {
  return Object.freeze({
    state: evaluation.state,
    score: freezeScore(evaluation.score),
    reasons: freezeReasons(evaluation.reasons),
  });
}

/**
 * Usefulness quality for one axis.
 *
 * - No minUseful → 1
 * - allocated >= minUseful → 1
 * - allocated < minUseful → linear in [floor, minUseful] where floor = min ?? 0
 * - allocated <= floor → 0 (monotonic; hard INVALID when min is present)
 */
function scoreUsefulness(
  allocated: number,
  minUseful: number | undefined,
  min: number | undefined,
): number {
  if (minUseful === undefined) {
    return 1;
  }
  if (allocated >= minUseful) {
    return 1;
  }
  const floor = min ?? 0;
  const span = minUseful - floor;
  if (span <= 0) {
    return 0;
  }
  if (allocated <= floor) {
    return 0;
  }
  return clampUnit((allocated - floor) / span);
}

/**
 * Preference quality for one axis (target distance, not one-directional).
 *
 * - No preferred → 1
 * - Exact preferred → 1
 * - Otherwise 1 - |allocated - preferred| / denom, clamped to [0, 1]
 *
 * Denominator (normalization span):
 * - min and max: max(preferred - min, max - preferred)
 * - only min: max(preferred - min, preferred) when preferred > 0, else preferred - min
 * - only max: max(max - preferred, preferred) when preferred > 0, else max - preferred
 * - neither: preferred when preferred > 0; otherwise only exact 0 matches
 */
function scorePreference(
  allocated: number,
  preferred: number | undefined,
  min: number | undefined,
  max: number | undefined,
): number {
  if (preferred === undefined) {
    return 1;
  }
  const distance = Math.abs(allocated - preferred);
  if (distance === 0) {
    return 1;
  }

  let denom: number;
  if (min !== undefined && max !== undefined) {
    denom = Math.max(preferred - min, max - preferred);
  } else if (min !== undefined) {
    denom = preferred > 0 ? Math.max(preferred - min, preferred) : preferred - min;
  } else if (max !== undefined) {
    denom = preferred > 0 ? Math.max(max - preferred, preferred) : max - preferred;
  } else {
    denom = preferred > 0 ? preferred : 0;
  }

  if (denom <= 0) {
    return 0;
  }
  return clampUnit(1 - distance / denom);
}

function evaluateAxis(
  allocated: number,
  axis: ValidityAxis,
  constraints: AxisConstraints,
): AxisEvaluation {
  const reasons: ValidityReason[] = [];
  let state: ValidityState = 'VALID';

  if (constraints.min !== undefined && allocated < constraints.min) {
    state = 'INVALID';
    reasons.push({
      code: axis === 'width' ? 'WIDTH_BELOW_MIN' : 'HEIGHT_BELOW_MIN',
      kind: 'hard',
      axis,
      allocated,
      threshold: constraints.min,
    });
  }

  if (constraints.max !== undefined && allocated > constraints.max) {
    state = 'INVALID';
    reasons.push({
      code: axis === 'width' ? 'WIDTH_ABOVE_MAX' : 'HEIGHT_ABOVE_MAX',
      kind: 'hard',
      axis,
      allocated,
      threshold: constraints.max,
    });
  }

  if (
    state !== 'INVALID' &&
    constraints.minUseful !== undefined &&
    allocated < constraints.minUseful
  ) {
    state = 'DEGRADED';
    reasons.push({
      code: axis === 'width' ? 'WIDTH_BELOW_USEFUL' : 'HEIGHT_BELOW_USEFUL',
      kind: 'usefulness',
      axis,
      allocated,
      threshold: constraints.minUseful,
    });
  }

  if (constraints.preferred !== undefined && allocated !== constraints.preferred) {
    reasons.push({
      code: axis === 'width' ? 'WIDTH_OFF_PREFERRED' : 'HEIGHT_OFF_PREFERRED',
      kind: 'preference',
      axis,
      allocated,
      threshold: constraints.preferred,
    });
  }

  return {
    state,
    usefulness: scoreUsefulness(allocated, constraints.minUseful, constraints.min),
    preference: scorePreference(allocated, constraints.preferred, constraints.min, constraints.max),
    reasons,
  };
}

function composeScore(
  state: ValidityState,
  usefulness: number,
  preference: number,
): ScoreBreakdown {
  if (state === 'INVALID') {
    return freezeScore({ total: 0, usefulness: 0, preference: 0 });
  }
  const total = clampUnit(
    SCORE_USEFULNESS_WEIGHT * usefulness + SCORE_PREFERENCE_WEIGHT * preference,
  );
  return freezeScore({ total, usefulness, preference });
}

function assertSizeInput(size: Size): void {
  assertNonNegativeFinite(size.width, 'width');
  assertNonNegativeFinite(size.height, 'height');
}

/**
 * Evaluates an item's allocated size against its content constraints.
 *
 * Pure and deterministic: same constraints + size → same structured result.
 * Does not generate, move, or optimize placements.
 *
 * Validity:
 * - hard min/max violation → INVALID
 * - else minUseful violation → DEGRADED
 * - else → VALID
 * Preference misses never change validity state (score/reasons only).
 */
export function evaluateItemPlacement(item: LayoutItem, size: Size): ItemPlacementEvaluation {
  assertSizeInput(size);
  return evaluateConstraintsPlacement(item.constraints, size);
}

/**
 * Evaluates raw constraints + size (same semantics as {@link evaluateItemPlacement}).
 */
export function evaluateConstraintsPlacement(
  constraints: ContentConstraints,
  size: Size,
): ItemPlacementEvaluation {
  assertSizeInput(size);

  const width = evaluateAxis(size.width, 'width', {
    min: constraints.minWidth,
    max: constraints.maxWidth,
    minUseful: constraints.minUsefulWidth,
    preferred: constraints.preferredWidth,
  });
  const height = evaluateAxis(size.height, 'height', {
    min: constraints.minHeight,
    max: constraints.maxHeight,
    minUseful: constraints.minUsefulHeight,
    preferred: constraints.preferredHeight,
  });

  const state = worseState(width.state, height.state);
  const usefulness = mean2(width.usefulness, height.usefulness);
  const preference = mean2(width.preference, height.preference);
  const reasons = freezeReasons([...width.reasons, ...height.reasons]);

  return freezeItemEvaluation({
    state,
    score: composeScore(state, usefulness, preference),
    reasons,
  });
}

/**
 * Evaluates every item in `intent` against placements in `resolved`.
 *
 * Malformed pairing (missing / unknown placement keys) throws {@link DomainError}.
 * Well-formed hard-constraint failures are {@link ValidityState} INVALID, not errors.
 *
 * Aggregation:
 * - state = most severe item state (INVALID > DEGRADED > VALID)
 * - score = mean of per-item score components (empty item set → perfect VALID)
 */
export function evaluateLayout(intent: LayoutIntent, resolved: ResolvedLayout): LayoutEvaluation {
  const itemIds = new Set(intent.items.map((item) => itemIdToString(item.id)));
  const placementKeys = Object.keys(resolved.placements);

  for (const key of placementKeys) {
    if (!itemIds.has(key)) {
      throw new DomainError(
        'UNKNOWN_PLACEMENT_ITEM',
        `placements key "${key}" does not match any LayoutIntent item id`,
      );
    }
  }

  if (intent.items.length === 0) {
    return Object.freeze({
      state: 'VALID' as const,
      score: freezeScore({ total: 1, usefulness: 1, preference: 1 }),
      items: Object.freeze({}),
    });
  }

  const items: Record<string, ItemPlacementEvaluation> = {};
  let aggregateState: ValidityState = 'VALID';
  let usefulnessSum = 0;
  let preferenceSum = 0;
  let totalSum = 0;

  for (const item of intent.items) {
    const key = itemIdToString(item.id);
    const placement = resolved.placements[key];
    if (placement === undefined) {
      throw new DomainError(
        'MISSING_PLACEMENT',
        `ResolvedLayout is missing a placement for item id "${key}"`,
      );
    }

    const evaluation = evaluateItemPlacement(item, {
      width: placement.width,
      height: placement.height,
    });
    items[key] = evaluation;
    aggregateState = worseState(aggregateState, evaluation.state);
    usefulnessSum += evaluation.score.usefulness;
    preferenceSum += evaluation.score.preference;
    totalSum += evaluation.score.total;
  }

  const count = intent.items.length;
  return Object.freeze({
    state: aggregateState,
    score: freezeScore({
      total: totalSum / count,
      usefulness: usefulnessSum / count,
      preference: preferenceSum / count,
    }),
    items: Object.freeze(items),
  });
}
