# Phase 3 Planning Audit — Decision Record

**Status:** **PASSED WITH ARCHITECTURAL REFINEMENTS**

**Product:** DnDGem by DA62  
**Scope:** Phase 3 — Adaptive Auto-Layout (planning / sprint mapping only)  
**Entry gate:** **READY**  
**Sprint map:** **APPROVED** (5 sprints)

This document records the human review of the Phase 3 Planning / Sprint Mapping Audit. It is the authoritative refinement over the audit’s draft recommendations. Implementation begins only when an explicit sprint (starting with **DND-3.1**) is active.

Related: [roadmap.md](../roadmap.md), [core-domain.md](./core-domain.md), [ADR-0006](../adr/ADR-0006-layout-intent-vs-resolved-layout.md), [ADR-0010](../adr/ADR-0010-adaptive-solver-selection-policy.md).

---

## Verdict

```text
DNDGEM PHASE 3 PLANNING AUDIT
PASSED WITH ARCHITECTURAL REFINEMENTS

ENTRY GATE:
READY

PHASE 3 SPRINT MAP:
APPROVED

SPRINT COUNT:
5
```

| Sprint      | Title                                | Decision                      | Implementation status |
| ----------- | ------------------------------------ | ----------------------------- | --------------------- |
| **DND-3.1** | Auto-Layout Contract & Core Model    | **APPROVED with corrections** | COMPLETE (contract)   |
| **DND-3.2** | Deterministic Placement Engine       | **APPROVED**                  | COMPLETE              |
| **DND-3.3** | Stability / Adaptive Reflow & Hybrid | **APPROVED**                  | COMPLETE              |
| **DND-3.4** | Drag / Partial Intent / DOM-React DX | **APPROVED**                  | COMPLETE              |
| **DND-3.5** | Phase 3 Alpha Release Gate           | **APPROVED**                  | NEXT                  |

---

## Approved architectural direction

Auto-Layout is a **deterministic intent enricher**, not a second solver:

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

The existing Core solver remains the **only** authority for candidate selection, scoring, and validity. AI, Flutter, and other framework adapters remain out of Phase 3.

Primary product gap: reduce the consumer burden of supplying complete placement rectangles while preserving constraints, validity, stability, and drag coherence.

---

## Four architectural corrections (binding)

### 1. DND-3.1 is contract-only — no production Auto-Layout API / stubs

DND-3.1 must close **without** adding an Auto-Layout function to the production public API and without incomplete production stubs in `packages/core/src/*`.

Deliverable:

```text
semantics
+ architecture
+ invariants
+ test model
+ API proposal
```

Implementation belongs to **DND-3.2+**.

### 2. Public enricher export is proposed, not approved

Names such as `enrichLayoutIntent` / `createAutoLayoutIntent`, or an option on `solveLayout`, remain **undecided**.

Classification until DND-3.1 closes:

```text
PROPOSED PUBLIC ALPHA API
NOT YET APPROVED
```

DND-3.1 must prove a consumer contract is necessary before DND-3.2 freezes any new public export.

### 3. Drag → strong persistent user intent — not an absolute pin

Approved MVP semantics:

```text
auto placement
→ drag
→ strong persistent user intent (desired placement)
→ resize keeps the item when feasible
→ hard constraints / DEGRADED / reflow when not feasible
```

**Not:** dragged placement = immutable hard pin forever.

Pin/Lock APIs remain **deferred**. Hard constraints, explicit desired placement, and previous-layout stability are sufficient unless a concrete use case proves otherwise. The solver stays authoritative.

### 4. Provenance: source intent vs generated / effective placement

Incomplete `desiredPlacements` may be completed by the enricher, but **generated auto placements must not become indistinguishable from persistent explicit user intent**.

Without provenance, hybrid layouts collapse on the next resize/reflow (every item looks explicit).

DND-3.1 **must** define:

```text
source intent
vs
generated / effective intent (or equivalent placement provenance)
```

This does **not** require changing `LayoutIntent` in DND-3.1. Internal separation of input desired placements, generated placements, and effective desired placements is acceptable if the contract preserves the distinction across reflow.

**Binding rule:** enrichment must not accidentally promote every auto-placement to persistent explicit intent.

---

## Seven DND-3.1 invariants (must close)

1. Auto-Layout is **not** a second solver.
2. The existing solver remains the **only** authority for validity and final selection.
3. Explicit and automatic placement keep **distinguishable provenance**.
4. Drag produces **strong persistent user intent**, not an absolute hard pin.
5. **Partial / hybrid** intent is an MVP requirement.
6. Auto-Layout remains **opt-in** for all of Phase 3 Alpha.
7. **No new public API is frozen** until the contract sprint shows it is necessary.

---

## Algorithm stance (approved for later sprints)

- **MVP algorithm direction:** deterministic greedy first-fit around occupancy.
- Defer skyline, beam search, and best-fit for the first Auto-Layout Alpha.
- Ordering: define a **stable** item order and stable probe order compatible with existing intent/preference signals; do **not** invent a new public `priority` field in the first cut. Declaration order may be the initial stable rule.
- Tie-break continues via existing ADR-0010 solver ranking after enrichment.

## Sizing stance

Phase 3 is primarily **Auto-Placement**, not a responsive sizing DSL. Reuse existing preferred / useful / minimal / measured / constraint signals. Defer flex-grow, grid-span, auto-fit, minmax()-style vocabulary.

## Release stance

DND-3.5 publishes a real consumer-facing Alpha (Changesets → develop→master CI → `@alpha` → **first legitimate OIDC verification**). No artificial OIDC-only release.

---

## Dependency chain

```text
DND-3.1
  Contract + provenance + drag semantics + API boundary
        ↓
DND-3.2
  Deterministic auto placement
        ↓
DND-3.3
  Hybrid + stability + resize/reflow
        ↓
DND-3.4
  DOM + React + drag + DX + playground
        ↓
DND-3.5
  Validation + Alpha release + OIDC
```

---

## Explicitly deferred (unchanged)

AI / LLM inference · Flutter · Vue / Angular / Svelte · Pin/Lock API · grouping / region DSL · CSS grid/flex clone · Large-N optimization · full keyboard / SR drag product · mobile/touch certification · monetization / cloud.

---

**Next action**

DND-3.2 Core placement engine is COMPLETE. DND-3.3 Core stability / adaptive reflow is COMPLETE. DND-3.4 DOM/React opt-in wiring (`autoLayout`, `proposalUnplacedItemIds`, drag→Source Intent) is **COMPLETE**. **Next sprint:** DND-3.5 — Phase 3 Alpha Release Gate. Published npm `0.1.0-alpha.0` does **not** include Auto-Layout yet.
