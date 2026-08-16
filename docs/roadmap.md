# DnDGem Roadmap

## Phase status

| Phase   | Name                            | Status                           |
| ------- | ------------------------------- | -------------------------------- |
| Phase 0 | Product & Architecture Baseline | **CLOSED**                       |
| Phase 1 | Technical MVP                   | **CLOSED** (DND-1.1 → DND-1.8)   |
| Phase 2 | Public Alpha Readiness          | **PASS** — Public Alpha **LIVE** |
| Phase 3 | Adaptive Auto-Layout            | **ACTIVE** — sprint map APPROVED |

Phase 0 is **CLOSED — GO TO TECHNICAL MVP** (historical).

Phase 1 proved stable, deterministic, content-aware, constraint-driven adaptive layouts **without AI**.

Phase 2 is **COMPLETE**: npm Public Alpha `0.1.0-alpha.0` is live under dist-tag `alpha`, with docs, examples, playground, and feedback path.

Repository remains **PRIVATE** by explicit decision for this first Alpha. npm packages are public; GitHub source/Issues may be inaccessible externally (see [release notes](./releases/0.1.0-alpha.0.md)).

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

## Phase 2 — Public Alpha Readiness (PASS)

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
DND-2.4 Browser Matrix & Accessibility Baseline  COMPLETE
        ↓
DND-2.5 Public Alpha Release Gate                COMPLETE
            ↓
PHASE 2 PASS
            ↓
PUBLIC ALPHA LIVE
```

Canonical founder-driven order: **2.1 → 2.2 → 2.3 → 2.4 → 2.5** (later work may overlap technically; sequence remains authoritative).

### Public Alpha hard blockers (resolved)

- Clean engineering baseline
- Alpha API contract
- Release infrastructure / npm readiness
- Docs / Quick Start
- Vanilla + React examples
- Full CI
- Browser support statement
- Accessibility status
- Known limitations documentation
- npm Alpha publication (`0.1.0-alpha.0` / `@alpha`)
- Public playground + external feedback path

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
- **Status:** COMPLETE
- **Reference:** `docs/guides/browser-support.md`, `docs/guides/accessibility.md`, `docs/guides/browser-a11y-findings.md`.

### DND-2.5 — Public Alpha Release Gate

- **Objective:** Ship the first credible external npm Alpha.
- **Scope:** Final release acceptance; npm Alpha publication; release notes; simple public playground/demo; feedback path; Alpha checklist.
- **Out of scope:** Catch-all unfinished API/docs/browser work (those belong in 2.2–2.4); Auto-Layout; AI; Flutter.
- **Dependencies:** DND-2.2, DND-2.3, DND-2.4.
- **Closure:** npm `@dndgem/*@0.1.0-alpha.0` published under dist-tag `alpha`; Phase 2 exit checklist PASS; Public Alpha LIVE.
- **Status:** COMPLETE
- **Reference:** `docs/releases/0.1.0-alpha.0.md`, `docs/releases/dnd-2.5-stage-a-readiness.md`.
- **Registry note:** Official channel is `@alpha`. `latest` currently aliases the same sole prerelease; documented as a non-blocking limitation until a future stable release owns `latest`.

### Phase 2 exit gate — PHASE 2 PASS

**PASS.** Public Alpha is LIVE:

```text
PUBLIC ALPHA LIVE → external developer validation
        ↓
Phase 3 — Adaptive Auto-Layout (ACTIVE; sprint map APPROVED)
```

Post-release canonical domain follow-up (`dndgem.dev` / `playground.dndgem.dev`): **COMPLETE** — see [Public site & domain hosting](./architecture/public-site.md).

Phase 3 planning audit: **PASSED WITH ARCHITECTURAL REFINEMENTS** — see [phase-3-planning-audit.md](./architecture/phase-3-planning-audit.md). DND-3.1 contract: [auto-layout-contract.md](./architecture/auto-layout-contract.md). DND-3.2 engine: [auto-layout-engine.md](./architecture/auto-layout-engine.md). **Next sprint:** DND-3.3.

---

## Phase 3 — Adaptive Auto-Layout (ACTIVE)

Planning audit: **PASSED WITH ARCHITECTURAL REFINEMENTS** — see [phase-3-planning-audit.md](./architecture/phase-3-planning-audit.md).

**Entry gate:** READY. **Sprint map:** APPROVED (5 sprints). **Active sprint work:** DND-3.2 COMPLETE. **Next sprint:** DND-3.3 (not started).

Primary objective: reduce the authoring burden of complete desired rectangles while preserving deterministic constraint-aware solving.

Architectural principle (binding):

```text
Geometry + Constraints + Preferences + Previous
                    ↓
           Auto-Layout Enricher
                    ↓
             LayoutIntent
                    ↓
              solveLayout
                    ↓
           evaluateLayout
                    ↓
      VALID / DEGRADED / INVALID
```

Auto-Layout is **not** a second solver. Existing `solveLayout` / `evaluateLayout` remain authoritative. Auto-Layout stays **opt-in** for Phase 3 Alpha. AI is out of scope.

### Critical path

```text
PUBLIC ALPHA LIVE
        ↓
Phase 3 Planning Audit          PASSED WITH REFINEMENTS
        ↓
DND-3.1 Auto-Layout Contract & Core Model     COMPLETE (contract)
        ↓
DND-3.2 Deterministic Placement Engine        COMPLETE
        ↓
DND-3.3 Stability / Adaptive Reflow & Hybrid  NEXT
        ↓
DND-3.4 Drag / Partial Intent / DOM-React DX
        ↓
DND-3.5 Phase 3 Alpha Release Gate
            ↓
PHASE 3 PASS → next consumer Alpha (+ first real OIDC publish)
```

### Binding refinements (from planning audit)

1. **DND-3.1 is contract-only** — semantics, architecture, invariants, test model, API proposal; no production Auto-Layout API / incomplete stubs.
2. **Public enricher export is not yet approved** — classify as `PROPOSED PUBLIC ALPHA API / NOT YET APPROVED` until DND-3.1 proves necessity (name and shape TBD).
3. **Drag = strong persistent user intent**, not an absolute immutable pin; solver remains authoritative when geometry becomes infeasible.
4. **Provenance required** — source intent vs generated/effective placement must stay distinguishable so hybrid auto items are not promoted to persistent explicit intent by accident.

### DND-3.1 — Auto-Layout Contract & Core Model

- **Objective:** Close the Auto-Layout contract before any production implementation.
- **Scope:** Pipeline semantics; seven invariants (no second solver; solver authority; provenance; drag intent vs pin; partial/hybrid MVP; opt-in; no premature public API freeze); test model; API proposal only.
- **Out of scope:** Production Auto-Layout code in `packages/*/src`; public export freeze; DOM/React wiring; algorithm implementation; AI; Pin/Lock API.
- **Dependencies:** Phase 3 planning audit PASS.
- **Closure:** Contract document + ADR-0014 + invariants + test model + proposed (unfrozen) API boundary ready for DND-3.2.
- **Status:** COMPLETE (contract; merged)

### DND-3.2 — Deterministic Placement Engine

- **Objective:** Implement Core deterministic auto-placement (greedy first-fit around occupancy) behind the approved contract.
- **Scope:** Browser-independent enricher; stable item/probe ordering; reuse preferred/useful/minimal/measured sizing signals; provenance-preserving compose; Core tests and initial benches.
- **Out of scope:** Skyline / beam / best-fit; new priority public field; DOM/React product wiring; Pin/Lock; sizing DSL; public API freeze without review; second solver.
- **Dependencies:** DND-3.1.
- **Closure:** Deterministic placement MVP with provenance preserved; hard constraints honest.
- **Status:** COMPLETE
- **Reference:** [auto-layout-engine.md](./architecture/auto-layout-engine.md), [auto-layout-contract.md](./architecture/auto-layout-contract.md), [ADR-0014](./adr/ADR-0014-auto-layout-enrichment-provenance.md), [auto-layout baseline](./benchmarks/auto-layout-dnd-3.2.md).

### DND-3.3 — Stability / Adaptive Reflow & Hybrid

- **Objective:** Resize/reflow and hybrid explicit+automatic behavior with previous-layout stability **in Core**.
- **Scope:** Feasible retention of strong explicit intent; reflow when infeasible; hybrid occupancy; Core interaction of previous layout with generated/unplaced proposal completeness; optional internal hybrid candidate only if enricher+existing strategies are insufficient.
- **Out of scope:** DOM/React session product wiring; adapter consumption of `unplacedItemIds`; drag runtime integration (those belong to **DND-3.4**); animation; Large-N; second stability metric; Pin/Lock API.
- **Dependencies:** DND-3.2.
- **Closure:** Documented Core reflow/hybrid acceptance tests PASS.
- **Status:** NEXT (not started)

### DND-3.4 — Drag / Partial Intent / DOM-React DX

- **Objective:** Wire opt-in Auto-Layout through Vanilla session and React; confirm drag→strong intent; examples/playground/docs.
- **Scope:** `@dndgem/dom` / `@dndgem/react` opt-in options; parity; session retention of Source Intent + origins; adapter/session handling of proposal completeness / `unplacedItemIds`; DX for partial intent; limited browser smoke.
- **Out of scope:** Default-on Auto-Layout (breaking); keyboard/SR/mobile certification; React-only semantics; Core reflow algorithm ownership (DND-3.3).
- **Dependencies:** DND-3.3.
- **Closure:** Vanilla≡React opt-in path; guides address intent authoring without full coordinates.
- **Status:** PLANNED

### DND-3.5 — Phase 3 Alpha Release Gate

- **Objective:** Ship the Auto-Layout consumer Alpha and verify Trusted Publishing/OIDC on a real publish.
- **Scope:** Quality gates; Changesets version; develop→master CI; `@alpha` publish; release notes; API contract update; verify next package tarball/README metadata uses current DA62 / `dndgem.dev` identity (`support@dndgem.dev`, `https://playground.dndgem.dev/`, `https://dndgem.dev/`) — published `0.1.0-alpha.0` may still show legacy npm metadata and is not a DND-3.2 blocker.
- **Out of scope:** Fake OIDC-only release; taking ownership of `latest`; repository visibility change.
- **Dependencies:** DND-3.4.
- **Closure:** Phase 3 PASS; next `0.1.0-alpha.x` (Changesets-determined) live on `alpha`; OIDC verified.
- **Status:** PLANNED

### Phase 3 safe deferrals

- AI / LLM layout
- Pin / Lock / fixed / manual APIs
- Grouping / region intent product vocabulary
- CSS grid / flex clone or responsive sizing DSL
- Flutter / Vue / Angular / Svelte
- Large-N optimization
- Full keyboard drag / screen-reader drag product
- Mobile / touch certification

---

## Later phases (high-level)

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
