# ADR-0003: Deterministic Solver

- **Status:** Accepted (principle approved; implementation deferred)
- **Date:** 2026-08-12
- **Sprint:** Decision recorded in DND-1.1; implementation in DND-1.4

## Context

Adaptive reflow must be reproducible for debugging, tests, benchmarks, and future CI. Non-determinism would undermine property-based testing and trust.

## Decision

The adaptive solver must be deterministic for a given input layout, constraints, and configuration. Identical inputs produce identical outputs.

## Consequences

- Randomness, wall-clock timing, and unordered iteration must not affect results unless explicitly seeded and documented.
- Property-based tests (planned DND-1.3/1.4) will encode determinism invariants.
- No solver implementation in DND-1.1.
