# Deterministic Intelligence Planner (DND-4.2)

**Status:** COMPLETE (DND-4.2 closure gate) — private / experimental workspace package  
**Package:** `@dndgem/intelligence` (`private: true`, workspace only)  
**Related:** [layout-intelligence-contract.md](./layout-intelligence-contract.md), [ADR-0018](../adr/ADR-0018-layout-intelligence-boundary.md), [auto-layout-contract.md](./auto-layout-contract.md)

---

## Purpose

DND-4.2 introduces the first production planner code for Phase 4 as a **deterministic advisory layer**. The planner proposes automatic-item processing order only. DnDGem Core remains the sole authority for geometry, validity, scoring, and final resolution.

```text
PlanningSnapshot
        ↓
createDeterministicPlanningProposal
        ↓
PlanningProposal (advisory)
        ↓
normalizePlanningProposal
        ↓
createAutoLayoutProposal({ automaticItemOrder? })
        ↓
solveLayout
        ↓
evaluateLayout
        ↓
ResolvedLayout
```

This sprint is **headless / caller-composed**. Framework adapters and session hot paths are not wired to the planner in DND-4.2 (deferred to DND-4.3).

---

## Private package status

`@dndgem/intelligence` is approved only as a **private workspace package** for DND-4.2. It is:

- not published to npm
- not part of the six-package Changesets fixed group
- not a supported public Alpha API
- not depended on by `@dndgem/dom` or framework adapters in this sprint

Public API review for intelligence belongs to DND-4.3 / DND-4.5.

---

## Planner input (`PlanningSnapshot`)

Minimum internal snapshot (not frozen public API):

| Field         | Role                                              |
| ------------- | ------------------------------------------------- |
| `intent`      | Core `LayoutIntent` (items, constraints, source)  |
| `previous?`   | Stability-only prior layout (never Source Intent) |
| `prominence?` | Advisory weights keyed by item id                 |

No DOM types, framework types, groups, regions, layout-goal DSL, or provider metadata in DND-4.2.

---

## Prominence heuristic

The sole DND-4.2 planner strategy ranks **automatic items only** (items without Source Intent placement):

```text
prominence DESC
→ declaration index ASC
→ itemId ASC
```

Behavior:

- missing prominence → `0`
- non-finite prominence → `0`
- unknown prominence ids → ignored
- Source Intent items → excluded from automatic order
- equal prominence → declaration order preserved

The planner does **not** call `solveLayout` or `evaluateLayout` and does **not** choose layouts by score.

---

## Planner output (`PlanningProposal`)

Minimum advisory output:

```typescript
interface PlanningProposal {
  readonly automaticItemOrder: readonly string[];
}
```

No geometry, validity states, solver scores, confidence, or natural-language explanations in DND-4.2.

---

## Normalization (trust boundary)

Planner output is advisory/untrusted. `normalizePlanningProposal` / Core defensive normalization ensure `automaticItemOrder` cannot corrupt Auto-Layout:

1. keep valid automatic ids in proposed order (first wins on duplicates)
2. discard unknown, source-intent, and duplicate ids
3. append omitted automatic ids in declaration order
4. fall back entirely to declaration order when the proposal is unusable

The normalized result is a complete deterministic permutation of automatic item ids.

---

## Core Auto-Layout extension

`AutoLayoutProposalInput` accepts an optional:

```typescript
automaticItemOrder?: readonly string[];
```

When omitted, Auto-Layout behavior is **identical to Phase 3** (declaration order for Stage B/C automatic processing).

When provided, Stage B (previous retention) and Stage C (first-fit reflow) iterate automatic items in the normalized order. Stage A Source occupancy, geometry probes, sizing, hard constraints, provenance, and solver semantics are unchanged.

Core does not import `@dndgem/intelligence` and applies its own defensive normalization when consumers pass `automaticItemOrder` directly.

---

## Provenance

Planner guidance is **not** a placement origin. Existing origins remain:

- `source` — Source Intent
- `generated` — Auto-Layout automatic placement

Intelligence does not mutate `intent.desiredPlacements` or promote generated placements into Source Intent.

---

## Determinism and lifecycle

- Same snapshot → same proposal (no randomness, timestamps, or environment dependence)
- No network, AI SDK, or provider dependencies in DND-4.2
- No model inference in pointermove, drag preview, rAF, ResizeObserver, or every solve call

---

## Accessibility

Planner ordering affects **visual placement opportunity** for automatic items only. It does not reorder DOM nodes or alter reading order, focus order, keyboard semantics, or ARIA semantics.

---

## Limitations (DND-4.2)

- Single heuristic only (prominence-weighted order)
- No grouping, regions, affinity, or layout-goal DSL
- No framework/session integration (DND-4.3)
- No model-based planning (DND-4.4)
- No public npm surface for `@dndgem/intelligence`

---

## Fallback

When planner output is missing, malformed, or unusable, Auto-Layout falls back to Phase 3 declaration order. Deterministic DnDGem continues to function with intelligence absent.
