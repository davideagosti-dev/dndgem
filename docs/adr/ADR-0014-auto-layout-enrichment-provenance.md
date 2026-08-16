# ADR-0014: Deterministic Auto-Layout Enrichment & Placement Provenance

- **Status:** Accepted (contract only; implementation deferred to DND-3.2+)
- **Date:** 2026-08-16
- **Sprint:** DND-3.1

## Context

Phase 3 must reduce the authoring burden of complete desired rectangles without replacing the adaptive solver (ADR-0003 / ADR-0010). The Planning Audit approved Auto-Layout as composition with existing `solveLayout`, with four binding corrections: contract-only DND-3.1; no approved public enricher export yet; drag is strong intent not an absolute pin; and **source vs generated provenance must not collapse**.

Today `LayoutIntent.desiredPlacements` is a flat map. DOM session seeding and drag commits can produce a complete placement map. If that map is later treated as durable consumer intent, automatic items become accidentally “pinned” and hybrid reflow collapses.

## Decision

1. **Auto-Layout role:** Deterministic proposal / enrichment of placement geometry. It does **not** select winners, score layouts, or declare validity.
2. **Authority:** Existing `solveLayout` → `evaluateLayout` remain the only authority for candidate selection, VALID / DEGRADED / INVALID, scoring, stability ranking, and final `ResolvedLayout`.
3. **Three conceptual layers (required):**
   - **Source Intent** — durable explicit placement from consumer configuration or accepted drag (strong placement signal / occupancy input). It does **not** outrank hard constraints.
   - **Generated Placement** — Auto-Layout-inferred geometry for items lacking source intent; provenance remains **generated**.
   - **Effective Solver Input** — composed geometry (typically a complete `LayoutIntent` with desired placements) passed to `solveLayout`. Effective completeness must not rewrite Source Intent. **Effective is not an origin.**
4. **Previous layout** (`SolverInput.previous`) remains a **stability** signal only (ADR-0010). It is not Source Intent, not Generated Placement, and **not an origin**.
5. **MVP placement origins** are only `source` \| `generated`. Do not treat `previous` or `effective` as origin values.
6. **Drag:** An accepted drop promotes that item’s placement to Source Intent (strong persistent). It is **not** a new hard constraint, pin, lock, or immutable coordinate. When geometry becomes infeasible, hard constraints + solver remain authoritative.
7. **Hybrid / partial intent:** MVP. Explicit items are occupancy inputs for automatic generation **while feasible**; they must not become immutable hard obstacles that override constraint feasibility. Automatic items must not displace feasible source-explicit items as enricher policy. The solver may still adapt sizes/positions under existing preserve/pack rules when evaluating effective input.
8. **Opt-in:** Phase 3 Alpha Auto-Layout is **opt-in**. Explicit-only consumers must not silently change.
9. **Public API:** Candidate shapes are **PROPOSED / NOT YET APPROVED**. No production export in DND-3.1. Preferred direction (unfrozen): a Core proposal operation that returns **effective intent + provenance** (`source` \| `generated`), then a separate `solveLayout` call — not a silent merge of generated rects into durable source desired maps.
10. **Representation:** DND-3.1 does **not** require changing `LayoutIntent` schema. Provenance may be carried as a parallel structure (map/set of origins) owned by the Auto-Layout pipeline and, later, session state. Schema changes need a later ADR if evidence demands them.
11. **Validity vocabulary:** No parallel Auto-Layout statuses. Only VALID / DEGRADED / INVALID.

## Consequences

- DND-3.2 must implement Core enrichment that preserves origin metadata across compose cycles.
- DOM/React (DND-3.4) must retain Source Intent separately from last effective/resolved geometry when Auto-Layout is enabled.
- Pin/Lock APIs remain deferred.
- Extending this contract (public export freeze, `LayoutIntent` schema change, second validity language) is an ADR-level reopen.

See [auto-layout-contract.md](../architecture/auto-layout-contract.md).
