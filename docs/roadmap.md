# DnDGem Roadmap

## Phase status

| Phase   | Name                            | Status                                              |
| ------- | ------------------------------- | --------------------------------------------------- |
| Phase 0 | Product & Architecture Baseline | **CLOSED**                                          |
| Phase 1 | Technical MVP                   | **CLOSED** (DND-1.1 → DND-1.8)                      |
| Phase 2 | Public Alpha Readiness          | **ACTIVE** (DND-2.1–DND-2.3 complete; DND-2.4 next) |

Phase 0 is **CLOSED — GO TO TECHNICAL MVP** (historical).

Phase 1 proved stable, deterministic, content-aware, constraint-driven adaptive layouts **without AI**.

Phase 2 transforms the closed Technical MVP into a credible external developer Alpha through engineering hardening, API stabilization, release infrastructure, documentation, browser/accessibility baseline, and npm Alpha release.

Repository remains **PRIVATE** during Phase 2 preparation. npm Alpha and public repository visibility are separate future gates.

No committed calendar dates are attached to roadmap items.

---

## Phase 1 — Technical MVP (CLOSED)

### DND-1.1 — Repository & Engineering Foundation

- **Objective:** Establish monorepo, package boundaries, docs, quality gates, and Cursor rules.
- **Scope:** Tooling, empty package shells, playground/examples shells, CI, ADRs.
- **Out of scope:** Solver, constraints, DOM measurement, DnD, AI, Flutter, other framework adapters.
- **Dependencies:** Phase 0 GO decision.
- **Closure:** Engineering baseline ready; quality gates pass.
- **Status:** COMPLETE

### DND-1.2 — Core Domain & Constraint Model

- **Objective:** Define core domain types and content constraint model in `@dndgem/core`.
- **Scope:** Domain types, constraints, schemaVersion principle for future persistence.
- **Out of scope:** Solver algorithms, DOM/React behaviour; validity evaluation / scoring.
- **Dependencies:** DND-1.1.
- **Closure:** Constraint model documented and typed without renderer leakage.
- **Reference:** `docs/architecture/core-domain.md`.
- **Status:** COMPLETE

### DND-1.3 — Validity Engine & Layout Scoring

- **Objective:** Evaluate layouts as VALID / DEGRADED / INVALID with scoring.
- **Scope:** Validity engine, scoring; table-driven boundary tests (no solver).
- **Out of scope:** Adaptive candidate generation / reflow.
- **Dependencies:** DND-1.2.
- **Closure:** Deterministic validity/scoring for fixture layouts.
- **Reference:** `docs/architecture/core-domain.md`, ADR-0002, ADR-0009.
- **Status:** COMPLETE

### DND-1.4 — Adaptive Solver & Reflow

- **Objective:** Deterministic adaptive solver and responsive reflow.
- **Scope:** Candidate generation, solve, reflow; initial benchmarks.
- **Out of scope:** Browser measurement and pointer interaction.
- **Dependencies:** DND-1.3.
- **Closure:** Solver produces deterministic adapted layouts for fixtures.
- **Status:** COMPLETE
- **Reference:** `docs/architecture/core-domain.md`, ADR-0003, ADR-0010.

### DND-1.5 — DOM Measurement & Resize

- **Objective:** Normalize DOM measurements into core-compatible inputs; resize plumbing.
- **Scope:** `@dndgem/dom` measurement/resize adapters.
- **Out of scope:** Full DnD interaction integration.
- **Dependencies:** DND-1.4 (core contracts).
- **Closure:** DOM measurements feed core without leaking HTML semantics upward incorrectly.
- **Status:** COMPLETE
- **Reference:** `docs/architecture/dom-adapter.md`, ADR-0011.

### DND-1.6 — Drag & Drop Interaction

- **Objective:** Interaction adapter using planned `@dnd-kit/dom` behind DnDGem boundaries.
- **Scope:** DnDGem-owned interaction abstraction; dnd-kit as internal provider.
- **Out of scope:** Custom native DnD engine; exposing dnd-kit types publicly.
- **Dependencies:** DND-1.5.
- **Closure:** Drag interactions produce normalized layout proposals; Core solver accepts, reflows, or rejects.
- **Status:** COMPLETE
- **Reference:** `docs/architecture/dom-adapter.md`, ADR-0012.

### DND-1.7 — React / Vanilla Integration

- **Objective:** Public React/vanilla integration surfaces for Technical MVP demos.
- **Scope:** `@dndgem/react` bindings and vanilla consumption patterns.
- **Out of scope:** Vue/Angular/Svelte/Flutter adapters.
- **Dependencies:** DND-1.6.
- **Closure:** Playground/examples demonstrate adaptive layouts through public APIs.
- **Status:** COMPLETE
- **Reference:** `docs/architecture/dom-adapter.md`, ADR-0013.

### DND-1.8 — Technical Proof, Benchmarks & MVP Closure

- **Objective:** Prove Technical MVP with benchmarks and closure evidence.
- **Scope:** Benchmarks, proof scenarios, MVP gate review.
- **Out of scope:** Commercial platform features.
- **Dependencies:** DND-1.7.
- **Closure:** Phase 1 Technical MVP accepted or gaps explicitly listed.
- **Status:** COMPLETE
- **Reference:** `docs/technical-mvp/closure-report.md`, `docs/technical-mvp/acceptance-matrix.md`, `docs/benchmarks/technical-mvp-baseline.md`, `benchmarks/`

**Technical MVP:** CLOSED

---

## Phase 2 — Public Alpha Readiness (ACTIVE)

Primary objective: make the closed Technical MVP consumable by external developers via npm Alpha, docs, examples, and honest limitation statements.

### Critical path

```text
TECHNICAL MVP CLOSED
        ↓
DND-2.1 Engineering Baseline & CI Hardening   COMPLETE
        ↓
DND-2.2 Alpha API Contract & Release Infra    COMPLETE
        ↓
DND-2.3 Developer Experience & Documentation  COMPLETE
        ↓
DND-2.4 Browser Matrix & Accessibility Baseline  NEXT
        ↓
DND-2.5 Public Alpha Release Gate
            ↓
PHASE 2 PASS
            ↓
PUBLIC ALPHA
```

Canonical founder-driven order: **2.1 → 2.2 → 2.3 → 2.4 → 2.5** (later work may overlap technically; sequence remains authoritative).

### Public Alpha hard blockers (Phase 2 aims to resolve)

- Clean engineering baseline
- Alpha API contract
- Release infrastructure / npm readiness
- Docs / Quick Start
- Vanilla + React examples
- Full CI
- Browser support statement
- Accessibility status
- Known limitations documentation

### Safe Alpha deferrals

- Full keyboard drag product
- Full SSR / hydration support
- Deterministic Auto-Layout
- AI
- Flutter
- Vue / Angular / Svelte
- Animation framework
- Persistence helpers
- Large-N optimization
- Nested layouts

### DND-2.1 — Engineering Baseline & CI Hardening

- **Objective:** Clean engineering baseline, full authoritative CI, Phase 2 roadmap/governance transition.
- **Scope:** EOL / Prettier normalization; full quality gate in GitHub CI; Phase 2 roadmap; post-MVP documentation reconciliation.
- **Out of scope:** Auto-Layout, AI, Flutter, npm publish, Alpha API freeze, package version bumps, product algorithm changes.
- **Dependencies:** Phase 1 Technical MVP CLOSED.
- **Closure:** Global quality gate clean; CI authoritative; Phase 2 activated.
- **Status:** COMPLETE

### DND-2.2 — Alpha API Contract & Release Infrastructure

- **Objective:** Define a stable-enough Alpha public contract and prepare npm publishing.
- **Scope:** Public exports and types; package boundaries; alpha semver policy (expected `0.1.0-alpha.x`); package metadata; Changesets/release process; npm publish workflow; dry-run validation.
- **Out of scope:** Auto-Layout, AI, new solver semantics, actual public Alpha release.
- **Dependencies:** DND-2.1.
- **Closure:** Documented Alpha API contract; release tooling ready for dry-run / publish path.
- **Status:** COMPLETE
- **Reference:** `docs/architecture/alpha-api-contract.md`, `docs/architecture/release-strategy.md`.

### DND-2.3 — Developer Experience & Documentation

- **Objective:** Make DnDGem understandable and integrable; align CI with local feature gate + GitHub promotion gate.
- **Scope:** Quick Start; mental model; constraints; VALID / DEGRADED / INVALID; solver behavior; Vanilla / React integration; resize; drag; explicit intent vs previous layout; troubleshooting; performance expectations; examples; CI trigger policy (feature → develop local-only; develop → master GitHub CI).
- **Out of scope:** Full docs website; constraint IDE; Auto-Layout; npm publish.
- **Dependencies:** DND-2.2 (API surface known).
- **Closure:** A new developer can reach a first working DnDGem layout from docs; CI promotion policy documented and implemented.
- **Status:** COMPLETE
- **Reference:** `docs/guides/`, `docs/architecture/testing-strategy.md`.
- **Note:** Private design-partner conversations may begin during DND-2.3 → DND-2.5.

### DND-2.4 — Browser Matrix & Accessibility Baseline

- **Objective:** Define honest Alpha browser and accessibility support.
- **Scope:** Firefox smoke; WebKit smoke; focus semantics audit; ARIA baseline; keyboard-path assessment; documented limitations.
- **Out of scope:** Full keyboard drag product; full WCAG certification; mobile browser matrix (unless evidence requires).
- **Dependencies:** DND-2.1 infrastructure; preferably after DND-2.2 for public surface clarity.
- **Closure:** Published browser/a11y statements with credible smoke evidence.
- **Status:** PLANNED (NEXT)

### DND-2.5 — Public Alpha Release Gate

- **Objective:** Ship the first credible external npm Alpha.
- **Scope:** Final release acceptance; npm Alpha publication; release notes; simple public playground/demo; feedback path; Alpha checklist.
- **Out of scope:** Catch-all unfinished API/docs/browser work (those belong in 2.2–2.4); Auto-Layout; AI; Flutter.
- **Dependencies:** DND-2.2, DND-2.3, DND-2.4.
- **Closure:** npm `@dndgem/*` Alpha published; Phase 2 exit checklist PASS.
- **Status:** PLANNED

### Phase 2 exit gate — PHASE 2 PASS

Requires:

- Engineering baseline clean
- Alpha API contract stabilized
- Release infrastructure ready
- npm Alpha packages published
- Quick Start / docs ready
- Vanilla + React examples ready
- Browser / a11y status documented
- Public Alpha acceptance checklist PASS

Then:

```text
PUBLIC ALPHA → external developer validation
```

---

## Later phases (high-level)

### Phase 3 — Adaptive Auto-Layout

Public Alpha first; deterministic Auto-Layout second.

High-level scope may include:

- Layout strategy vocabulary
- Generated `LayoutIntent`
- Grouping / relationship model
- Region intent
- Deterministic strategy candidates
- Proposal explainability
- Strategy validation via existing Core

Architectural principle:

```text
Auto-Layout proposes intent
→ Core validates
→ Core scores
→ Core solves
```

### Phase 4 — AI-Assisted Layout Intelligence

AI belongs **after** deterministic Auto-Layout.

AI may help with semantic relationships, constraint suggestions, priority inference, and high-level intent proposals. AI must **not** become mandatory for drag, resize, validation, scoring, reflow, or deterministic solving.

Preferred architecture:

```text
AI / heuristic
        ↓
proposed semantic / layout intent
        ↓
deterministic Core validation → scoring → solver
        ↓
ResolvedLayout
```

### Flutter ecosystem track

Flutter does **not** block the first JS Public Alpha and does **not** need to wait for AI.

After Public Alpha:

```text
           ┌→ Adaptive Auto-Layout (Phase 3)
Public Alpha
           └→ Flutter architecture / renderer work (Core-contract dependent)
```

### Additional framework adapters

Vue / Angular / Svelte remain **post-alpha** and **demand-driven**.

### Commercial / cloud

Layout CI, teams, enterprise, billing — not Phase 2.
