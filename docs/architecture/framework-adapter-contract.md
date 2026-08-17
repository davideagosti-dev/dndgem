# JS/DOM Framework Adapter Contract (DND-FX.1)

Authoritative behavioral contract for every JS/DOM framework adapter over `@dndgem/dom`.

**Status:** APPROVED (DND-FX.1)  
**Scope:** `@dndgem/react` (reference) and future `@dndgem/vue`, `@dndgem/angular`, `@dndgem/svelte`  
**Not in scope:** Flutter / non-DOM renderers (ADR-0008); AI (Phase 4); Pin/Lock; default-on Auto-Layout

Related: [framework-expansion-planning-audit.md](./framework-expansion-planning-audit.md), [ADR-0015](../adr/ADR-0015-universal-framework-adapter-contract.md), [ADR-0016](../adr/ADR-0016-framework-package-topology.md), [ADR-0017](../adr/ADR-0017-ssr-browser-runtime-boundary.md), [ADR-0013](../adr/ADR-0013-react-vanilla-integration-boundary.md), [ADR-0014](../adr/ADR-0014-auto-layout-enrichment-provenance.md), [dom-adapter.md](./dom-adapter.md), [alpha-api-contract.md](./alpha-api-contract.md).

This contract defines **behavioral parity**, not identical syntax. React Provider/hooks must not be copied mechanically into Vue, Angular, or Svelte.

---

## A. Responsibility model

```text
@dndgem/core
  domain, constraints, validity, scoring, Auto-Layout proposal, solveLayout

@dndgem/dom
  measurement, ResizeObserver, drag mechanics, createLayoutSession, apply styles

JS/DOM framework adapter
  lifecycle, element registration, reactive state, idiomatic DX, cleanup
```

Adapters **must not** implement solver policy, Auto-Layout placement policy, constraint semantics, scoring, validity, or reflow algorithms.

Vanilla apps consume `@dndgem/dom` directly. There is no `@dndgem/vanilla`.

---

## B. Initialization

Create the runtime only through:

```ts
createLayoutSession(input);
```

from `@dndgem/dom`.

Adapters must not:

- call `solveLayout` / `createAutoLayoutProposal` as a second policy path
- construct `@dnd-kit` types
- start a session at module evaluation

Headless Core compose remains a **consumer** option. It is not an adapter pipeline.

---

## C. Container registration

Exactly one positioned containing block per board.

Prefer **host-element** bindings (callback ref, action, directive on the consumer node). Do **not** require a library wrapper element that replaces or wraps the consumer’s semantic node.

---

## D. Item registration

Stable string item id → consumer `HTMLElement`.

The session starts only after:

```text
container + every declared item element
```

are registered. Mid-session add/remove without recreation is **not** a supported API (ADR-0013). Changing the declared item set recreates the session and discards in-flight drag.

---

## E. Session ownership

Exactly one `createLayoutSession` per board.

- No nested second session on the same nodes
- No duplicate `ResizeObserver` on those nodes
- No duplicate drag-mechanics `connect` for the same board while the first is live

Dev-mode double mount (React Strict Mode, HMR, equivalent) must dispose the first session before the second remains. Disposal is idempotent.

---

## F. Recreation policy

`createLayoutSession` has **no** `update()` API. Do not invent one in DND-FX.1–FX.4 unless a later sprint proves it.

Framework adapters that are reactive **recreate** the session (dispose + create) when significant configuration changes, matching `@dndgem/react`:

| Change                                                 | Recreate? | `previous` passed into the new session                                                                                                   |
| ------------------------------------------------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Declared item set                                      | yes       | last committed `ResolvedLayout` (idle stability)                                                                                         |
| Item constraint configuration                          | yes       | last committed `ResolvedLayout`                                                                                                          |
| `desiredPlacements` (Auto-Layout **off**)              | yes       | **omit** `previous` so ADR-0010 cannot suppress new author intent                                                                        |
| `desiredPlacements` (Auto-Layout **on**)               | yes       | **keep** `previous` so generated items can retain; the DOM session still omits **solver** `previous` on non-passive Source Intent cycles |
| `autoLayout` enablement                                | yes       | follow the new mode’s rule                                                                                                               |
| Callback identity (`onChange` / `onDrop` / `onCancel`) | **no**    | hold callbacks in refs / equivalent                                                                                                      |
| `mechanics` / `ResizeObserver` injection               | yes       | test seams                                                                                                                               |

Reference: `packages/react/src/provider.tsx`.

---

## G. Reactive state

Expose `LayoutSessionState` from `@dndgem/dom`.

- `ready` means a session exists and `getState()` is available — not that Auto-Layout was complete
- `state.solver.evaluation.state` remains `VALID` \| `DEGRADED` \| `INVALID` only
- Do not invent framework-specific validity enums or wrap `INVALID` in thrown errors

---

## H. Auto-Layout

Equivalent opt-in to the DOM session:

```ts
createLayoutSession({ autoLayout?: boolean })
```

Default / omitted = **off** (explicit-only path). Adapters must not default-on.

When `autoLayout: true`:

- `desiredPlacements` may be partial or absent (Source Intent)
- remaining items are proposed by Core Auto-Layout inside the session
- `state.autoLayout` is `{ enabled: true; proposalUnplacedItemIds }`

---

## I. Partial / hybrid intent

Adapters must pass consumer `desiredPlacements` through as Source Intent.

They must **not**:

- backfill missing keys from previous layout or measurement as Source Intent
- treat generated placements as durable author intent
- promote sibling geometry to Source Intent on drag accept (DOM promotes **only** the active item)

---

## J. Provenance

Keep these distinct (ADR-0014):

| Concept                | Role                                                                |
| ---------------------- | ------------------------------------------------------------------- |
| Source Intent          | Durable explicit placement (config or accepted drag)                |
| Generated Placement    | Auto-Layout-inferred geometry; origin `generated`                   |
| Previous layout        | Stability signal only — **not** an origin                           |
| Effective solver input | Composed `LayoutIntent` passed to `solveLayout` — **not** an origin |
| Unplaced (proposal)    | Automatic items with no Auto-Layout rectangle — **not** an origin   |

MVP origins remain `'source' | 'generated'` only.

---

## K. Drag lifecycle

Behavioral equivalents (policy owned by DOM/Core):

| Event         | Required behavior                                                                            |
| ------------- | -------------------------------------------------------------------------------------------- |
| Preview       | `state.proposal` / phase `dragging`; skip writing committed layout styles on the active item |
| Accepted drop | commit solver result; with Auto-Layout, promote **only** the active item generated → source  |
| Rejected drop | restore last committed layout                                                                |
| Cancel        | restore last committed layout (Escape is the validated cancel path)                          |

Adapters bind mechanics and re-render from session state. They do not reimplement accept/reject.

---

## L. Resize / reflow

Idle resize is the DOM session (`observeLayout` inside `createLayoutSession`).

Adapters must not:

- attach a second `ResizeObserver` to the same container/items
- implement a framework-owned reflow algorithm
- pass Core `previous` on drag proposals

---

## M. Proposal completeness

When Auto-Layout is on, expose session:

```text
state.autoLayout.proposalUnplacedItemIds
```

Semantics:

```text
proposal completeness  ≠  solver validity
proposalUnplacedItemIds  ≠  “missing from ResolvedLayout”
```

Core proposal objects use `unplacedItemIds`. Session/React surface uses `proposalUnplacedItemIds`. Adapters must not collapse those names into a second validity language.

---

## N. Cleanup

On unmount, provider/service destruction, and route leave:

```ts
session.dispose();
```

`dispose()` is idempotent. It disconnects observers and drag bindings. It does **not** restore pre-session layout inline styles. DnDGem owns `position` / `left` / `top` / `width` / `height` / `box-sizing` (and clears `transform`) on mapped items after mount.

Navigation return must create **one** new session after nodes re-register. No duplicate owners.

---

## O. Error model

| Layer   | Type              | Meaning                                                   |
| ------- | ----------------- | --------------------------------------------------------- |
| Core    | `DomainError`     | Malformed domain input                                    |
| Core    | `ValidityState`   | Evaluated quality — **not** an exception                  |
| DOM     | `DomAdapterError` | Missing elements, disposed session, invalid session input |
| Adapter | framework error   | Context/inject/hook used outside the board root           |

Do not convert Core `INVALID` into a thrown error.

---

## P. Accessibility

Preserve the Alpha baseline ([accessibility.md](../guides/accessibility.md)):

- Pointer interaction + Escape cancel
- Baseline focus preservation
- Consumer ARIA / `tabIndex` / descendants preserved
- Layout apply is style-only (`layoutPlacementStyle`)
- No required wrapper DOM
- No DOM reorder (visual order may differ from source order)

Do **not** claim keyboard drag, screen-reader drag announcements, full WCAG, or mobile/touch.

---

## Q. SSR / client runtime

See [ADR-0017](../adr/ADR-0017-ssr-browser-runtime-boundary.md). Summary:

1. Module import must not touch `window` / `document` or create a session
2. Server render must not call `createLayoutSession`
3. Client session only after real HTMLElements exist
4. Hydration may apply layout **after** mount (`ready` false → empty layout styles is allowed)
5. Teardown disposes; return recreates

Do not claim isomorphic server-side resolved layout.

---

## R. Testing expectations

| Layer   | Owns                                                                                               |
| ------- | -------------------------------------------------------------------------------------------------- |
| Core    | Algorithm, provenance, determinism                                                                 |
| DOM     | Session Auto-Layout, drag promotion, dispose, measurement                                          |
| Adapter | Registration, recreation policy, context errors, a11y attribute preservation, Vanilla parity smoke |
| E2E     | Pointer drag, resize, Escape, examples                                                             |

Do not duplicate Core Auto-Layout tables inside every adapter.

---

## S. Public DX shape (guidance, not frozen names)

| Adapter | Idiomatic direction (DND-FX.2–FX.4 decide names)                   |
| ------- | ------------------------------------------------------------------ |
| React   | `DnDGemProvider` + hooks (exists)                                  |
| Vue     | provide/inject + composables; Vue 3 only                           |
| Angular | board-level injectable + standalone host directives; zoneless-safe |
| Svelte  | context + actions; Svelte 5                                        |

Syntax may differ. Behavior in A–Q must not.
