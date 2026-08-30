# Advisory Planner (Phase 4)

Optional advisory planning for Auto-Layout. Published on npm `@alpha` as of **`0.1.0-alpha.4`**.

Binding principle:

```text
Intelligence proposes.
Deterministic DnDGem validates and resolves.
```

Planners return **advisory automatic-item order only**. Core still owns geometry, constraints, `VALID` / `DEGRADED` / `INVALID`, scoring, and final resolution via `createAutoLayoutProposal` → `solveLayout` → `evaluateLayout`.

DnDGem does **not** require or own an AI provider. No public `@dndgem/intelligence*` packages ship on npm.

Related: [Deterministic planner (architecture)](../architecture/deterministic-planner.md), [Alpha API Contract](../architecture/alpha-api-contract.md), [Limitations](./limitations.md).

## Minimal Vanilla session

```ts
import { createLayoutSession, type LayoutSessionPlanner } from '@dndgem/dom';

const planner: LayoutSessionPlanner = (snapshot) => {
  // Consumer-owned ranking — advisory order only
  const ids = snapshot.intent.items
    .map((item) => String(item.id))
    .filter((id) => snapshot.intent.desiredPlacements?.[id] === undefined);
  return { automaticItemOrder: ids };
};

const session = createLayoutSession({
  container,
  items: [/* … */],
  autoLayout: true,
  planner,
  // Optional diagnostic callback (not a second solver):
  // onPlannerEvent: (event) => { … },
});

// Initial layout uses Phase 3 declaration-order Auto-Layout (planner does not block first paint).
await session.replan(); // explicit advisory replan only
```

## What the planner may return

```ts
interface LayoutSessionPlanningProposal {
  readonly automaticItemOrder: readonly string[];
}
```

- Optional when omitted: declaration-order Auto-Layout (Phase 3 default)
- Unknown, duplicate, and Source Intent ids are ignored by Core normalization
- Does **not** author `x` / `y` / width / height, validity, score, or placement origin
- Does **not** reorder DOM nodes, focus order, or ARIA semantics

## Async planner

Sync and async planners are both supported. `replan()` always returns `Promise<void>`.

```ts
const planner: LayoutSessionPlanner = async (snapshot, context) => {
  if (context?.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
  // Consumer-owned planning (local heuristic, your backend, etc.)
  const automaticItemOrder = await rankItems(snapshot, context?.signal);
  return { automaticItemOrder };
};

await session.replan();
```

Session behavior:

| Concern                | Behavior                                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| When planner runs      | Only via explicit `replan()` — never pointermove, drag preview, rAF, ResizeObserver, passive resize, accepted drop, or every solve |
| First paint            | Always Phase 3 declaration-order Auto-Layout when `autoLayout: true`                                                               |
| `AbortSignal`          | Passed on `LayoutSessionPlannerContext.signal`; session aborts superseded work                                                     |
| Stale results          | Newer `requestId` wins; stale proposals are not applied                                                                            |
| Planner throw / reject | Fall back to Phase 3 declaration-order Auto-Layout                                                                                 |
| No planner configured  | `replan()` recomposes declaration-order Auto-Layout                                                                                |

## Planner events

Optional `onPlannerEvent` is **diagnostic**. It does not replace `onChange` / drag callbacks and is **not** a second validity authority.

```ts
type LayoutSessionPlannerStatus =
  'planning' | 'applied' | 'fallback' | 'cancelled' | 'stale' | 'error';

interface LayoutSessionPlannerEvent {
  readonly requestId: number;
  readonly status: LayoutSessionPlannerStatus;
  readonly proposalSource?: 'custom' | 'declaration';
  readonly fallbackReason?: 'planner-throw' | 'cancelled';
}
```

Use it for UX / telemetry around advisory replan — never to override Core `VALID` / `DEGRADED` / `INVALID`.

## Framework parity

| Adapter | How to wire                                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------------------------ |
| React   | `DnDGemProvider` props `planner` / `onPlannerEvent`; `useDnDGem().replan()`                                              |
| Vue     | Same props; `useDnDGem().replan()`                                                                                       |
| Angular | `planner` / `onPlannerEvent` on board config, or `dndgemPlanner` / `dndgemPlannerEvent`; `replan()` on board / directive |
| Svelte  | Provider props; store / context `replan()`                                                                               |

Meta-frameworks (Next.js / Nuxt / SvelteKit) inherit planner capability through the underlying adapter — no dedicated runtime.

## Core-only hook (headless)

Without a session, pass advisory order into Auto-Layout:

```ts
import { createAutoLayoutProposal, solveLayout } from '@dndgem/core';

const proposal = createAutoLayoutProposal({
  intent,
  automaticItemOrder, // optional
});
const result = solveLayout({ intent: proposal.effectiveIntent });
```

## Private packages (not install targets)

| Package                       | Status                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------- |
| `@dndgem/intelligence`        | **Private** workspace reference (deterministic planner + orchestration helpers) |
| `@dndgem/intelligence-openai` | **Private** experimental reference — model assistance **deferred**              |

Public consumers implement `LayoutSessionPlanner` themselves. Do **not** `npm install` these names.

## Security (consumer-owned remote planners)

DnDGem does not require or own an AI provider.

If you call a remote service from a consumer-owned planner:

- never place provider secrets in browser code
- use a consumer-owned backend / server boundary
- the consumer owns credentials, billing, and quota
- send structural / sanitized payloads only unless you explicitly opt into richer content

There is no supported public OpenAI (or other provider) DnDGem integration package.

## Model assistance

DND-4.4 classified **`DEFER MODEL ASSISTANCE`**: remote inference is not a default product capability. Reopening requires new evidence — see [Model-assisted planning experiment](../architecture/model-assisted-planning-experiment.md) and the roadmap reopen criteria.
