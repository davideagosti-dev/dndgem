# ADR-0009: Validity Scoring Convention

- **Status:** Accepted
- **Date:** 2026-08-12
- **Sprint:** DND-1.3

## Context

DND-1.3 must produce deterministic scores that DND-1.4 can later use to compare candidate placements. Score direction, range, and INVALID handling must be unambiguous so solvers and tests do not reverse-engineer convention from numbers alone.

## Decision

1. **Direction:** higher is better.
2. **Range:** every published score component and total is finite and in `[0, 1]`.
3. **INVALID:** hard geometric failure forces `total`, `usefulness`, and `preference` to `0` (no `NaN` / `±Infinity`).
4. **Non-invalid total:**  
   `total = 0.7 * usefulness + 0.3 * preference`  
   (`SCORE_USEFULNESS_WEIGHT` / `SCORE_PREFERENCE_WEIGHT`).
5. **Preference** affects score (and structured reasons) only — never validity state by itself.
6. **No ranking / tie-break** in DND-1.3; equal scores are allowed.

Formulas are documented in `docs/architecture/core-domain.md`.

## Consequences

- Candidate comparison in DND-1.4 can sort by `score.total` descending.
- Serialization and debugging stay finite and portable.
- Changing weights later is an ADR-level change, not a silent tweak.
