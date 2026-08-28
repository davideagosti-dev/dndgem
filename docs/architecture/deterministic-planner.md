# Deterministic Intelligence Planner (DND-4.2) & Optional Integration (DND-4.3)

**Status:** DND-4.2 COMPLETE; DND-4.3 Stage B implementation (awaiting Final Closure)  
**Package:** `@dndgem/intelligence` (`private: true`, workspace only)  
**Related:** [layout-intelligence-contract.md](./layout-intelligence-contract.md), [ADR-0018](../adr/ADR-0018-layout-intelligence-boundary.md), [auto-layout-contract.md](./auto-layout-contract.md), [dom-adapter.md](./dom-adapter.md)

---

## Purpose

Phase 4 introduces an **optional advisory planning layer**. The first-party planner proposes automatic-item processing order only. DnDGem Core remains the sole authority for geometry, validity, scoring, and final resolution.

```text
PlanningSnapshot
        ↓
LayoutPlanner (sync or async)
        ↓
runLayoutPlanner (orchestrator)
        ↓
normalizePlanningProposal
        ↓
automaticItemOrder
        ↓
createAutoLayoutProposal
        ↓
solveLayout
        ↓
evaluateLayout
        ↓
ResolvedLayout
```

---

## Private package status

`@dndgem/intelligence` remains a **private** workspace package:

- not published to npm
- not part of the six-package Changesets fixed group
- not a supported public Alpha install target
- **not** depended on by `@dndgem/dom` or framework adapters

DOM accepts a structural planner function. Consumers that want first-party orchestration compose `@dndgem/intelligence` helpers at the application boundary.

---

## Generic planner contract (DND-4.3)

```typescript
interface PlannerContext {
  readonly requestId: number;
  readonly signal?: AbortSignal;
}

type LayoutPlanner = (
  snapshot: PlanningSnapshot,
  context?: PlannerContext,
) => PlanningProposal | Promise<PlanningProposal>;
```

- Sync and async planners are both supported.
- `createDeterministicPlanningProposal` satisfies `LayoutPlanner` while remaining **synchronous**, pure, renderer-neutral, network-free, and deterministic.
- No provider-specific planner interfaces. No OpenAI / model types in DND-4.3.

---

## Orchestrator

`runLayoutPlanner` is the shared orchestration boundary:

1. invoke sync or async planner (`Promise.resolve` / await)
2. handle cancellation (`AbortSignal`)
3. handle throw / reject
4. normalize every successful proposal
5. execute deterministic fallback policy
6. return diagnostics suitable for tests / session callbacks

It does **not** call `evaluateLayout` to pick a planner result, implement solver scoring, duplicate Core validity, fabricate geometry, or mutate Source Intent.

Stale-result rejection (monotone request ids before apply) is enforced at the **session** layer.

Helper: `createOrchestratedLayoutPlanner(planner?)` returns a `LayoutPlanner` suitable for `createLayoutSession({ planner })` injection without a DOM→intelligence dependency.

---

## Planner input (`PlanningSnapshot`)

| Field         | Role                                              |
| ------------- | ------------------------------------------------- |
| `intent`      | Core `LayoutIntent` (items, constraints, source)  |
| `previous?`   | Stability-only prior layout (never Source Intent) |
| `prominence?` | Advisory weights keyed by item id                 |

`AbortSignal` is invoke-time runtime state only and must never be serialized into the snapshot.

---

## Prominence heuristic

Deterministic local planner ranking for automatic items:

```text
prominence DESC
→ declaration index ASC
→ itemId ASC
```

---

## Normalization (trust boundary)

Every planner output — deterministic, custom sync, custom async, or future provider — must pass through `normalizePlanningProposal` (intelligence) and Core’s independent defensive normalization:

1. keep valid automatic ids in proposed order (first wins on duplicates)
2. discard unknown, source-intent, and duplicate ids
3. append omitted automatic ids in declaration order
4. fall back entirely to declaration order when the proposal is unusable

---

## Fallback chain

Headless orchestration (`runLayoutPlanner`) and orchestrated DOM injection
(`createOrchestratedLayoutPlanner`) use the full chain:

```text
CUSTOM / ASYNC PLANNER FAILURE
          ↓
DETERMINISTIC LOCAL PLANNER
          ↓
DECLARATION-ORDER AUTO-LAYOUT
          ↓
CORE SOLVER
```

**Raw** `createLayoutSession({ planner })` (supported public configuration, no
DOM→intelligence dependency) fails closed differently:

```text
RAW SESSION PLANNER FAILURE
          ↓
PHASE 3 DECLARATION-ORDER AUTO-LAYOUT
          ↓
CORE SOLVER
```

Consumers who want the deterministic middle step on the DOM session path must
inject `createOrchestratedLayoutPlanner(custom)` (or an equivalent app-owned
wrapper). Wrapping vs raw injection therefore changes fallback depth by design;
both paths still preserve the committed layout and keep Core as the only solver.

---

## DOM session integration

```typescript
createLayoutSession({
  autoLayout: true,
  planner, // optional LayoutSessionPlanner (structural)
});

await session.replan(); // always Promise<void>
```

Semantics:

- **No planner:** existing Phase 3 behavior; `replan()` recomposes declaration-order Auto-Layout.
- **Initial layout:** always Phase 3 declaration order (planner never blocks first paint).
- **Explicit `replan()` only:** planner runs here — not on pointermove, drag preview, rAF, ResizeObserver, passive resize, every solve, or accepted drop.
- **PlanningSnapshot `previous`:** session builds the planner snapshot from current Source Intent **plus** committed previous layout as stability context for the planner. That does **not** promote previous into Source Intent.
- **Auto-Layout `previous` on explicit replan:** `createAutoLayoutProposal` is invoked **without** `previous` so generated placement competes fresh under the advisory order (Stage B retention cannot freeze the prior competition). Idle resize / accepted-drop recomposes may still pass committed previous for Phase 3 stability.
- **Retained advisory order:** the last **successful** replan order is retained in session state and reused for idle resize / accepted-drop Auto-Layout recomposes **without** re-invoking the planner. It is advisory only; Core `normalizeAutomaticItemOrder` discards unknown/source/duplicate ids and appends omitted automatic ids in declaration order. Fallback / no-order replan clears retention. Retained order is never a placement origin.
- **Stale protection:** monotone `requestId`; only the latest current request may commit.
- **Cancellation:** optional `AbortSignal`; cancelled/stale results never apply; cancellation ≠ Core validity failure.
- **Provenance:** `PlacementOrigin` remains `'source' | 'generated'` only.

Framework adapters (React / Vue / Angular / Svelte) pass through `planner` / `onPlannerEvent` and expose `replan()` without depending on `@dndgem/intelligence`.

---

## Core Auto-Layout extension

`AutoLayoutProposalInput.automaticItemOrder?` (DND-4.2) remains sufficient. DND-4.3 adds **no** Core planner abstractions.

---

## Provenance

Planner guidance is **not** a placement origin. Origins remain:

- `source` — Source Intent
- `generated` — Auto-Layout automatic placement

---

## Accessibility

Planner ordering affects visual placement opportunity for automatic items only. It does not reorder DOM nodes or alter reading order, focus order, keyboard semantics, or ARIA semantics.

---

## Privacy / SSR

- Structural payloads only (ids, dimensions, constraints, placements, prominence).
- No DOM content scraping, innerHTML, form values, credentials, or ARIA extraction in DND-4.3.
- No module-load references to `window` / `document` / `fetch` / `navigator` in planner code.
- `AbortController` is constructed only at invoke time.

---

## Limitations

- No model-based planning / OpenAI / provider SDKs (DND-4.4)
- Intelligence package remains private / unpublished
- Public API review for publishing intelligence remains deferred (DND-4.5)

---

## Fallback honesty

Basic DnDGem layout must never depend on remote/model/custom planner success. Deterministic Core Auto-Layout remains the floor.
