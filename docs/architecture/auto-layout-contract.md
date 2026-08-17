# Auto-Layout Contract (DND-3.1)

Authoritative Phase 3 contract for deterministic Adaptive Auto-Layout.

**Status:** Contract COMPLETE; Core engine DND-3.2 + DND-3.3; consumer wiring DND-3.4 COMPLETE; published npm **`0.1.0-alpha.1`**. Minimal public Alpha surface: `createAutoLayoutProposal` + types; DOM/React `autoLayout`.  
**Sprint:** DND-3.1 (contract) → DND-3.2 (engine) → DND-3.3 (stability / reflow) → DND-3.4 (DOM/React) → DND-3.5 (publish)  
**Product:** DnDGem by DA62

Published npm `@alpha` (`0.1.0-alpha.1`) **includes** opt-in Auto-Layout. Historical `0.1.0-alpha.0` does not.

Related: [phase-3-planning-audit.md](./phase-3-planning-audit.md), [auto-layout-engine.md](./auto-layout-engine.md), [core-domain.md](./core-domain.md), [ADR-0006](../adr/ADR-0006-layout-intent-vs-resolved-layout.md), [ADR-0010](../adr/ADR-0010-adaptive-solver-selection-policy.md), [ADR-0014](../adr/ADR-0014-auto-layout-enrichment-provenance.md), [framework-adapter-contract.md](./framework-adapter-contract.md), [dom-adapter.md](./dom-adapter.md), [roadmap.md](../roadmap.md).

---

## 1. Scope

### What Auto-Layout is

A **deterministic, browser-independent proposal layer** that assigns placement geometry to items that lack durable Source Intent, then composes an **Effective Solver Input** for the existing Core pipeline.

```text
Measurements + Constraints + Preferences + Previous + Source Intent
        ↓
Deterministic Auto-Layout (enrich / propose)
        ↓
Generated Placement + Effective Solver Input
        ↓
solveLayout({ intent: effective, previous? })
        ↓
evaluateLayout
        ↓
VALID / DEGRADED / INVALID → ResolvedLayout
```

### What Auto-Layout is not

- Not a second solver
- Not a second scoring or validity engine
- Not a second constraint model
- Not a Pin/Lock product
- Not a CSS Grid / Flexbox / responsive sizing DSL
- Not AI
- Not React-only or DOM-policy-owned placement logic
- Not default-on Alpha behavior

### Sprint boundary

DND-3.1 defined this contract. DND-3.2/DND-3.3 implement the Core proposal + stability/reflow engine. DND-3.4 wires opt-in DOM/React sessions and exports the **minimal** public Core surface (`createAutoLayoutProposal` + types). Broader API freeze / next Alpha publish remains DND-3.5.

---

## 2. Seven invariants (binding)

| #   | Invariant                     | Contract statement                                                                                                                   |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | No second solver              | Auto-Layout composes with `solveLayout`; it must not duplicate selection, evaluation, scoring, or constraint semantics.              |
| 2   | Solver authoritative          | Final candidate choice, VALID/DEGRADED/INVALID, scores, stability ranking, and `ResolvedLayout` come only from existing Core.        |
| 3   | Provenance distinguishable    | Source Intent ≠ Generated Placement ≠ Effective Solver Input completeness. Generated must not silently become durable Source Intent. |
| 4   | Drag = strong intent, not pin | Accepted drag promotes Source Intent. Feasibility remains under hard constraints + solver; not an immutable hard pin.                |
| 5   | Partial / hybrid MVP          | Explicit and automatic items must coexist under defined precedence.                                                                  |
| 6   | Opt-in Alpha                  | Existing explicit-only path remains valid; Auto-Layout does not silently change consumers.                                           |
| 7   | Minimal public API approved   | DND-3.4 approves the minimal enricher + session/provider `autoLayout` surface. Broader freeze remains DND-3.5 / review. Opt-in only. |

---

## 3. Terminology

| Term                       | Meaning                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Source Intent**          | Durable explicit placement for an item from consumer configuration or accepted drag (strong user/application intent).           |
| **Generated Placement**    | Geometry produced by Auto-Layout for an item **without** Source Intent. Origin remains `generated`.                             |
| **Effective Solver Input** | Composed input (normally a `LayoutIntent` whose desired placements cover all items) passed to `solveLayout`. **Not** an origin. |
| **Previous Layout**        | Optional prior `ResolvedLayout` for ADR-0010 stability / reflow explainability. **Not** Source Intent. **Not** an origin.       |
| **Explicit (semantic)**    | Item has Source Intent.                                                                                                         |
| **Automatic (semantic)**   | Item has no Source Intent; Auto-Layout may generate placement.                                                                  |
| **Hybrid**                 | Mix of explicit and automatic items in one layout.                                                                              |
| **Placement origin**       | MVP per-item tag: **`source` \| `generated` only**. `previous` and `effective` are **not** origins.                             |

Public API names above are **not** frozen export names.

---

## 4. Three conceptual layers

### Layer A — Source Intent

Consumer/user-owned durable placement signal **before** Auto-Layout.

Sources (Phase 3):

- Consumer-supplied desired placement for an item
- Accepted drag drop for an item
- Other application-owned explicit configuration that the integration layer treats as source

Not sources:

- Last `ResolvedLayout` alone
- Last Effective Solver Input alone
- Measurement snapshot alone
- Auto-Layout output alone

**Representation (contract):** Prefer **not** changing `LayoutIntent` in DND-3.1. Source Intent is a **partial** placement map (and/or a set of item ids marked `source`) retained by the Auto-Layout pipeline and, for adapters, by session state when Auto-Layout is enabled.

### Layer B — Generated Auto-Layout state

Deterministic geometry for automatic items. May use previous resolved **positions** (x/y) as **hints** for stability, applying the **current** authoritative size. Retention across cycles is allowed for stability, but retention **must keep origin = generated**. Size change alone does not force position change when the resized candidate remains feasible.

### Layer C — Effective Solver Input

Composition:

```text
for each item:
  if origin is source → use Source Intent rect (adapted only by solver rules later)
  else → use Generated Placement rect
→ build LayoutIntent (complete desiredPlacements for solve)
→ solveLayout({ intent, previous? })
```

Effective completeness is a **transient compose artifact** for the solver. Persisting only the effective map **without** origins is a contract violation for Auto-Layout-enabled flows.

```text
┌──────────────┐     ┌────────────────────┐
│ Source Intent│     │ Previous Resolved  │
│ (partial)    │     │ (stability only)   │
└──────┬───────┘     └─────────┬──────────┘
       │                       │
       ▼                       ▼
┌─────────────────────────────────────────┐
│ Deterministic Auto-Layout               │
│  · generate for automatic items         │
│  · treat source rects as occupancy      │
│  · emit origins: source | generated     │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│ Effective LayoutIntent                  │
│  + PlacementOrigin map                  │
└──────────────────┬──────────────────────┘
                   ▼
            solveLayout / evaluateLayout
                   ▼
            ResolvedLayout
```

---

## 5. Provenance lifecycle matrix

| Scenario                         | After cycle, Source Intent                            | Generated                                                     | Effective                                                                        | Notes                                                                                   |
| -------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **A. Fully automatic initial**   | empty (no source rects)                               | all items `generated`                                         | complete map for solve                                                           | Resize: still all `generated`; previous may stabilize; do **not** copy effective→source |
| **B. Partial / hybrid**          | A (and any other explicit) remain `source`            | B,C remain `generated` even if they have positions            | complete                                                                         | Explicit A is occupancy obstacle for generation                                         |
| **C. Auto → accepted drag**      | A promoted to `source` at accept                      | A no longer `generated`                                       | includes A’s drop rect                                                           | Promotion is the provenance transition                                                  |
| **D. Drag → impossible resize**  | A remains `source` (strong intent retained as signal) | siblings per origin                                           | solver may adapt / DEGRADE / INVALID                                             | Not an unbreakable pin; hard constraints win                                            |
| **E. Explicit + auto conflict**  | explicit preserved as source                          | auto may fail to find feasible free space                     | enricher proposes best effort; **solver/evaluate** report VALID/DEGRADED/INVALID | No parallel auto-status                                                                 |
| **F. Resize large→narrow→large** | source set unchanged unless drag/config changes       | generated may move; may prefer previous when origin=generated | recompose each time                                                              | Previous ≠ source; returning geometry uses stability + origins                          |

---

## 6. Explicit / automatic / hybrid semantics

### Precedence (enricher policy)

```text
Hard constraints
= authoritative feasibility boundary

Source Intent
= strong placement signal / occupancy input during Auto-Layout generation
  (does NOT outrank hard constraints)

Generated placement
= fills remaining automatic layout space

Existing solver
= final authority when Source Intent cannot remain feasible

Previous layout
= separate stability signal (not an origin)
```

Ordered enricher guidance (not a claim that Source Intent beats hard constraints):

```text
1. Hard geometric constraints (authoritative feasibility)
2. Source Intent placements (strong; occupancy input while feasible)
3. Generated placement for automatic items
4. Preferences / measured / useful / minimal sizing signals (soft; via existing size modes)
5. Previous layout (stability hint; ADR-0010 when supplied to solve)
```

### Occupancy

- Source-explicit rects are **occupancy inputs** for automatic placement generation **while feasible**.
- They are **not** immutable hard obstacles that override constraint feasibility.
- Automatic items **must not** be generated on top of feasible source-explicit rects as enricher policy.
- The enricher does **not** relocate source-explicit items merely to make room. If the source rect becomes infeasible (e.g. after shrink), hard constraints + existing `solveLayout` / `evaluateLayout` remain authoritative — Source Intent does not win over hard constraints.

### Conflict

- Detect/report failure through **existing** `evaluateLayout` / `solveLayout` outcomes.
- Auto-Layout must not invent `AUTO_VALID`, `PACKED`, etc.

### Strong intent vs hard constraint

| Kind            | Moves under enricher?                | Can solver adapt when infeasible?                                                       |
| --------------- | ------------------------------------ | --------------------------------------------------------------------------------------- |
| Hard constraint | N/A (size legality)                  | Must remain visible as INVALID when violated                                            |
| Source Intent   | Enricher must not relocate as policy | Yes — preserve when feasible; existing preserve/pack + ranking may adapt; not a pin API |
| Generated       | Yes                                  | Yes                                                                                     |
| Previous        | Hint only                            | Via ADR-0010 when `previous` supplied                                                   |

---

## 7. Drag contract (Phase 3 semantics; runtime unchanged in DND-3.1)

Current Alpha already: drag builds proposed desired placements; accepted drop commits intent; rejected/cancel restore; Core `previous` omitted on explicit drag path.

Phase 3 additions are **semantic** for Auto-Layout-enabled flows:

| Event                             | Provenance effect                                                                                                    |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Accepted drop**                 | Active item → Source Intent (`origin = source`) with drop placement; durable across future auto/reflow when feasible |
| **Cancelled drag**                | No provenance change; restore committed layout                                                                       |
| **Rejected drop**                 | No provenance change; preserve previous committed Source Intent / origins                                            |
| **Repeated drag**                 | Updates Source Intent rect for that item                                                                             |
| **Drag of automatic item**        | On accept: **promotion** generated → source                                                                          |
| **Drag of already explicit item** | Updates source rect; remains source                                                                                  |
| **Resize after drag**             | Keep item as source; preserve placement when feasible; constraints + solver authoritative when not                   |

```text
automatic item
      ↓
user drag
      ↓
accepted drop
      ↓
strong persistent Source Intent
      ↓
future resize / Auto-Layout
      ↓
preserve when feasible
      ↓
solver/constraints authoritative when infeasible
```

**No Pin/Lock API** for Phase 3 MVP.

---

## 8. Previous layout ≠ Source Intent ≠ Generated

| Signal                    | Role                                            |
| ------------------------- | ----------------------------------------------- |
| Source Intent             | Durable explicit / user intent                  |
| Generated Placement       | Auto-inferred; origin tagged                    |
| Previous `ResolvedLayout` | Stability / reflow continuity for `solveLayout` |
| Measurement               | Geometry input to sizes/space; not intent       |

Session code seeds desired placements from previous/desired/snapshot when Auto-Layout is **off** (`createLayoutSession` default). That remains the **explicit-only** path (including published `0.1.0-alpha.0`). Auto-Layout-enabled sessions (`autoLayout: true`, DND-3.4) must **not** treat measurement/previous seeding as Source Intent promotion.

---

## 9. Constraints and validity authority

| Layer                    | Auto-Layout may                                                      | Auto-Layout must not                    |
| ------------------------ | -------------------------------------------------------------------- | --------------------------------------- |
| Hard `min*`/`max*`       | Choose sizes consistent with existing modes; prune infeasible probes | Hide hard failure; invent new hard axis |
| Usability `minUseful*`   | Prefer useful sizes when generating                                  | Own DEGRADED vocabulary                 |
| Preferences `preferred*` | Bias size targets                                                    | Duplicate score engine                  |
| Validity                 | Propose geometry only                                                | Emit non-Core statuses                  |

Authority:

```text
Auto-Layout proposes / enriches
        ↓
solveLayout + evaluateLayout
        ↓
VALID / DEGRADED / INVALID only
```

---

## 10. Determinism contract

Same semantic inputs ⇒ same generated proposal ⇒ same solver result.

**Stable inputs for DND-3.2:**

- Item declaration order in `LayoutIntent.items` (initial MVP ordering key; no new public `priority`)
- Space geometry
- Per-item constraints, measured sizes, preferences
- Source Intent map + origin set
- Previous resolved layout when supplied
- Deterministic probe order (implementation detail; fixed total order)
- Existing ADR-0010 tie-break after solve

Forbidden: randomness, wall-clock, unordered iteration, environment-dependent ordering.

---

## 11. Auto-sizing contract

Phase 3 is primarily **auto-placement**.

**Reuse only** existing sizing signals / modes already used by Core packing:

- measured size
- preferred / useful / minimal modes (internal solver vocabulary)
- geometric min/max and usefulness thresholds

**Deferred:** flex-grow, grid spans, auto-fit, minmax DSL, fractional track sizing, visual styling systems.

DND-3.2 **may** choose among existing size modes while generating placement; it must not invent a new sizing language.

---

## 12. Package responsibilities

| Package         | Phase 3 responsibility                                                                                                                    | Explicit non-responsibility                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `@dndgem/core`  | Deterministic enrichment policy; provenance composition; proposal → effective intent; call/compose with `solveLayout`                     | DOM, React, ResizeObserver, pointer, CSS             |
| `@dndgem/dom`   | Measurements; resize observation; session opt-in wiring; retain Source Intent + origins when auto enabled; drag commit → source promotion | Placement algorithm / packing policy                 |
| `@dndgem/react` | Thin opt-in exposure mirroring DOM session semantics                                                                                      | React-only layout rules; reimplementing solve/enrich |

Vanilla and React must expose **equivalent** Auto-Layout capability (DND-3.4). Vue / Angular / Svelte are the Framework Expansion Gate. Flutter remains a separate renderer track.

---

## 13. Public API (minimal approved — DND-3.4)

### Option A — Direct Core enricher returning only `LayoutIntent`

```ts
const enriched = enrichLayoutIntent(...)
const result = solveLayout({ intent: enriched })
```

|            |                                                                          |
| ---------- | ------------------------------------------------------------------------ |
| Advantages | Simple                                                                   |
| Risks      | Easy to drop provenance if return is only `LayoutIntent`                 |
| Verdict    | **ACCEPTABLE only if** return includes origins (then collapses toward B) |

### Option B — Dedicated proposal operation (**APPROVED minimal public**)

```ts
const proposal = createAutoLayoutProposal({ intent, previous? });
// proposal.effectiveIntent + proposal.placementOrigins + proposal.unplacedItemIds
const result = solveLayout({ intent: proposal.effectiveIntent, previous? });
```

|            |                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| Advantages | Separates enrich vs solve; provenance first-class; Core-portable; testable; future AI can feed Source Intent the same way |
| Risks      | Extra type/shape to design carefully                                                                                      |
| Verdict    | **APPROVED** as the minimal public Core surface (DND-3.4)                                                                 |

### Option C — `solveLayout({ autoLayout: ... })`

|            |                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------ |
| Advantages | One call ergonomics                                                                        |
| Risks      | Couples proposal into solver entry; harder provenance surfacing; temptation to hide layers |
| Verdict    | **ACCEPTABLE** as later sugar **over** B; not preferred as the sole primitive              |

### Option D — Session-only, no Core entry

|            |                                                                                 |
| ---------- | ------------------------------------------------------------------------------- |
| Advantages | Hides Core                                                                      |
| Risks      | Breaks headless Core consumers; policy drifts into DOM; Flutter/portability hit |
| Verdict    | **REJECT** as sole design                                                       |

```text
Approved minimal public direction (DND-3.4):
  createAutoLayoutProposal → solveLayout
  + session/provider autoLayout?: boolean (default off)
```

DOM/React accept opt-in `autoLayout` and own durable Source Intent + origins in session state. Drag accept promotes only the active item to Source Intent.

---

## 14. Classification table

| Concept                                                               | Classification                                                       |
| --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `solveLayout` / `evaluateLayout` / `LayoutIntent` / constraints       | **PUBLIC EXISTING**                                                  |
| Source Intent / Generated Placement / Effective Solver Input (layers) | **INTERNAL** conceptual (effective is composed input, not an origin) |
| Placement origin map (`source` \| `generated` only)                   | **PUBLIC ALPHA (minimal)** via `PlacementOrigin` / proposal result   |
| `createAutoLayoutProposal` + proposal types                           | **PUBLIC ALPHA (minimal)** — approved DND-3.4                        |
| Session/Provider `autoLayout` option                                  | **PUBLIC ALPHA (minimal)** — approved DND-3.4; default off           |
| `maxProbeCountForOccupancy` / sizing helpers                          | **INTERNAL**                                                         |
| Pin / Lock / priority / region / grouping / spans                     | **DEFERRED**                                                         |
| AI layout                                                             | **DEFERRED**                                                         |

---

## 15. Concept audit

| Concept                                                             | Decision              | Reason                              |
| ------------------------------------------------------------------- | --------------------- | ----------------------------------- |
| Auto placement                                                      | **MVP**               | Core product gap                    |
| Partial intent                                                      | **MVP**               | Authoring reduction                 |
| Hybrid intent                                                       | **MVP**               | Real dashboards                     |
| Source/generated provenance                                         | **MVP**               | Prevents pin collapse               |
| Drag → source promotion                                             | **MVP**               | Matches interaction model           |
| Stable ordering                                                     | **MVP**               | Determinism; item array order first |
| Pin / Lock                                                          | **Not justified**     | Source intent + constraints suffice |
| Priority field                                                      | **Not justified yet** | Use stable item order               |
| Preferred region / grouping / spans / density / gap / alignment DSL | **Deferred**          | Scope explosion                     |
| Arbitrary auto-sizing DSL                                           | **Deferred**          | Reuse existing modes                |
| AI                                                                  | **Deferred**          | Phase 4                             |

---

## 16. DND-3.2 implementation contract

### DND-3.2 may implement

- Core-only deterministic, bounded placement proposal/enrichment
- Greedy first-fit (or equivalent bounded) around source occupancy
- Stable item order + stable probe order
- Existing size mode reuse
- Provenance-preserving compose into Effective Solver Input
- Partial/hybrid support
- Spatial no-fit as **unplaced** (no fabricated overlapping geometry); proposal incompleteness ≠ solver validity
- Unit tests and Core benches for enrich+solve
- **No** public API freeze unless a follow-up review explicitly approves Option B (or other) signature

### DND-3.2 must not add without architecture review

- Second solver / score / validity language
- Pin/Lock public API
- Default-on Auto-Layout
- `LayoutIntent` schema break without ADR
- Promoting generated→source except via accepted drag or explicit consumer source update
- DOM/React production wiring (belongs DND-3.4)
- AI, grouping/region DSL, sizing DSL, Large-N redesign
- Skyline / beam search as required MVP (optional exploration needs review)

---

## 17. Future test contract (DND-3.2+)

Documented invariants — prefer acceptance matrices until production APIs exist. Do not add permanently red tests against nonexistent exports in DND-3.1.

1. Same source inputs → same generated proposal → same solver result
2. Generated placement is not persisted as Source Intent across resize
3. Automatic → accepted drag → Source Intent
4. Previous layout ≠ Source Intent
5. Partial explicit intent survives enrichment (source ids unchanged)
6. Hard constraints remain authoritative (no silent VALID on hard violation)
7. Only VALID / DEGRADED / INVALID
8. Auto-Layout disabled ⇒ explicit-only consumers unchanged
9. Hybrid: source rects treated as occupancy; automatic fill remainder
10. Drag cancel/reject ⇒ provenance unchanged
11. Impossible resize with source intent ⇒ coherent solver outcome (not unbreakable pin)
12. Bounded candidate/probe counts (no combinatorial explosion)

---

## 18. Acceptance matrix (DND-3.1)

| Criterion                                  | Status                                                    |
| ------------------------------------------ | --------------------------------------------------------- |
| Auto-Layout = compose with existing solver | PASS                                                      |
| No second solver/score/validity proposed   | PASS                                                      |
| Three layers + previous distinct           | PASS                                                      |
| Provenance lifecycle A–F defined           | PASS                                                      |
| Hybrid/partial MVP defined                 | PASS                                                      |
| Drag strong intent, not pin                | PASS                                                      |
| Opt-in Alpha                               | PASS                                                      |
| Public API proposed, not approved/exported | SUPERSEDED — minimal surface approved DND-3.4             |
| DND-3.2 may/must-not defined               | PASS                                                      |
| Future tests documented                    | PASS                                                      |
| Production Auto-Layout code                | PASS (Core + DOM/React wiring; published `0.1.0-alpha.1`) |

---

## 19. Explicit non-goals (Phase 3 / this contract)

AI · Flutter · Vue/Angular/Svelte (Framework Expansion Gate) · Pin/Lock · grouping/regions · CSS layout clone · mobile/touch certification · full keyboard/SR drag product · monetization · freezing a broader-than-minimal public Auto-Layout surface without review · implementing placement in DND-3.1.
