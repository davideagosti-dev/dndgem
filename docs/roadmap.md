# DnDGem Roadmap

## Phase status

| Phase   | Name                            | Status                                                           |
| ------- | ------------------------------- | ---------------------------------------------------------------- |
| Phase 0 | Product & Architecture Baseline | **CLOSED**                                                       |
| Phase 1 | Technical MVP                   | **CLOSED** (DND-1.1 → DND-1.8)                                   |
| Phase 2 | Public Alpha Readiness          | **PASS** — Public Alpha **LIVE**                                 |
| Phase 3 | Adaptive Auto-Layout            | **COMPLETE / RELEASED** (`0.1.0-alpha.1`)                        |
| —       | Framework Expansion Gate        | **COMPLETE** (DND-FX.1–FX.6; valid public Alpha `0.1.0-alpha.3`) |
| Phase 4 | AI-Assisted Layout Intelligence | **ACTIVE** — DND-4.1 contract COMPLETE; **DND-4.2 COMPLETE**     |

Phase 0 is **CLOSED — GO TO TECHNICAL MVP** (historical).

Phase 1 proved stable, deterministic, content-aware, constraint-driven adaptive layouts **without AI**.

Phase 2 is **COMPLETE**: first npm Public Alpha `0.1.0-alpha.0` shipped under dist-tag `alpha`.

Phase 3 is **COMPLETE / RELEASED**: Adaptive Auto-Layout is live on npm as **`0.1.0-alpha.1`** (`@alpha`), published via Trusted Publishing / OIDC (see [0.1.0-alpha.1](./releases/0.1.0-alpha.1.md)).

Framework Expansion is **COMPLETE**: Cross-framework Alpha **`0.1.0-alpha.3`** is the valid public release (`@alpha`). `0.1.0-alpha.2` is **superseded**.

Phase 4 is **ACTIVE**: **DND-4.1** (Layout Intelligence Contract & Architecture) is **COMPLETE**. **DND-4.2** (Deterministic Intelligence Planner) is **COMPLETE**. Phase 4 does **not** require an LLM.

During Phase 2 and through Framework Expansion, the GitHub repository remained **PRIVATE** by explicit decision while npm packages were public. After Alpha validation (`0.1.0-alpha.3`), the repository transitions to **public open-source** development so source, Issues, and history are transparent.

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
Phase 3 — Adaptive Auto-Layout (COMPLETE / RELEASED — 0.1.0-alpha.1)
```

Post-release canonical domain follow-up (`dndgem.dev` / `playground.dndgem.dev`): **COMPLETE** — see [Public site & domain hosting](./architecture/public-site.md).

Phase 3 planning audit: **PASSED WITH ARCHITECTURAL REFINEMENTS** — see [phase-3-planning-audit.md](./architecture/phase-3-planning-audit.md). DND-3.1 contract: [auto-layout-contract.md](./architecture/auto-layout-contract.md). DND-3.2/DND-3.3 engine: [auto-layout-engine.md](./architecture/auto-layout-engine.md). Release notes: [0.1.0-alpha.1](./releases/0.1.0-alpha.1.md).

---

## Phase 3 — Adaptive Auto-Layout (COMPLETE / RELEASED)

Planning audit: **PASSED WITH ARCHITECTURAL REFINEMENTS** — see [phase-3-planning-audit.md](./architecture/phase-3-planning-audit.md).

**Entry gate:** READY. **Sprint map:** APPROVED (5 sprints). **Status:** DND-3.1–DND-3.5 **COMPLETE**; npm `0.1.0-alpha.1` live on `@alpha`.

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
DND-3.3 Stability / Adaptive Reflow & Hybrid  COMPLETE
        ↓
DND-3.4 Drag / Partial Intent / DOM-React DX  COMPLETE
        ↓
DND-3.5 Phase 3 Alpha Release Gate            COMPLETE
            ↓
PHASE 3 COMPLETE / RELEASED → 0.1.0-alpha.1 @alpha (OIDC verified)
```

### Binding refinements (from planning audit)

1. **DND-3.1 is contract-only** — semantics, architecture, invariants, test model, API proposal; no production Auto-Layout API / incomplete stubs.
2. **Minimal public enricher export approved (DND-3.4)** — `createAutoLayoutProposal` + types; DOM/React `autoLayout` opt-in. Broader freeze remains an explicit later review. Published on npm as of `0.1.0-alpha.1`.
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
- **Out of scope:** DOM/React session product wiring; adapter consumption of proposal completeness; drag runtime integration (those belong to **DND-3.4**); animation; Large-N; second stability metric; Pin/Lock API.
- **Dependencies:** DND-3.2.
- **Closure:** Documented Core reflow/hybrid acceptance tests PASS.
- **Status:** COMPLETE
- **Reference:** [auto-layout-engine.md](./architecture/auto-layout-engine.md), [auto-layout-contract.md](./architecture/auto-layout-contract.md), [ADR-0014](./adr/ADR-0014-auto-layout-enrichment-provenance.md), [auto-layout baseline](./benchmarks/auto-layout-dnd-3.3.md).

### DND-3.4 — Drag / Partial Intent / DOM-React DX

- **Objective:** Wire opt-in Auto-Layout through Vanilla session and React; confirm drag→strong intent; examples/playground/docs.
- **Scope:** `@dndgem/dom` / `@dndgem/react` opt-in options; parity; session retention of Source Intent + origins; adapter/session handling of proposal completeness / `proposalUnplacedItemIds`; DX for partial intent; limited browser smoke.
- **Out of scope:** Default-on Auto-Layout (breaking); keyboard/SR/mobile certification; React-only semantics; Core reflow algorithm ownership (DND-3.3); DND-3.5 publish.
- **Dependencies:** DND-3.3.
- **Closure:** Vanilla≡React opt-in path; guides address intent authoring without full coordinates.
- **Status:** COMPLETE
- **Reference:** [alpha-api-contract.md](./architecture/alpha-api-contract.md), [auto-layout-engine.md](./architecture/auto-layout-engine.md), [Vanilla](./guides/vanilla.md), [React](./guides/react.md).

### DND-3.5 — Phase 3 Alpha Release Gate

- **Objective:** Ship the Auto-Layout consumer Alpha and verify Trusted Publishing/OIDC on a real publish.
- **Scope:** Quality gates; Changesets version; develop→master CI; `@alpha` publish; release notes; API contract update; verify next package tarball/README metadata uses current DA62 / `dndgem.dev` identity (`support@dndgem.dev`, `https://playground.dndgem.dev/`, `https://dndgem.dev/`) — published `0.1.0-alpha.0` may still show legacy npm metadata and is not a DND-3.2 blocker.
- **Out of scope:** Fake OIDC-only release; taking ownership of `latest`; repository visibility change.
- **Dependencies:** DND-3.4.
- **Closure:** Phase 3 PASS; `0.1.0-alpha.1` live on `alpha`; Trusted Publishing / OIDC verified (workflow run `31956912662`).
- **Status:** COMPLETE
- **Reference:** [0.1.0-alpha.1 release notes](./releases/0.1.0-alpha.1.md).

### Phase 3 safe deferrals

- AI / LLM layout
- Pin / Lock / fixed / manual APIs
- Grouping / region intent product vocabulary
- CSS grid / flex clone or responsive sizing DSL
- Flutter (separate ecosystem track)
- Vue / Angular / Svelte (**moved** to the Framework Expansion Gate below; not Phase 3 work)
- Large-N optimization
- Full keyboard drag / screen-reader drag product
- Mobile / touch certification

---

## Framework Expansion Gate (unnumbered)

Planning audit: **PASSED WITH REFINEMENTS** — see [framework-expansion-planning-audit.md](./architecture/framework-expansion-planning-audit.md).

**Numbering (binding):** this gate is **not** Phase 4. Phase 4 remains AI. Sprint IDs are `DND-FX.1` … `DND-FX.6`. Flutter remains a separate track.

Primary objective: prove one Core + one DOM session can support multiple thin idiomatic JS/DOM adapters without framework-specific layout semantics.

```text
Phase 3 COMPLETE / RELEASED
        ↓
Framework Expansion Gate
        ↓
Phase 4 — AI-Assisted Layout Intelligence
```

Contract: [framework-adapter-contract.md](./architecture/framework-adapter-contract.md). ADRs: [0015](./adr/ADR-0015-universal-framework-adapter-contract.md), [0016](./adr/ADR-0016-framework-package-topology.md), [0017](./adr/ADR-0017-ssr-browser-runtime-boundary.md).

### Critical path

```text
DND-FX.1 Shared Framework Adapter Contract & Architecture Gate   COMPLETE
        ↓
DND-FX.2 Vue Adapter                                             COMPLETE
        ↓
DND-FX.3 Angular Adapter                                         COMPLETE
        ↓
DND-FX.4 Svelte Adapter                                          COMPLETE
        ↓
DND-FX.5 Meta-Framework Compatibility Validation                 COMPLETE
        ↓
DND-FX.6 Cross-Framework Alpha Release Gate                      COMPLETE
```

Meta-frameworks (Next.js, Nuxt, SvelteKit) are **compatibility environments**, not packages. Default: no `@dndgem/next`, `@dndgem/nuxt`, `@dndgem/sveltekit`.

### DND-FX.1 — Shared Framework Adapter Contract & Architecture Gate

- **Objective:** Freeze behavioral parity, package topology, SSR/client-session rules, and repo/release gates before any new adapter package exists.
- **Scope:** Decision record; adapter contract; ADR-0015/0016/0017; boundary/ESLint/publish topology; current-state doc reconciliation; DOM Node import-safety test.
- **Out of scope:** `@dndgem/vue|angular|svelte`; Core algorithm changes; AI; Flutter; npm publish.
- **Dependencies:** Phase 3 COMPLETE (`0.1.0-alpha.1`).
- **Closure:** Contract + ADRs accepted; DND-FX.2 can start without re-deciding cross-framework semantics.
- **Status:** **COMPLETE**

### DND-FX.2 — Vue Adapter

- **Objective:** Thin idiomatic `@dndgem/vue` with DOM/React behavioral parity.
- **Out of scope:** Nuxt package; Angular/Svelte; default-on Auto-Layout; publish.
- **Dependencies:** DND-FX.1.
- **Closure:** `@dndgem/vue` implemented in-repo (`0.0.0`, unpublished); wait-for-all session over `createLayoutSession`; Auto-Layout opt-in; Nuxt not validated.
- **Status:** **COMPLETE**

### DND-FX.3 — Angular Adapter

- **Objective:** Thin idiomatic `@dndgem/angular` (DI/directives/signals, zoneless-safe).
- **Out of scope:** Angular Universal certification; Svelte; default-on Auto-Layout; publish.
- **Dependencies:** DND-FX.1.
- **Closure:** `@dndgem/angular` implemented in-repo (`0.0.0`, unpublished); board-local DI; standalone host directives; signals; zoneless-validated; wait-for-all session over `createLayoutSession`; Auto-Layout opt-in; Angular Universal not validated.
- **Status:** **COMPLETE**

### DND-FX.4 — Svelte Adapter

- **Objective:** Thin idiomatic `@dndgem/svelte` (Svelte 5 context + actions).
- **Out of scope:** SvelteKit package; default-on Auto-Layout; publish.
- **Dependencies:** DND-FX.1.
- **Closure:** `@dndgem/svelte` implemented in-repo (`0.0.0`, unpublished); Svelte 5 provider + actions; wait-for-all session over `createLayoutSession`; Auto-Layout opt-in; SvelteKit not validated.
- **Status:** **COMPLETE**

### DND-FX.5 — Meta-Framework Compatibility Validation

- **Objective:** Next.js / Nuxt / SvelteKit as environments (import-safe, client session, dispose on navigation).
- **Out of scope:** Dedicated meta-framework packages (`@dndgem/next`, `@dndgem/nuxt`, `@dndgem/sveltekit`); server-side layout solving; Angular Universal; npm publish.
- **Dependencies:** Corresponding base adapters (React already exists for Next.js).
- **Closure:** Production fixtures prove client-session integration, SSR import/render safety, hydration, and route dispose/recreate without dedicated packages. Dedicated `@dndgem/next|nuxt|sveltekit` packages are **not required**.
- **Status:** **COMPLETE**
- **Reference:** [Meta-frameworks](./guides/meta-frameworks.md), [ADR-0017](./adr/ADR-0017-ssr-browser-runtime-boundary.md).

### DND-FX.6 — Cross-Framework Alpha Release Gate

- **Objective:** Join existing public adapters to the Changesets fixed group; Trusted Publishing; `@alpha` publish.
- **Out of scope:** `latest` dist-tag; public repository; AI.
- **Dependencies:** DND-FX.2–FX.5 as approved.
- **Closure:** Six-package lockstep **`0.1.0-alpha.3`** published via GitHub Actions OIDC (`publish.yml` / pnpm publish). `0.1.0-alpha.2` is **SUPERSEDED** (Vue/Angular/Svelte bootstrap artifacts contained unresolved `workspace:*`). External registry install and consumer smokes **PASS**. Pack validation asserts no `workspace:` in packed metadata. `latest` was not mutated.
- **Status:** **COMPLETE**
- **Reference:** [0.1.0-alpha.3](./releases/0.1.0-alpha.3.md), [0.1.0-alpha.2](./releases/0.1.0-alpha.2.md) (superseded).

---

## Phase 4 — AI-Assisted Layout Intelligence (ACTIVE)

Planning audit: **PASSED WITH ARCHITECTURAL REFINEMENTS** — see [phase-4-planning-audit.md](./architecture/phase-4-planning-audit.md).

**Entry gate:** READY (Phase 3 COMPLETE; Framework Expansion COMPLETE; public Alpha `0.1.0-alpha.3`). **Sprint map:** APPROVED (5 sprints). **Status:** DND-4.1 **COMPLETE** (contract); DND-4.2 **COMPLETE**; DND-4.3 **COMPLETE**; DND-4.4 **COMPLETE** (experimental classification `DEFER MODEL ASSISTANCE`; no default model-assisted product capability); DND-4.5 not started.

Primary objective: optional higher-level structural/semantic/application planning **without** replacing deterministic solving.

Architectural principle (binding):

```text
Intelligence proposes.
Deterministic DnDGem validates and resolves.
```

```text
Application / semantic hints
            ↓
Optional Intelligence Planner
            ↓
Planning Proposal (UNTRUSTED / ADVISORY)
            ↓
validation + normalization
            ↓
Phase 3 Auto-Layout enrichment (when applicable)
            ↓
solveLayout → evaluateLayout
            ↓
VALID / DEGRADED / INVALID → ResolvedLayout
```

Phase 4 does **not** mean DnDGem requires an LLM. Heuristic/deterministic planning is the preferred first implementation (DND-4.2). Model-based intelligence is optional. Intelligence must not become mandatory for drag, resize, validation, scoring, reflow, or deterministic solving.

Contract: [layout-intelligence-contract.md](./architecture/layout-intelligence-contract.md). ADR: [ADR-0018](./adr/ADR-0018-layout-intelligence-boundary.md).

### Critical path

```text
Framework Expansion COMPLETE (0.1.0-alpha.3)
        ↓
Phase 4 Planning Audit          PASSED WITH REFINEMENTS
        ↓
DND-4.1 Layout Intelligence Contract & Architecture   COMPLETE (contract)
        ↓
DND-4.2 Deterministic Intelligence Planner            COMPLETE
        ↓
DND-4.3 Planner Contract & Optional Integration       COMPLETE
        ↓
DND-4.4 Model-Assisted Planning Experiment            COMPLETE (DEFER MODEL ASSISTANCE)
        ↓
DND-4.5 Phase 4 Validation & Alpha Gate               not started
```

### Binding refinements (from planning audit)

1. **DND-4.1 is contract-only** — no production AI code, provider SDK, network integration, or intelligence package skeleton.
2. **Preferred package direction** — future optional intelligence layer depending on Core (Option B); consumer-owned planners as escape hatch (Option C); not inside Core by default.
3. **Provider-neutral** — no production AI provider selected in DND-4.1.
4. **Phase 3 provenance preserved** — intelligence does not silently invent a new placement origin.
5. **Maturity split** — deterministic DnDGem may progress toward Beta independently of model-based intelligence.

### DND-4.1 — Layout Intelligence Contract & Architecture

- **Objective:** Close the Phase 4 contract before any planner implementation.
- **Scope:** Taxonomy; options audit; invariants I1–I12; planning input/output; trust boundary; lifecycle; privacy; accessibility; provider strategy; Beta maturity policy; sprint map; ADR; roadmap reconciliation.
- **Out of scope:** Production intelligence package; AI SDK; network; LLM prompts; solver/validity changes; framework-specific intelligence; Flutter; publish/tag/PR.
- **Dependencies:** Phase 3 COMPLETE; Framework Expansion COMPLETE.
- **Closure:** Contract + ADR-0018 + planning audit accepted; DND-4.2 can start without re-deciding authority/trust/privacy/package placement.
- **Status:** COMPLETE (contract)
- **Reference:** [layout-intelligence-contract.md](./architecture/layout-intelligence-contract.md), [phase-4-planning-audit.md](./architecture/phase-4-planning-audit.md), [ADR-0018](./adr/ADR-0018-layout-intelligence-boundary.md).

### DND-4.2 — Deterministic Intelligence Planner

- **Objective:** Bounded deterministic/heuristic planner that emits Planning Proposals only.
- **Out of scope:** Remote model providers; solver semantic change; default-on intelligence.
- **Dependencies:** DND-4.1.
- **Status:** **COMPLETE** — private `@dndgem/intelligence` workspace package; prominence heuristic; optional Core `automaticItemOrder`; closure gate passed.
- **Reference:** [deterministic-planner.md](./architecture/deterministic-planner.md)

### DND-4.3 — Planner Contract & Optional Integration

- **Objective:** Stabilize optional integration for first-party and consumer-supplied planners.
- **Out of scope:** Provider lock-in; hot-path planning; DOM/content scraping defaults; OpenAI/model SDKs.
- **Dependencies:** DND-4.2.
- **Status:** **COMPLETE** — `LayoutPlanner` + `runLayoutPlanner`; DOM `planner` / `replan(): Promise<void>`; framework parity; stale/cancel/fallback; intelligence remains private unpublished; Final Closure passed.
- **Reference:** [deterministic-planner.md](./architecture/deterministic-planner.md), [dom-adapter.md](./architecture/dom-adapter.md)

### DND-4.4 — Model-Assisted Planning Experiment

- **Objective:** Optional evidence-driven model-backed planner experiment behind the neutral boundary.
- **Out of scope:** Permanent provider lock-in; requiring network for core DnDGem; browser API keys; DnDGem-owned inference; CI paid calls.
- **Dependencies:** DND-4.3.
- **Status:** **COMPLETE** — Stage B harness frozen; Stage C Luna live evidence recorded (25 requests); Final Audit passed. **Decision:** `DEFER MODEL ASSISTANCE` (no measurable Core benefit vs DND-4.2 on frozen corpus; provider/reference package remains private). DND-4.5 formal packaging/validation gate remains pending. Evidence: [model-assisted-planning-experiment.md](./architecture/model-assisted-planning-experiment.md), `packages/intelligence-openai/experiment/artifacts/luna-live-evidence.json`.
- **Reference:** [model-assisted-planning-experiment.md](./architecture/model-assisted-planning-experiment.md)

### DND-4.5 — Phase 4 Validation & Alpha Gate

- **Objective:** Validate Phase 4 contract adherence and decide optional Alpha packaging for intelligence.
- **Out of scope:** Making LLM integration a Beta prerequisite; rewriting Phase 3 history.
- **Dependencies:** DND-4.2 required; DND-4.3 required for integration claims; DND-4.4 optional.
- **Status:** Not started

### Phase 4 safe deferrals

- Mandatory LLM / remote model dependency
- Second solver / parallel validity vocabulary
- Framework-specific intelligence packages
- Flutter implementation
- Pin / Lock APIs
- Default-on intelligence
- Hot-path model inference
- Automatic DOM/read/tab order rewriting

---

## Later tracks (high-level)

### Flutter ecosystem track

Flutter does **not** block JS Public Alpha, Framework Expansion, or AI.

After Public Alpha:

```text
           ┌→ Adaptive Auto-Layout (Phase 3) COMPLETE
Public Alpha
           ├→ Framework Expansion Gate (JS/DOM adapters)  COMPLETE
           └→ Flutter architecture / renderer work (Core-contract dependent)
```

Flutter consumes Core through a **non-DOM** runtime. It is not a `@dndgem/dom` sibling adapter.

### Commercial / cloud

Layout CI, teams, enterprise, billing — not Phase 2.
