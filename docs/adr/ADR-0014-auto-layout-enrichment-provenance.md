# ADR-0014: Deterministic Auto-Layout Enrichment & Placement Provenance

- **Status:** Accepted (contract DND-3.1; Core engine DND-3.2/DND-3.3; minimal public Alpha export + DOM/React wiring DND-3.4; published `0.1.0-alpha.1` in DND-3.5)
- **Date:** 2026-08-16
- **Sprint:** DND-3.1 / DND-3.2 / DND-3.3 / DND-3.4

## Context

Phase 3 must reduce the authoring burden of complete desired rectangles without replacing the adaptive solver (ADR-0003 / ADR-0010). The Planning Audit approved Auto-Layout as composition with existing `solveLayout`, with four binding corrections: contract-only DND-3.1; cautious public enricher export; drag is strong intent not an absolute pin; and **source vs generated provenance must not collapse**.

Today `LayoutIntent.desiredPlacements` is a flat map. DOM session seeding and drag commits can produce a complete placement map. If that map is later treated as durable consumer intent, automatic items become accidentally durable Source Intent and hybrid reflow collapses.

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
9. **Public API (DND-3.4 minimal approved):** Package-root export of `createAutoLayoutProposal` plus types `AutoLayoutProposal`, `AutoLayoutProposalInput`, and `PlacementOrigin`. DOM `createLayoutSession({ autoLayout?: boolean })` and React `DnDGemProvider` prop `autoLayout?: boolean` (default off). Algorithm helpers (`maxProbeCountForOccupancy`, sizing) remain INTERNAL. Broader freeze / next npm Alpha publish is DND-3.5. Published `0.1.0-alpha.0` does **not** include Auto-Layout yet.
10. **Representation:** Provenance is carried as a parallel structure (origin map) owned by the Auto-Layout pipeline. `LayoutIntent` schema is unchanged. Schema changes need a later ADR if evidence demands them.
11. **Validity vocabulary:** No parallel Auto-Layout statuses. Only VALID / DEGRADED / INVALID.

## Consequences

- DND-3.2/DND-3.3 Core enrichment preserves origin metadata across compose and reflow cycles (see [auto-layout-engine.md](../architecture/auto-layout-engine.md)). Previous layout remains stability-only and is never an origin.
- DOM/React (DND-3.4) retain Source Intent separately from last effective/resolved geometry when Auto-Layout is enabled; drag accept promotes only the active item.
- Pin/Lock APIs remain deferred.
- Extending beyond the minimal public surface (`LayoutIntent` schema change, second validity language, default-on) is an ADR-level reopen.

See [auto-layout-contract.md](../architecture/auto-layout-contract.md).
