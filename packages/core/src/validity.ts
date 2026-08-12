/**
 * Planned layout validity classification vocabulary (ADR-0002).
 *
 * DND-1.2 exposes the type only. Evaluation, scoring, and degradation
 * algorithms belong to DND-1.3 — do not add them here.
 */
export type ValidityState = 'VALID' | 'DEGRADED' | 'INVALID';

export const VALIDITY_STATES = [
  'VALID',
  'DEGRADED',
  'INVALID',
] as const satisfies readonly ValidityState[];
