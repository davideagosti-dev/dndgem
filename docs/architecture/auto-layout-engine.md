# Auto-Layout Engine (DND-3.2 / DND-3.3)

Internal Core deterministic placement proposal engine with adaptive reflow stability.

**Status:** Implemented in `@dndgem/core` as **INTERNAL / NOT YET PUBLICLY FROZEN**.  
**Sprints:** DND-3.2 (placement) · DND-3.3 (stability / adaptive reflow / hybrid)  
**Product:** DnDGem by DA62

Related: [auto-layout-contract.md](./auto-layout-contract.md), [ADR-0014](../adr/ADR-0014-auto-layout-enrichment-provenance.md), [ADR-0010](../adr/ADR-0010-adaptive-solver-selection-policy.md), [roadmap.md](../roadmap.md).

---

## 1. Scope

```text
Source Intent (partial LayoutIntent.desiredPlacements)
        +
Constraints / Geometry
        +
Previous ResolvedLayout (optional; stability only)
        ↓
createAutoLayoutProposal  (INTERNAL)
        ↓
Generated Placements + placementOrigins (source | generated)
        +
unplacedItemIds
        ↓
Effective LayoutIntent
        ↓
existing solveLayout({ intent, previous? }) → evaluateLayout
        ↓
VALID / DEGRADED / INVALID → ResolvedLayout
```

**In this engine (Core):**

- Deterministic greedy first-fit placement (DND-3.2)
- Retain-first / reflow-second adaptive reflow (DND-3.3)
- Hybrid source + generated layouts
- Unplaced recovery across cycles
- No automatic compaction MVP

**Not in this engine:**

- DOM/React opt-in wiring, ResizeObserver, session state (DND-3.4)
- Public Alpha export freeze
- Drag runtime changes
- Pin/lock APIs
- Sizing DSL / AI / global packing optimization

Public Alpha consumers **cannot** enable Auto-Layout through documented React/Vanilla APIs yet (DND-3.4).

---

## 2. Internal entry point

Module: `packages/core/src/auto-layout.ts` (compiled to `dist/auto-layout.js`).

| Symbol                      | Visibility |
| --------------------------- | ---------- |
| `createAutoLayoutProposal`  | INTERNAL   |
| `AutoLayoutProposal`        | INTERNAL   |
| `AutoLayoutProposalInput`   | INTERNAL   |
| `PlacementOrigin`           | INTERNAL   |
| `maxProbeCountForOccupancy` | INTERNAL   |

Not exported from `@dndgem/core` package root. Tests and benchmarks import the module directly.

### Input

```ts
{
  intent: LayoutIntent;       // desiredPlacements = Source Intent
  sizingMode?: SizingMode;    // default preferred
  previous?: ResolvedLayout;  // DND-3.3 stability only — not an origin
}
```

---

## 3. Provenance

```text
PlacementOrigin = "source" | "generated"
```

- **source** — present in input `desiredPlacements` (Source Intent)
- **generated** — produced or retained by the proposal engine for a successfully placed automatic item

Unplaced automatic items are listed in `unplacedItemIds` and are **not** an origin value.

Not origins: `previous`, `effective`, `dragged`, `pinned`, `locked`, `unplaced`.

```text
Source Intent  ≠  Generated Placement  ≠  Previous Layout
```

Previous layout is **stability input only**. Retention never promotes geometry to `source`.

Mutation: input Source Intent and previous `ResolvedLayout` are never mutated; effective placements are newly composed.

---

## 4. Algorithm

### Ordering

Items are processed in `LayoutIntent.items` **declaration order** (stable; no public `priority` / z-index / weight).

### Sizing

Reuses shared internal `resolveItemSize` (`sizing.ts`) with modes `preferred` | `useful` | `minimal`. Default for proposals: **`preferred`**.

Current sizing is authoritative for retention dimensions. Previous **x/y** is a stability preference: Stage B builds `previous.x/y + current width/height` and retains that candidate when it fits.

### Stages (DND-3.3)

```text
Stage A — Source occupancy
  Copy feasible Source Intent → origin source; occupy free space when in-container

Stage B — Retain feasible previous position (automatic items only)
  For each automatic item in declaration order:
    if previous placement exists
    retentionCandidate = { x: previous.x, y: previous.y, width: currentSize.width, height: currentSize.height }
    if retentionCandidate fits current container
    and does not overlap occupied
    → retain candidate, origin = generated

Stage C — Deterministic reflow / first placement
  Remaining automatic items: bounded first-fit probes (DND-3.2)

Stage D — Unresolved
  no-fit → unplacedItemIds (no fabricated rectangle, no origin)
```

### Occupancy (Stage A)

1. Copy each Source Intent rect into effective placements with origin `source`.
2. If the source rect lies fully inside the container, add it to the occupancy set.
3. Infeasible source rects (outside container) remain `source` in effective intent but **do not** occupy free space for generation. Hard constraints + `solveLayout` remain authoritative.

### Retention rules (Stage B)

Retention candidate:

```text
previous x/y  +  current width/height
```

Retain when **all** hold:

- Item has **no** current Source Intent
- Previous placement exists for that item id
- Candidate (previous x/y + current size) fits current container bounds
- Candidate does not overlap already-committed occupancy (sources + earlier retained)

Size inequality alone does **not** reject retention. If the resized candidate is infeasible (bounds or overlap), retention fails and Stage C reflows.

If retained: **origin remains `generated`**.

If two previous generated placements conflict after shrink / grow / source insertion, **declaration order** decides which retains first; the later item reflows or unplaces.

### No automatic compaction (Phase 3 Alpha policy)

Freeing space (item removed, source removed, item shrinks, container grows) does **not** itself trigger automatic compaction. A generated placement retains its previous feasible position (with current size). Do not move items merely because a tighter first-fit packing now exists.

### Probes (Stage C — bounded)

For occupied set size `k`, probes (stable order):

1. Container origin `(0, 0)`
2. For each occupied rect in add order:
   - right edge `(x + width, y)`
   - bottom edge `(x, y + height)`

Bound: **`1 + 2·k` probes** per placement step (`maxProbeCountForOccupancy`).

No pixel scanning, no unbounded grid walk, no combinatorial search, no global optimization (Hungarian, annealing, beam, skyline).

### No-fit

If no probe yields a non-overlapping in-container placement:

```text
item → unplaced (listed in unplacedItemIds)
NO fabricated rectangle
NO (0,0) overlap fallback
NO placementOrigins entry for that item
```

### Unplaced recovery

`unplaced` is not durable session state. On a later cycle with more space / moved sources, previously unplaced automatic items are retried in declaration order (Stage C). No starvation priority for “was unplaced”.

---

## 5. Precedence

```text
hard constraints          → feasibility boundary (solver authoritative)
Source Intent             → strong occupancy; enricher does not relocate
previous generated geom   → stability preference (previous x/y + current size when feasible)
new generated placement   → deterministic fallback probes
```

Source Intent wins occupancy over previous generated geometry. Previous never displaces feasible Source Intent.

---

## 6. Complexity

Practical MVP bound:

```text
n = item count
retention checks ≈ O(n · occupied) per cycle
p_i ≤ 1 + 2·(i − 1)   (occupied count before placing automatic item i)
overlap check ≈ O(occupied)
```

Overall ≈ **`O(n² · p̄)`** with small bounded `p̄` (dashboard-scale Alpha). No spatial index.

---

## 7. Composition contract

```ts
// INTERNAL illustration — not a frozen public API
const proposal = createAutoLayoutProposal({ intent: sourceIntent, previous });
// proposal.unplacedItemIds signals incomplete Auto-Layout placement
const result = solveLayout({ intent: proposal.effectiveIntent, previous });
```

Auto-Layout does **not** bypass `solveLayout`. It does **not** emit Auto-specific validity states.

```text
proposal completeness  ≠  solver VALID / DEGRADED / INVALID
```

Opt-in: existing `solveLayout` behavior is unchanged unless a caller explicitly invokes the proposal engine.

---

## 8. Known limitations

- Greedy first-fit; not optimal bin packing
- Probe set is edge-based and may miss some free holes
- Spatial no-fit leaves items unplaced rather than fabricating overlap
- No automatic compaction when space frees (Phase 3 Alpha policy)
- Retention uses previous x/y + current size; infeasible resized candidates reflow
- Order-dependent retention conflicts (documented; declaration order)
- **DND-3.4 (adapters):** DOM/React session wiring, ResizeObserver, and adapter consumption of `unplacedItemIds` are not implemented here
- Public API shape still **PROPOSED / NOT APPROVED**
