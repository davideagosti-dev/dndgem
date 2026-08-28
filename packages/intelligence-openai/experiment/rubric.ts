/**
 * Frozen success rubric for DND-4.4 Stage B (before live inference).
 *
 * Metric precedence (do not change after seeing model results):
 * 1. fewer unplaced items
 * 2. better validity (VALID > DEGRADED > INVALID)
 * 3. higher existing Core score (evaluation.score.total)
 */
export const RUBRIC_VERSION = '1.0.0' as const;

export const LIVE_RUNS_PER_FIXTURE = 5 as const;

export const SCHEMA_VALID_RATE_MIN = 0.9 as const;

export type ExperimentClassification =
  | 'KEEP'
  | 'CHANGE MODEL'
  | 'CHANGE PROMPT/SCHEMA'
  | 'MODEL VALUE INCONCLUSIVE'
  | 'DEFER MODEL ASSISTANCE'
  | 'LIVE EVIDENCE PENDING';

export const VALIDITY_RANK = Object.freeze({
  VALID: 2,
  DEGRADED: 1,
  INVALID: 0,
} as const);

export type CoreOutcomeLike = {
  readonly unplacedCount: number;
  readonly validity: 'VALID' | 'DEGRADED' | 'INVALID';
  readonly scoreTotal: number;
};

/**
 * Compare Core outcomes with frozen metric precedence.
 * Returns negative if left is worse, positive if left is better, 0 if equal.
 */
export function compareCoreOutcomes(left: CoreOutcomeLike, right: CoreOutcomeLike): number {
  if (left.unplacedCount !== right.unplacedCount) {
    return right.unplacedCount - left.unplacedCount;
  }
  const leftValidity = VALIDITY_RANK[left.validity];
  const rightValidity = VALIDITY_RANK[right.validity];
  if (leftValidity !== rightValidity) {
    return leftValidity - rightValidity;
  }
  if (left.scoreTotal !== right.scoreTotal) {
    return left.scoreTotal > right.scoreTotal ? 1 : -1;
  }
  return 0;
}

export function isStrictlyBetter(candidate: CoreOutcomeLike, baseline: CoreOutcomeLike): boolean {
  return compareCoreOutcomes(candidate, baseline) > 0;
}

export function isStrictlyWorse(candidate: CoreOutcomeLike, baseline: CoreOutcomeLike): boolean {
  return compareCoreOutcomes(candidate, baseline) < 0;
}

/**
 * KEEP candidate checks (frozen before live run):
 * A. On F2/F5: at least one strict improvement vs Baseline B; no aggregate regression.
 * B. On F1/F3/F4: no material regression vs Baseline B; source preservation absolute.
 * C. Schema-valid rate ≥ 90% before normalization/fallback.
 * D. F6–F8 always retain usable deterministic layout (offline).
 * E/F. Architecture + replay (verified separately).
 */
export const SUCCESS_RUBRIC_TEXT = Object.freeze(`
KEEP only if:
A. Order-sensitive (F2, F5): model strictly better than Baseline B on ≥1 of F2/F5,
   AND not strictly worse in aggregate across F2+F5
   (precedence: fewer unplaced → better validity → higher Core score).
B. Safety (F1, F3, F4): no material regression vs Baseline B; source placements absolute.
C. Schema reliability: ≥90% valid structured responses before normalization/fallback.
D. Fallback: F6–F8 always retain usable deterministic layout.
E. Architecture: no second solver / provenance / hot-path / browser key / boundary violations.
F. Replay: captured proposal downstream replay is deterministic.
`) as string;
