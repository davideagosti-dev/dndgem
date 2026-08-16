# Auto-Layout Engine (DND-3.2)

Internal Core deterministic placement proposal engine.

**Status:** Implemented in `@dndgem/core` as **INTERNAL / NOT YET PUBLICLY FROZEN**.  
**Sprint:** DND-3.2  
**Product:** DnDGem by DA62

Related: [auto-layout-contract.md](./auto-layout-contract.md), [ADR-0014](../adr/ADR-0014-auto-layout-enrichment-provenance.md), [roadmap.md](../roadmap.md).

---

## 1. Scope

DND-3.2 proves Auto-Layout at the Core level only:

```text
Source Intent (partial LayoutIntent.desiredPlacements)
        +
Constraints / Geometry
        ↓
createAutoLayoutProposal  (INTERNAL)
        ↓
Generated Placements + placementOrigins (source | generated)
        ↓
Effective LayoutIntent
        ↓
existing solveLayout → evaluateLayout
        ↓
VALID / DEGRADED / INVALID → ResolvedLayout
```

**Not in this sprint:** DOM/React opt-in wiring (DND-3.4), public Alpha export freeze, drag runtime changes, Core adaptive reflow / previous-layout stability (DND-3.3), pin/lock, sizing DSL, AI.

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

---

## 3. Provenance

```text
PlacementOrigin = "source" | "generated"
```

- **source** — present in input `desiredPlacements` (Source Intent)
- **generated** — produced by the proposal engine for a successfully placed automatic item

Unplaced automatic items are listed in `unplacedItemIds` and are **not** an origin value.

Not origins: `previous`, `effective`, `dragged`, `pinned`, `locked`, `unplaced`.

Previous layout remains a **solve-time stability** input to `solveLayout` only. Effective intent is a **composition artifact**, not an origin.

Mutation: input Source Intent is never mutated; effective placements are newly composed.

---

## 4. Algorithm

### Ordering

Items are processed in `LayoutIntent.items` **declaration order** (stable; no public `priority`).

### Sizing

Reuses shared internal `resolveItemSize` (`sizing.ts`) with modes `preferred` | `useful` | `minimal`. Default for proposals: **`preferred`**.

### Occupancy

1. Copy each Source Intent rect into effective placements with origin `source`.
2. If the source rect lies fully inside the container, add it to the occupancy set.
3. Infeasible source rects (outside container) remain `source` in effective intent but **do not** occupy free space for generation. Hard constraints + `solveLayout` remain authoritative.

### Probes (bounded)

For occupied set size `k`, probes (stable order):

1. Container origin `(0, 0)`
2. For each occupied rect in add order:
   - right edge `(x + width, y)`
   - bottom edge `(x, y + height)`

Bound: **`1 + 2·k` probes** per placement step (`maxProbeCountForOccupancy`).

No pixel scanning, no unbounded grid walk, no combinatorial search.

### First-fit

For each automatic item:

1. Resolve size target
2. Enumerate probes in order
3. Reject probes that exit the container
4. Reject probes that overlap occupied rectangles (edge-touching allowed)
5. Accept first fit; mark occupied
6. Continue

### No-fit

If no probe yields a non-overlapping in-container placement:

```text
item → unplaced (listed in unplacedItemIds)
NO fabricated rectangle
NO (0,0) overlap fallback
NO placementOrigins entry for that item
```

Proposal completeness is **distinct** from solver validity. Unplaced items remain in `effectiveIntent.items` without a desired placement. Callers must not treat an incomplete proposal as if Auto-Layout invented overlapping geometry. Existing `solveLayout` / `evaluateLayout` remain the only VALID / DEGRADED / INVALID authority — Auto-Layout does not emit parallel Auto-* statuses.

---

## 5. Complexity

Practical MVP bound:

```text
n = item count
p_i ≤ 1 + 2·(i − 1)   (occupied count before placing automatic item i)
overlap check ≈ O(occupied)
```

Overall ≈ **`O(n² · p̄)`** with small bounded `p̄` (dashboard-scale Alpha). No spatial index.

---

## 6. Composition contract

```ts
// INTERNAL illustration — not a frozen public API
const proposal = createAutoLayoutProposal({ intent: sourceIntent });
// proposal.unplacedItemIds signals incomplete Auto-Layout placement
const result = solveLayout({ intent: proposal.effectiveIntent, previous });
```

Auto-Layout does **not** bypass `solveLayout`. It does **not** emit Auto-specific validity states.

```text
proposal completeness  ≠  solver VALID / DEGRADED / INVALID
```

Opt-in: existing `solveLayout` behavior is unchanged unless a caller explicitly invokes the proposal engine.

---

## 7. Known limitations

- Greedy first-fit; not optimal bin packing
- Probe set is edge-based and may miss some free holes
- Spatial no-fit leaves items unplaced rather than fabricating overlap
- **DND-3.3 (Core):** resize/reflow, previous-layout stability, and Core-level generated/unplaced recovery are not implemented here
- **DND-3.4 (adapters):** DOM/React session wiring and adapter consumption of `unplacedItemIds` are not implemented here
- Public API shape still **PROPOSED / NOT APPROVED**
