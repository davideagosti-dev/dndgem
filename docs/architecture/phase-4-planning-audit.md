# Phase 4 Planning Audit — Decision Record

**Status:** **PASSED WITH ARCHITECTURAL REFINEMENTS**

**Product:** DnDGem by DA62  
**Scope:** Phase 4 — AI-Assisted Layout Intelligence (planning / contract / sprint mapping)  
**Entry gate:** **READY** (Phase 3 COMPLETE; Framework Expansion COMPLETE; public Alpha `0.1.0-alpha.3`)  
**Sprint map:** **APPROVED** (5 sprints)  
**Active sprint:** **DND-4.1** (contract-only)

This document records the repository-backed audit for Phase 4 architecture placement, taxonomy, provider strategy, and sprint mapping. Implementation of planners begins only when an explicit later sprint (starting with **DND-4.2**) is authorized.

Related: [layout-intelligence-contract.md](./layout-intelligence-contract.md), [ADR-0018](../adr/ADR-0018-layout-intelligence-boundary.md), [auto-layout-contract.md](./auto-layout-contract.md), [ADR-0014](../adr/ADR-0014-auto-layout-enrichment-provenance.md), [package-boundaries.md](./package-boundaries.md), [roadmap.md](../roadmap.md).

---

## Verdict

```text
DNDGEM PHASE 4 PLANNING AUDIT
PASSED WITH ARCHITECTURAL REFINEMENTS

ENTRY GATE:
READY

PHASE 4 SPRINT MAP:
APPROVED

SPRINT COUNT:
5

DND-4.1:
CONTRACT / ARCHITECTURE ONLY — NO PRODUCTION INTELLIGENCE PACKAGE
```

| Sprint      | Title                                       | Decision                     | Implementation status |
| ----------- | ------------------------------------------- | ---------------------------- | --------------------- |
| **DND-4.1** | Layout Intelligence Contract & Architecture | **APPROVED**                 | COMPLETE (contract)   |
| **DND-4.2** | Deterministic Intelligence Planner          | **APPROVED**                 | Not started           |
| **DND-4.3** | Planner Contract & Optional Integration     | **APPROVED**                 | Not started           |
| **DND-4.4** | Model-Assisted Planning Experiment          | **APPROVED** (optional path) | Not started           |
| **DND-4.5** | Phase 4 Validation & Alpha Gate             | **APPROVED**                 | Not started           |

---

## Problem distinction (binding)

Phase 3 answers approximately:

> Where can items be placed deterministically when explicit placement intent is partial or absent?

Phase 4 answers approximately:

> Given valid/plausible layout possibilities, what higher-level arrangement best represents structural, semantic, or application intent?

Binding pipeline principle:

```text
Intelligence proposes.
Deterministic DnDGem validates and resolves.
```

Target conceptual pipeline:

```text
Application / semantic hints
            ↓
Optional Intelligence Planner
            ↓
Planning Proposal (UNTRUSTED / ADVISORY)
            ↓
schema + semantic validation + normalization
            ↓
Phase 3 Auto-Layout proposal/enrichment (when applicable)
            ↓
solveLayout
            ↓
evaluateLayout
            ↓
VALID / DEGRADED / INVALID
            ↓
ResolvedLayout (TRUSTED)
```

Intelligence must **not** become a second solver.

---

## Taxonomy (binding)

| Layer                        | Meaning                                                                                        | Phase 4 role                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Deterministic placement**  | Existing geometry, constraints, Auto-Layout enricher, `solveLayout` / `evaluateLayout`         | Remains authoritative; unchanged by DND-4.1        |
| **Heuristic optimization**   | Bounded deterministic planning/search that improves layout strategy without model inference    | **Preferred first implementation** (DND-4.2)       |
| **AI-assisted planning**     | Higher-level semantic/structural Planning Proposals behind a provider-neutral planner boundary | Contract now; optional later experimentation       |
| **Model-based intelligence** | Local or remote ML/LLM inference                                                               | **Optional**; never synonymous with Phase 4 itself |

Explicit statement:

```text
Phase 4 AI-Assisted Layout Intelligence
does NOT mean
DnDGem requires an LLM.
```

---

## Architecture options audit

Repository evidence used:

- `@dndgem/core` is renderer-agnostic and already forbids AI dependencies ([package-boundaries.md](./package-boundaries.md), ADR-0001).
- Phase 3 Auto-Layout lives in Core as a deterministic enricher; `solveLayout` remains the only selection/validity authority (ADR-0014).
- Framework adapters are thin siblings over `@dndgem/dom` (ADR-0015 / ADR-0016) and must not become AI extension points.
- Forbidden package folders include `ai` (legacy name reservation); provisional future name `@dndgem/intelligence` is **not** an approved public API and **must not** be created in DND-4.1.
- No production intelligence package exists; Changesets fixed group is the six public packages at `0.1.0-alpha.3`.

### Option A — Intelligence inside `@dndgem/core`

| Criterion                | Assessment                                                                  |
| ------------------------ | --------------------------------------------------------------------------- |
| Core purity              | Weak — risks optional/async/provider concerns inside the deterministic core |
| Deterministic guarantees | Weak — model/heuristic code adjacent to solver invites hot-path coupling    |
| Bundle size              | Weak — consumers pay for unused planning                                    |
| SSR / import safety      | Weak if any network/provider imports leak                                   |
| Framework independence   | Strong                                                                      |
| Flutter compatibility    | Mixed — Core growth with optional intelligence complicates shared Core      |
| Provider neutrality      | Weak if providers land in Core                                              |
| Offline / testing        | Mixed                                                                       |
| OSS / commercial split   | Weak                                                                        |

**Verdict:** Rejected as default home for Phase 4 intelligence.

### Option B — Separate optional intelligence package/layer depending on Core

| Criterion                | Assessment                                              |
| ------------------------ | ------------------------------------------------------- |
| Core purity              | Strong — Core stays deterministic authority             |
| Deterministic guarantees | Strong — planner remains advisory                       |
| Bundle size              | Strong — opt-in dependency                              |
| SSR / import safety      | Strong if package is optional and import-safe by policy |
| Framework independence   | Strong                                                  |
| Flutter compatibility    | Strong — non-DOM planner can share Core contracts       |
| Provider neutrality      | Strong — providers sit behind planner boundary          |
| Offline / testing        | Strong — deterministic planner first                    |
| OSS / commercial split   | Strong — optional package can mature separately         |

**Verdict:** **Preferred** future direction.

Provisional package name `@dndgem/intelligence` is **PROVISIONAL / NOT APPROVED PUBLIC API**. DND-4.1 does **not** create the package. Creation belongs to a later sprint only if contract validation requires it (expected: DND-4.2 / DND-4.3).

### Option C — Consumer-owned intelligence implementing a DnDGem contract

| Criterion           | Assessment                                                 |
| ------------------- | ---------------------------------------------------------- |
| Core purity         | Strong                                                     |
| DX                  | Strong for advanced apps; weaker for default product story |
| Provider neutrality | Strong                                                     |
| Testing / replay    | Depends on consumer discipline + DnDGem trust boundary     |

**Verdict:** **Approved escape hatch / extension**. Consumer-supplied planners implementing the Planning Proposal contract are desirable. They do not replace the preferred optional package path for first-party heuristic planners.

### Decision

```text
Preferred: Option B (future optional intelligence layer depending on Core)
Escape hatch: Option C (consumer-owned planner)
Rejected default: Option A (intelligence inside Core)
DND-4.1 package creation: NO
```

---

## Binding refinements

1. **DND-4.1 is contract-only** — no production AI code, provider SDK, network integration, new solver, validity vocabulary, or production package skeleton unless a hard contradiction forces a stop-and-explain.
2. **Solver authority is absolute** — Planning Proposals never declare VALID / DEGRADED / INVALID or emit authoritative `ResolvedLayout`.
3. **Phase 3 provenance is preserved** — Intelligence must not invent a silent placement origin that collapses Source Intent / Generated Placement / Previous Layout / Effective Solver Input.
4. **Heuristic-first** — DND-4.2 targets a deterministic local planner; model-assisted work is optional and deferred to DND-4.4 experimentation.
5. **Provider-neutral** — No OpenAI / Gemini / Anthropic / Azure (or other) production dependency is selected in DND-4.1.
6. **Maturity split** — Deterministic DnDGem may progress toward Beta independently of model-based intelligence. Intelligence APIs may remain experimental / Alpha / separately matured.
7. **Framework adapters stay thin** — No React/Vue/Angular/Svelte-specific intelligence semantics.

---

## Approved Phase 4 sprint map

### DND-4.1 — Layout Intelligence Contract & Architecture

- **Objective:** Close the Phase 4 contract before any planner implementation.
- **Scope:** Problem distinction; taxonomy; options audit; invariants I1–I12; planning input/output; trust boundary; lifecycle; privacy; accessibility; provider strategy; Beta maturity policy; sprint map; ADR; roadmap reconciliation.
- **Non-goals:** Production intelligence package; AI SDK; network; LLM prompts; solver/validity changes; framework-specific intelligence; Flutter; publish/tag/PR.
- **Packages affected:** None (docs/ADR/governance only).
- **API impact:** None frozen. Conceptual types classified EXISTING PUBLIC / INTERNAL / PROPOSED / DEFERRED.
- **Tests:** Documentation/link/governance coherence; existing deterministic quality gates must remain green with no production code change.
- **Docs:** This audit + [layout-intelligence-contract.md](./layout-intelligence-contract.md) + ADR-0018 + roadmap/overview/boundary reconciliation.
- **Exit criteria:** Contract + ADR accepted; DND-4.2 can start without re-deciding authority, trust, privacy, or package placement.
- **Dependencies:** Phase 3 COMPLETE; Framework Expansion COMPLETE; public Alpha `0.1.0-alpha.3`.
- **Release implications:** None.
- **Status:** **COMPLETE** (contract)

### DND-4.2 — Deterministic Intelligence Planner

- **Objective:** Implement a bounded deterministic/heuristic planner that emits Planning Proposals only.
- **Scope:** Local offline planner; schema-valid advisory output; normalization into the deterministic pipeline; deterministic fallback; Core-adjacent tests/benches as needed; still no mandatory LLM.
- **Non-goals:** Remote model providers; framework-specific planners; solver semantic change; default-on intelligence; public API freeze without review.
- **Packages affected:** Possibly a new optional package **if** justified; otherwise internal scaffolding under an authorized package decision. Core remains authority-only.
- **API impact:** Provisional planner boundary may appear; not a Beta prerequisite.
- **Tests:** Deterministic proposal fixtures; fail-closed malformed output; offline operation; no hot-path inference.
- **Docs:** Engine/planner notes under the contract; update maturity statements carefully.
- **Exit criteria:** Heuristic planner proposes; DnDGem resolves; fallback proven.
- **Dependencies:** DND-4.1.
- **Release implications:** Optional; no forced version bump in this map approval.
- **Status:** Not started

### DND-4.3 — Planner Contract & Optional Integration

- **Objective:** Stabilize the optional integration surface for first-party and consumer-supplied planners.
- **Scope:** Trust-boundary validation/normalization wiring; optional session/application hooks for deliberate planning; DX docs; replay from captured Planning Proposal.
- **Non-goals:** Model provider lock-in; hot-path planning; DOM/content scraping defaults; accessibility ownership transfer.
- **Packages affected:** Optional intelligence layer + thin adapter/session hooks only if needed; no per-framework intelligence semantics.
- **API impact:** Optional experimental surface only; maturity may remain Alpha/experimental.
- **Tests:** Integration smoke; stale/cancel semantics for async planners; replay determinism after capture.
- **Docs:** Consumer guide for optional planning; privacy defaults restated.
- **Exit criteria:** Optional integration usable without changing deterministic default path.
- **Dependencies:** DND-4.2.
- **Release implications:** Possible experimental Alpha export; not a Beta gate by itself.
- **Status:** Not started

### DND-4.4 — Model-Assisted Planning Experiment

- **Objective:** Evidence-driven optional experiment with a model-backed planner behind the neutral boundary.
- **Scope:** Provider adapter experiment; explicit opt-in privacy policy for any extra semantic payload; timeout/failure fallback; comparison vs deterministic planner.
- **Non-goals:** Selecting a permanent production provider in architecture; requiring network for core DnDGem; shipping model inference as default.
- **Packages affected:** Optional provider adapter(s) behind intelligence boundary only.
- **API impact:** Experimental only.
- **Tests:** Fail-closed on provider failure; no hot-path calls; privacy policy gates.
- **Docs:** Experiment report; provider remains replaceable.
- **Exit criteria:** Enough evidence to keep, narrow, or defer model-assisted planning without blocking deterministic intelligence.
- **Dependencies:** DND-4.3.
- **Release implications:** Must not make LLM integration a Beta prerequisite unless later evidence justifies it.
- **Status:** Not started

### DND-4.5 — Phase 4 Validation & Alpha Gate

- **Objective:** Validate Phase 4 contract adherence and decide Alpha packaging for optional intelligence.
- **Scope:** Quality gates; honesty about optional vs required intelligence; docs/limitations; release decision for any approved optional surface; no forced Beta.
- **Non-goals:** Rewriting Phase 3 history; mutating `latest`; making model inference mandatory.
- **Packages affected:** Only packages explicitly approved for optional intelligence publication.
- **API impact:** Publish only approved optional surfaces; deterministic packages may remain unchanged.
- **Tests:** Full local quality gate appropriate to changed packages; no invented CI browser matrix expansion.
- **Docs:** Release notes if publishing; limitations updated.
- **Exit criteria:** Phase 4 exit checklist PASS or explicit deferrals recorded.
- **Dependencies:** DND-4.2 required; DND-4.3 required for integration claims; DND-4.4 optional.
- **Release implications:** Optional Alpha for intelligence only if justified; deterministic Beta remains independent.
- **Status:** Not started

---

## Explicit non-goals for Phase 4 critical path

- Making LLM/model inference mandatory
- Second solver / parallel validity vocabulary
- Framework-specific intelligence packages
- Flutter implementation
- Pin/Lock APIs
- Default-on intelligence that silently changes existing consumers
- Provider lock-in
- Hot-path (pointermove / rAF / ResizeObserver) model inference
- Automatic DOM/read/tab order rewriting

---

## Repository baseline at audit time

| Item                       | Evidence                                                |
| -------------------------- | ------------------------------------------------------- |
| Phase 3                    | COMPLETE / RELEASED (`0.1.0-alpha.1`)                   |
| Framework Expansion        | COMPLETE (`0.1.0-alpha.3`)                              |
| Public packages            | core, dom, react, vue, angular, svelte                  |
| Current valid Public Alpha | `0.1.0-alpha.3` / `@alpha`                              |
| Meta-framework packages    | None (compat environments only)                         |
| Intelligence package       | Absent (correct for DND-4.1)                            |
| Phase 4 prior status       | Roadmap said “Later (not started)” — updated by DND-4.1 |

---

## Closure of DND-4.1

DND-4.1 closes when:

1. This audit is recorded as PASSED WITH ARCHITECTURAL REFINEMENTS
2. [layout-intelligence-contract.md](./layout-intelligence-contract.md) defines invariants, contracts, and lifecycle
3. ADR-0018 accepts Option B (+ Option C escape hatch), provider neutrality, and solver authority
4. Roadmap/overview/governance current-state statements reflect Phase 4 ACTIVE at DND-4.1 without rewriting historical release records
5. No production AI/provider/solver changes land in the sprint
