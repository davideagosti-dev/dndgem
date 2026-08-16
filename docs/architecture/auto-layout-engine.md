# Auto-Layout Engine (DND-3.2 / DND-3.3 / DND-3.4)

Core deterministic placement proposal engine with adaptive reflow stability, wired through DOM/React opt-in sessions (DND-3.4).

**Status:** Core proposal **PUBLIC ALPHA (minimal)** — `createAutoLayoutProposal` + types exported from `@dndgem/core`. Algorithm helpers (`maxProbeCountForOccupancy`, sizing) remain **INTERNAL**. DOM/React consumer wiring COMPLETE (pending review/commit).  
**Sprints:** DND-3.2 (placement) · DND-3.3 (stability / adaptive reflow / hybrid) · DND-3.4 (DOM/React opt-in)  
**Product:** DnDGem by DA62

Published npm `0.1.0-alpha.0` does **not** include Auto-Layout; this is repository / next Alpha capability.

Related: [auto-layout-contract.md](./auto-layout-contract.md), [ADR-0014](../adr/ADR-0014-auto-layout-enrichment-provenance.md), [ADR-0010](../adr/ADR-0010-adaptive-solver-selection-policy.md), [alpha-api-contract.md](./alpha-api-contract.md), [roadmap.md](../roadmap.md).

---

## 1. Scope

```text
Source Intent (partial LayoutIntent.desiredPlacements)
        +
Constraints / Geometry
        +
Previous ResolvedLayout (optional; stability only)
        ↓
createAutoLayoutProposal  (PUBLIC ALPHA — minimal)
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

**Consumer wiring (DND-3.4):**

- Opt-in `createLayoutSession({ autoLayout: true })` / `DnDGemProvider` `autoLayout`
- Session Source Intent retention; drag accept promotes only the active item
- `LayoutSessionState.autoLayout.proposalUnplacedItemIds` for Auto-Layout **proposal** completeness (not “missing from ResolvedLayout”)

**Still out of scope:**

- Default-on Auto-Layout
- Broader public API freeze beyond the minimal surface (DND-3.5 / review)
- Pin/lock APIs
- Sizing DSL / AI / global packing optimization

---

## 2. Public entry point (minimal)

Module: `packages/core/src/auto-layout.ts` (exported from `@dndgem/core` package root).

| Symbol                      | Visibility                 |
| --------------------------- | -------------------------- |
| `createAutoLayoutProposal`  | **PUBLIC ALPHA (minimal)** |
| `AutoLayoutProposal`        | **PUBLIC ALPHA (minimal)** |
| `AutoLayoutProposalInput`   | **PUBLIC ALPHA (minimal)** |
| `PlacementOrigin`           | **PUBLIC ALPHA (minimal)** |
| `maxProbeCountForOccupancy` | INTERNAL                   |
| sizing helpers              | INTERNAL                   |

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
const proposal = createAutoLayoutProposal({ intent: sourceIntent, previous });
// proposal.unplacedItemIds signals incomplete Auto-Layout placement
const result = solveLayout({ intent: proposal.effectiveIntent, previous });
```

Auto-Layout does **not** bypass `solveLayout`. It does **not** emit Auto-specific validity states.

```text
proposal completeness  ≠  solver VALID / DEGRADED / INVALID
```

Opt-in: existing `solveLayout` behavior is unchanged unless a caller explicitly invokes the proposal engine (or enables session `autoLayout`).

DOM/React (DND-3.4): `createLayoutSession({ autoLayout: true })` and `DnDGemProvider` `autoLayout` compose the same path and surface `proposalUnplacedItemIds` on session state (proposal completeness metadata; Core proposal objects still use `unplacedItemIds`).

---

## 8. Known limitations

- Greedy first-fit; not optimal bin packing
- Probe set is edge-based and may miss some free holes
- Spatial no-fit leaves items unplaced rather than fabricating overlap
- No automatic compaction when space frees (Phase 3 Alpha policy)
- Retention uses previous x/y + current size; infeasible resized candidates reflow
- Order-dependent retention conflicts (documented; declaration order)
- Published `0.1.0-alpha.0` does not ship Auto-Layout; next Alpha publish is DND-3.5
