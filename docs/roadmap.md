# DnDGem Roadmap

## Phase status

Phase 0 is **CLOSED — GO TO TECHNICAL MVP**.

Phase 1 is the Technical MVP: prove stable, deterministic, content-aware, constraint-driven adaptive layouts **without AI**.

## Phase 1 — Technical MVP

### DND-1.1 — Repository & Engineering Foundation

- **Objective:** Establish monorepo, package boundaries, docs, quality gates, and Cursor rules.
- **Scope:** Tooling, empty package shells, playground/examples shells, CI, ADRs.
- **Out of scope:** Solver, constraints, DOM measurement, DnD, AI, Flutter, other framework adapters.
- **Dependencies:** Phase 0 GO decision.
- **Closure:** Engineering baseline ready; quality gates pass.

### DND-1.2 — Core Domain & Constraint Model

- **Objective:** Define core domain types and content constraint model in `@dndgem/core`.
- **Scope:** Domain types, constraints, schemaVersion principle for future persistence.
- **Out of scope:** Solver algorithms, DOM/React behaviour; validity evaluation / scoring.
- **Dependencies:** DND-1.1.
- **Closure:** Constraint model documented and typed without renderer leakage.
- **Reference:** `docs/architecture/core-domain.md`.

### DND-1.3 — Validity Engine & Layout Scoring

- **Objective:** Evaluate layouts as VALID / DEGRADED / INVALID with scoring.
- **Scope:** Validity engine, scoring; table-driven boundary tests (no solver).
- **Out of scope:** Adaptive candidate generation / reflow.
- **Dependencies:** DND-1.2.
- **Closure:** Deterministic validity/scoring for fixture layouts.
- **Reference:** `docs/architecture/core-domain.md`, ADR-0002, ADR-0009.

### DND-1.4 — Adaptive Solver & Reflow

- **Objective:** Deterministic adaptive solver and responsive reflow.
- **Scope:** Candidate generation, solve, reflow; initial benchmarks.
- **Out of scope:** Browser measurement and pointer interaction.
- **Dependencies:** DND-1.3.
- **Closure:** Solver produces deterministic adapted layouts for fixtures.

### DND-1.5 — DOM Measurement & Resize

- **Objective:** Normalize DOM measurements into core-compatible inputs; resize plumbing.
- **Scope:** `@dndgem/dom` measurement/resize adapters.
- **Out of scope:** Full DnD interaction integration.
- **Dependencies:** DND-1.4 (core contracts).
- **Closure:** DOM measurements feed core without leaking HTML semantics upward incorrectly.

### DND-1.6 — Drag & Drop Interaction

- **Objective:** Interaction adapter using planned `@dnd-kit/dom` behind DnDGem boundaries.
- **Scope:** DnDGem-owned interaction abstraction; dnd-kit as internal provider.
- **Out of scope:** Custom native DnD engine; exposing dnd-kit types publicly.
- **Dependencies:** DND-1.5.
- **Closure:** Drag/resize interactions respect validity constraints via adapters.

### DND-1.7 — React / Vanilla Integration

- **Objective:** Public React/vanilla integration surfaces for Technical MVP demos.
- **Scope:** `@dndgem/react` bindings and vanilla consumption patterns.
- **Out of scope:** Vue/Angular/Svelte/Flutter adapters.
- **Dependencies:** DND-1.6.
- **Closure:** Playground/examples demonstrate adaptive layouts through public APIs.

### DND-1.8 — Technical Proof, Benchmarks & MVP Closure

- **Objective:** Prove Technical MVP with benchmarks and closure evidence.
- **Scope:** Benchmarks, proof scenarios, MVP gate review.
- **Out of scope:** Commercial platform features.
- **Dependencies:** DND-1.7.
- **Closure:** Phase 1 Technical MVP accepted or gaps explicitly listed.

## Later phases (summary only)

- Broader framework adapters (including Flutter)
- Optional AI assistance outside the critical path
- Commercial/cloud offerings (Layout CI, teams, enterprise) — not Phase 1

No committed calendar dates are attached to these items.
