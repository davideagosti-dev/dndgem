# ADR-0010: Adaptive Solver Selection Policy

- **Status:** Accepted
- **Date:** 2026-08-13
- **Sprint:** DND-1.4

## Context

DND-1.3 evaluates a supplied layout. DND-1.4 must choose among bounded candidates using that evaluator. Ranking, stability, reflow, and unsatisfiable behavior must be explicit so identical inputs produce identical outputs (ADR-0003) without inventing a second scoring engine (ADR-0009).

## Decision

1. **Entry point:** `solveLayout({ intent, previous? })` in `@dndgem/core`.
2. **Candidates:** Bounded deterministic named strategies (internal policy list): optional preserve-previous / preserve-desired, then row/column packs under preferred, useful, and minimal sizing modes. Duplicate placements from different strategies are allowed; ordinals keep selection total-ordered.
3. **Evaluation:** Every candidate is scored with `evaluateLayout` (DND-1.3). No duplicate validity/scoring engine.
4. **Ranking precedence (complete comparator):**
   1. Validity tier: `VALID` > `DEGRADED` > `INVALID` (explicit rank map)
   2. Higher `score.total`
   3. Lower stability distance vs `previous` (sum of squared deltas of x/y/width/height; `0` when no previous)
   4. Lower generation ordinal
5. **Stability:** Prefer less movement when validity and score tie. Only item ids present in both previous and candidate contribute; unmatched ids are skipped (no general edit-distance model). Stability must never protect an `INVALID` layout when a better-tier candidate exists.
6. **Reflow:** `reflowed === true` when `previous` was supplied and the winner’s **placements** differ from previous placements (not space-only identity). Preserve candidates shrink axes that exceed the current space so container changes can trigger adaptation; caller-owned previous is never mutated.
7. **Unsatisfiable:** If every candidate is `INVALID`, return the best deterministic `INVALID` result with selection code `UNSATISFIABLE` (not a `DomainError`).
8. **Malformed input:** Structural/domain failures remain `DomainError`.
9. **Empty layout:** Preserve DND-1.3 policy — `VALID` with score `1`.

## Consequences

- Tie-breaking is documented and tested; sort stability alone is not policy.
- Explainability is limited to winner id, selection reason, reflow flag, and per-candidate summaries. Strategy names appear on summaries; the strategy list itself is not a public Core export.
- Extending strategy sets or ranking weights is an ADR-level change.
