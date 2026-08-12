/**
 * Layout validity classification vocabulary (ADR-0002).
 *
 * Evaluation and scoring live in `evaluate.ts` (DND-1.3).
 * Severity for aggregation: INVALID > DEGRADED > VALID (explicit, not enum order).
 */
export type ValidityState = 'VALID' | 'DEGRADED' | 'INVALID';

export const VALIDITY_STATES = [
  'VALID',
  'DEGRADED',
  'INVALID',
] as const satisfies readonly ValidityState[];
