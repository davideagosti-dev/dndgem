# Alpha API Contract

Authoritative public contract for the first DnDGem Alpha.

This document defines what external consumers may rely on. It is **not** a v1 stability promise. Public Alpha publication itself remains the DND-2.5 gate; DND-2.2 prepares the contract and release mechanics only.

Related: [overview.md](./overview.md), [core-domain.md](./core-domain.md), [dom-adapter.md](./dom-adapter.md), [package-boundaries.md](./package-boundaries.md), [release-strategy.md](./release-strategy.md).

## Identity

- Brand: DA62
- Product: DnDGem
- Attribution: DnDGem by DA62
- Category: Content-Aware Adaptive Layout Engine
- Distinction: geometrically fits ≠ content remains useful
- Canonical: https://dndgem.dev
- Support: `support@dndgem.dev`
- Security: `security@dndgem.dev`

## Supported packages

| Package           | Role                                                                 | Typical consumer      | Publication                          |
| ----------------- | -------------------------------------------------------------------- | --------------------- | ------------------------------------ |
| `@dndgem/core`    | Domain, constraints, validity, scoring, deterministic `solveLayout`  | Headless / all layers | Published `0.1.0-alpha.3` / `@alpha` |
| `@dndgem/dom`     | Measurement, resize, drag interaction, Vanilla `createLayoutSession` | Vanilla DOM apps      | Published `0.1.0-alpha.3` / `@alpha` |
| `@dndgem/react`   | Thin React lifecycle adapter over the DOM session                    | React apps            | Published `0.1.0-alpha.3` / `@alpha` |
| `@dndgem/vue`     | Thin Vue 3 lifecycle adapter over the DOM session                    | Vue 3 apps            | Published `0.1.0-alpha.3` / `@alpha` |
| `@dndgem/angular` | Thin Angular lifecycle adapter over the DOM session                  | Angular apps          | Published `0.1.0-alpha.3` / `@alpha` |
| `@dndgem/svelte`  | Thin Svelte 5 lifecycle adapter over the DOM session                 | Svelte 5 apps         | Published `0.1.0-alpha.3` / `@alpha` |

No other `@dndgem/*` packages are currently part of published Alpha. Flutter is a separate track. Meta-framework environments (Next.js, Nuxt, SvelteKit) use the adapters above — there is no `@dndgem/next`, `@dndgem/nuxt`, or `@dndgem/sveltekit`.

## Public entrypoints

Each package is **ESM-only**. The only supported import path is the package root:

```ts
import { solveLayout } from '@dndgem/core';
import { createLayoutSession } from '@dndgem/dom';
import { DnDGemProvider } from '@dndgem/react';
import { DnDGemProvider as VueDnDGemProvider } from '@dndgem/vue';
import { DnDGemBoardDirective } from '@dndgem/angular';
import { DnDGemProvider as SvelteDnDGemProvider } from '@dndgem/svelte';
```

Deep imports (`@dndgem/core/solve`, `@dndgem/dom/src/...`, `@dndgem/react/dist/...`, `@dndgem/vue/dist/...`, `@dndgem/angular/dist/...`, `@dndgem/svelte/dist/...`) are **not** part of the contract even if a file exists in the published tarball.

Module shape:

- `"type": "module"`
- `exports["."].import` → `./dist/index.js`
- `exports["."].types` → `./dist/index.d.ts`
- No CommonJS `require` export

## Environment assumptions

| Area                       | Alpha statement                                                                                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node                       | `>=20` for tooling and ESM import of published packages                                                                                                           |
| Bundlers                   | Vite / modern bundlers with ESM are the expected app path                                                                                                         |
| Browser                    | Chromium / Firefox / WebKit desktop engines **SUPPORTED FOR ALPHA** (Playwright). Mobile **NOT VALIDATED**.                                                       |
| DOM                        | `@dndgem/dom` and React rendering require a browser-like DOM at runtime                                                                                           |
| Pointer drag               | Validated interaction path                                                                                                                                        |
| Keyboard drag              | **DEFERRED** — not a product-validated path                                                                                                                       |
| Accessibility              | Baseline: Escape cancel + focus/ARIA preservation; no full WCAG / SR drag claim — see a11y guide                                                                  |
| SSR / hydration            | Module import is safe without `window`. Client session after mount. No server-side layout claim. See [ADR-0017](../adr/ADR-0017-ssr-browser-runtime-boundary.md). |
| Next.js / Nuxt / SvelteKit | Validated **compatibility environments** (DND-FX.5). Not packages. Client-session integration only. See [meta-frameworks.md](../guides/meta-frameworks.md).       |
| React                      | Peer `react@^18 \|\| ^19`. Client mount required for `DnDGemProvider`. Next.js App Router: `'use client'` on the integration root.                                |
| Vue                        | Peer `vue@^3.5.0`. Client mount required. Nuxt is a validated compatibility environment (no `@dndgem/nuxt`).                                                      |
| Angular                    | Peer `@angular/core@^20 \|\| ^21 \|\| ^22`. Client mount required. Universal **not** validated. Zoneless-compatible.                                              |
| Positioning                | Container is a positioned containing block; items are absolutely positioned from resolved geometry                                                                |

Repository metadata `repository.url` points at `https://github.com/davideagosti-dev/dndgem`. The GitHub repository is currently **PRIVATE**; those links are source-of-truth for maintainers, not a claim of public accessibility. Package `homepage` / public support point at **https://dndgem.dev** (see [Public site & domain hosting](./public-site.md)).

## Stability policy (0.x Alpha)

Alpha versions are `0.x` prereleases (expected first publish: `0.1.0-alpha.0`, npm dist-tag `alpha`).

That means:

- The public surface below is **intentional**
- Breaking changes remain possible during 0.x
- Breaking changes require a changeset and changelog entry
- Silent breaking changes are not acceptable
- Consumer-facing removals or renames must be documented
- This is **not** SemVer 1.0 stability

Deprecation: Alpha will prefer a documented removal in the next prerelease over long overlapping dual APIs. There is no commitment to keep deprecated names for a fixed calendar period.

## Explicit intent invariant

Public API hardening must not change Core `previous` semantics:

| Situation                     | Core `previous` |
| ----------------------------- | --------------- |
| Explicit drag intent          | omitted         |
| Explicit `desiredPlacements`  | omitted         |
| Passive resize                | may be supplied |
| Constraints-only continuation | may be supplied |

## `@dndgem/core` public exports

Runtime:

- `CORE_PACKAGE_NAME`, `CORE_PACKAGE_VERSION`, `getCorePackageInfo`
- `DomainError`
- `LAYOUT_SCHEMA_VERSION`
- `VALIDITY_STATES`
- `createPoint`, `createRect`, `createSize`
- `createItemId`, `itemIdToString`, `itemIdsEqual`
- `createContentConstraints`
- `createLayoutItem`
- `createLayoutSpace`
- `createLayoutIntent`, `listLayoutIntentItemIds`
- `createResolvedLayout`
- `SCORE_PREFERENCE_WEIGHT`, `SCORE_USEFULNESS_WEIGHT`, `VALIDITY_REASON_CODES`
- `evaluateConstraintsPlacement`, `evaluateItemPlacement`, `evaluateLayout`
- `solveLayout`
- `createAutoLayoutProposal` — opt-in Auto-Layout enricher (compose with `solveLayout`; does not select/score/validate)

Types (non-exhaustive of type-only aliases re-exported with the values above):

- `Point`, `Rect`, `RectInput`, `Size`
- `ItemId`
- `ContentConstraints`, `ContentConstraintsInput`
- `LayoutItem`, `LayoutItemInput`
- `LayoutSpace`, `LayoutSpaceInput`
- `LayoutIntent`, `LayoutIntentInput`
- `ResolvedLayout`, `ResolvedLayoutInput`
- `LayoutSchemaVersion`
- `ValidityState`
- `ItemPlacementEvaluation`, `LayoutEvaluation`, `ScoreBreakdown`
- `ValidityAxis`, `ValidityReason`, `ValidityReasonCode`, `ValidityReasonKind`
- `SolverCandidateSummary`, `SolverInput`, `SolverResult`, `SolverSelectionCode`, `SolverSelectionReason`, `SolverStrategy`
- `AutoLayoutProposal`, `AutoLayoutProposalInput`, `PlacementOrigin`

Core remains framework-agnostic, renderer-agnostic, and deterministic.

#### Auto-Layout compose (opt-in)

```ts
const proposal = createAutoLayoutProposal({ intent, previous?, automaticItemOrder? });
const result = solveLayout({ intent: proposal.effectiveIntent, previous? });
```

`automaticItemOrder` (optional, DND-4.2) — advisory processing order for automatic items only. When omitted, Stage B/C use declaration order (Phase 3 default). Core normalizes defensively; unknown, duplicate, and source ids are ignored.

Auto-Layout is **opt-in**. Calling `solveLayout` alone is unchanged. Available on published npm `@alpha` (`0.1.0-alpha.1`). Alpha breaking-change policy above is unchanged.

### Internal to Core (not public)

Not exported from the package root, and not supported if reached via dist files:

- Candidate generation / ranking helpers (`generateCandidates`, `compareCandidates`, `packPlacements`, `SOLVER_STRATEGIES`)
- Auto-Layout sizing helpers and `maxProbeCountForOccupancy`
- Numeric assertion helpers (`numbers.ts`)
- Any file under `tests/` or `benchmarks/`

## `@dndgem/dom` public exports

**Typical Vanilla consumer:** `createLayoutSession` plus Core types as needed.

Runtime:

- `DOM_PACKAGE_NAME`, `DOM_PACKAGE_VERSION`, `getDomPackageInfo`
- `DomAdapterError`
- `measureLayout`
- `observeLayout`
- `createDragInteraction`
- `applyLayoutPlacements`, `layoutPlacementStyle`, `prepareLayoutContainer`
- `createLayoutSession` — optional `autoLayout?: boolean` (default off / undefined = explicit-only path)

Types include measurement snapshots, session/interaction state, drag events, and the replaceable `DragMechanicsAdapter` seam.

#### Session Auto-Layout (opt-in, DND-3.4)

`createLayoutSession({ autoLayout?: boolean })` — when `autoLayout: true`:

- `desiredPlacements` may be partial or absent (Source Intent); remaining items are proposed automatically
- `LayoutSessionState.autoLayout` is `{ enabled: true; proposalUnplacedItemIds: readonly string[] }` (Auto-Layout **proposal** completeness only — not solver INVALID, and not “missing from ResolvedLayout”)
- Accepted drag promotes **only** the active item to Source Intent (strong persistent intent — not a pin/lock)

Default / omitted `autoLayout` keeps the existing explicit-only seeding path. Available on published npm `@alpha` (`0.1.0-alpha.1`).

### Advanced / escape-hatch (supported, not the default app API)

- `measureLayout` / `observeLayout` — composing a custom loop instead of `createLayoutSession`
- `createDragInteraction` — composing drag without the session orchestrator
- `DragMechanicsAdapter` and pointer callback types — tests and provider replacement (ADR-0004)
- `ResizeObserverConstructor` injection — tests and environments without global `ResizeObserver`

Application code should prefer `createLayoutSession`. The mechanics seam must not carry `@dnd-kit` types.

### Internal to DOM (not public)

- `dndKitMechanicsAdapter` and `@dnd-kit/dom` types
- `snapshotsEqual`, `readClientBox`, and other measurement internals
- React

## `@dndgem/react` public exports

Runtime:

- `REACT_PACKAGE_NAME`, `REACT_PACKAGE_VERSION`, `getReactPackageInfo`
- `DnDGemProvider`
- `useDnDGem`
- `useDnDGemContainer`
- `useDnDGemItem`

Types:

- `DnDGemItemBinding`, `DnDGemItemConfig`, `DnDGemProviderProps`, `DnDGemStore`
- Re-exported DOM callback types: `DragCancelEvent`, `DragDropResult`, `DragProposal`, `LayoutSessionState`

### Internal to React (not public)

- `DnDGemRegistryContext`, `DnDGemStateContext`, `DnDGemRegistry`
- `createDragInteraction` / `createLayoutSession` (consume via `@dndgem/dom` if needed)
- `@dnd-kit/*`

`DnDGemProvider` accepts optional `autoLayout?: boolean` (default off; mirrors DOM session), plus optional `mechanics` and `ResizeObserver` for tests. Application consumers do not need the test seams. Available on published npm `@alpha` (`0.1.0-alpha.1`).

Hook contract:

- `useDnDGemContainer()` → callback ref for the positioned container
- `useDnDGemItem(id)` → `{ ref, style }` for one item
- `useDnDGem()` → `{ state, ready }`
- All three throw if used outside `DnDGemProvider`

## `@dndgem/vue` public exports

Runtime (published `0.1.0-alpha.3` / `@alpha`):

- `VUE_PACKAGE_NAME`, `VUE_PACKAGE_VERSION`, `getVuePackageInfo`
- `DnDGemProvider` (renderless board owner)
- `useDnDGem`
- `useDnDGemContainer`
- `useDnDGemItem`

Types:

- `DnDGemItemBinding`, `DnDGemItemConfig`, `DnDGemProviderProps`, `DnDGemStore`
- Re-exported DOM callback types: `DragCancelEvent`, `DragDropResult`, `DragProposal`, `LayoutSessionState`

### Internal to Vue (not public)

- `DnDGemRegistryKey`, `DnDGemStateKey`, `DnDGemRegistry`
- `createDragInteraction` / `createLayoutSession` (consume via `@dndgem/dom` if needed)
- `@dnd-kit/*`

Same behavioral contract as React/DOM: `autoLayout?: boolean` default off; callback identity does not recreate the session; wait-for-all registration; client mount only. Peer: `vue@^3.5.0`. Published on `@alpha` as of `0.1.0-alpha.3` (not in `0.1.0-alpha.1`). Nuxt is a validated compatibility environment (no `@dndgem/nuxt`).

Composable contract:

- `useDnDGemContainer()` → function ref for the positioned container
- `useDnDGemItem(id)` → `{ ref, style }` for one item (`style` is a computed)
- `useDnDGem()` → `{ state, ready }` (`shallowRef` / `computed`)
- All three throw if used outside `DnDGemProvider`

## `@dndgem/angular` public exports

Runtime (published `0.1.0-alpha.3` / `@alpha`):

- `ANGULAR_PACKAGE_NAME`, `ANGULAR_PACKAGE_VERSION`, `getAngularPackageInfo`
- `DnDGemBoardDirective` (`[dndgemBoard]`, board-local provider)
- `DnDGemContainerDirective` (`[dndgemContainer]`)
- `DnDGemItemDirective` (`[dndgemItem]`)
- `DnDGemBoard` (injectable; `state` / `ready` signals)
- `injectDnDGem`
- `DNDGEM_BOARD_IMPORTS`

Types:

- `DnDGemItemConfig`, `DnDGemBoardConfig`, `DnDGemBoardCallbacks`
- Re-exported DOM callback types: `DragCancelEvent`, `DragDropResult`, `DragProposal`, `LayoutSessionState`

### Internal to Angular (not public)

- Board registration maps / session fields
- `createDragInteraction` / `createLayoutSession` (consume via `@dndgem/dom` if needed)
- `@dnd-kit/*`

Same behavioral contract as React/DOM/Vue: `autoLayout` default off; output/callback identity does not recreate the session; wait-for-all registration; client mount only. Peer: `@angular/core@^20.0.0 || ^21.0.0 || ^22.0.0`. Published on `@alpha` as of `0.1.0-alpha.3` (not in `0.1.0-alpha.1`). Angular Universal is not validated.

Directive contract:

- `dndgemBoard` + `dndgemContainer` on consumer hosts (may share one element)
- `dndgemItem="id"` registers that host as the Core item id
- `injectDnDGem()` / `DnDGemBoard` throw or fail DI outside `dndgemBoard`
- `state` / `ready` are Angular signals

## `@dndgem/svelte` public exports

Runtime (published `0.1.0-alpha.3` / `@alpha`):

- `SVELTE_PACKAGE_NAME`, `SVELTE_PACKAGE_VERSION`, `getSveltePackageInfo`
- `DnDGemProvider` (renderless board owner)
- `getDnDGem`
- `dndgemContainer`
- `dndgemItem`

Types:

- `DnDGemItemConfig`, `DnDGemProviderProps`, `DnDGemSnippetProps`, `DnDGemStore`
- Re-exported DOM callback types: `DragCancelEvent`, `DragDropResult`, `DragProposal`, `LayoutSessionState`

### Internal to Svelte (not public)

- Board context key / session fields
- `createDragInteraction` / `createLayoutSession` (consume via `@dndgem/dom` if needed)
- `@dnd-kit/*`

Same behavioral contract as React/DOM/Vue/Angular: `autoLayout` default off; callback identity does not recreate the session; wait-for-all registration; client mount only. Peer: `svelte@^5.0.0`. Published on `@alpha` as of `0.1.0-alpha.3` (not in `0.1.0-alpha.1`). SvelteKit is a validated compatibility environment (no `@dndgem/sveltekit`).

Action / snippet contract:

- Children snippet receives `{ state, ready, dndgemContainer, dndgemItem }` (`state` / `ready` are values)
- `use:dndgemContainer` / `use:dndgemItem={'id'}` register consumer hosts
- `getDnDGem()` throws outside `DnDGemProvider`
- `getDnDGem().state` / `ready` are Svelte readable stores

## Provider isolation

`@dnd-kit/dom` is installed only on `@dndgem/dom` as an implementation dependency. It must not appear in:

- `@dndgem/core` public types or dependencies
- `@dndgem/react` public types, dependencies, or imports
- `@dndgem/vue` public types, dependencies, or imports
- `@dndgem/angular` public types, dependencies, or imports
- `@dndgem/svelte` public types, dependencies, or imports

Consumers must not import `@dnd-kit/*` to use DnDGem.

## Errors

| Error             | Package | Meaning                                         |
| ----------------- | ------- | ----------------------------------------------- |
| `DomainError`     | core    | Malformed domain input / illegal construction   |
| `ValidityState`   | core    | Evaluated layout quality, not an exception      |
| `DomAdapterError` | dom     | Missing elements, disposed session, environment |
| React `Error`     | react   | Hook used outside `DnDGemProvider`              |
| Vue `Error`       | vue     | Composable used outside `DnDGemProvider`        |
| Angular `Error`   | angular | Directive/inject used outside `dndgemBoard`     |
| Svelte `Error`    | svelte  | Action/getDnDGem used outside `DnDGemProvider`  |

Alpha documents errors and validity honestly. Developer guides and troubleshooting live in `docs/guides/` (DND-2.3).

## Versioning

Published package versions are **`0.1.0-alpha.3`**. Changesets owns further prereleases. Do not hand-edit `packages/*/package.json` versions.

- Official dist-tag: `alpha` (always install with `@alpha`; `latest` is not the Alpha channel)
- `@dndgem/core`, `@dndgem/dom`, `@dndgem/react`, `@dndgem/vue`, `@dndgem/angular`, and `@dndgem/svelte` are a **fixed** Changesets group and stay version-aligned
- `get*PackageInfo().version` must match that package's `package.json` `version`

See [release-strategy.md](./release-strategy.md).
