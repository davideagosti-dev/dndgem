# Alpha API Contract

Authoritative public contract for the first DnDGem Alpha.

This document defines what external consumers may rely on. It is **not** a v1 stability promise. Public Alpha publication itself remains the DND-2.5 gate; DND-2.2 prepares the contract and release mechanics only.

Related: [overview.md](./overview.md), [core-domain.md](./core-domain.md), [dom-adapter.md](./dom-adapter.md), [package-boundaries.md](./package-boundaries.md), [release-strategy.md](./release-strategy.md).

## Identity

- Brand: FinGem-AI
- Product: DnDGem
- Category: Content-Aware Adaptive Layout Engine
- Distinction: geometrically fits ≠ content remains useful

## Supported packages

| Package         | Role                                                                 | Typical consumer      |
| --------------- | -------------------------------------------------------------------- | --------------------- |
| `@dndgem/core`  | Domain, constraints, validity, scoring, deterministic `solveLayout`  | Headless / all layers |
| `@dndgem/dom`   | Measurement, resize, drag interaction, Vanilla `createLayoutSession` | Vanilla DOM apps      |
| `@dndgem/react` | Thin React lifecycle adapter over the DOM session                    | React apps            |

No other `@dndgem/*` packages are part of Alpha. Vue, Angular, Svelte, and Flutter adapters are out of scope.

## Public entrypoints

Each package is **ESM-only**. The only supported import path is the package root:

```ts
import { solveLayout } from '@dndgem/core';
import { createLayoutSession } from '@dndgem/dom';
import { DnDGemProvider } from '@dndgem/react';
```

Deep imports (`@dndgem/core/solve`, `@dndgem/dom/src/...`, `@dndgem/react/dist/...`) are **not** part of the contract even if a file exists in the published tarball.

Module shape:

- `"type": "module"`
- `exports["."].import` → `./dist/index.js`
- `exports["."].types` → `./dist/index.d.ts`
- No CommonJS `require` export

## Environment assumptions

| Area            | Alpha statement                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| Node            | `>=20` for tooling and ESM import of published packages                                                     |
| Bundlers        | Vite / modern bundlers with ESM are the expected app path                                                   |
| Browser         | Chromium / Firefox / WebKit desktop engines **SUPPORTED FOR ALPHA** (Playwright). Mobile **NOT VALIDATED**. |
| DOM             | `@dndgem/dom` and React rendering require a browser-like DOM at runtime                                     |
| Pointer drag    | Validated interaction path                                                                                  |
| Keyboard drag   | **DEFERRED** — not a product-validated path                                                                 |
| Accessibility   | Baseline: Escape cancel + focus/ARIA preservation; no full WCAG / SR drag claim — see a11y guide            |
| SSR / hydration | Module import is safe without `window`. Full SSR/hydration is **not** claimed                               |
| Next.js / Remix | Not validated. Do not market as supported                                                                   |
| React           | Peer `react@^18 \|\| ^19`. Client mount required for `DnDGemProvider`                                       |
| Positioning     | Container is a positioned containing block; items are absolutely positioned from resolved geometry          |

Repository metadata URLs point at `https://github.com/davideagosti-dev/dndgem`. The GitHub repository is currently **PRIVATE**; those links are canonical, not a claim of public accessibility. Public visibility is a separate DND-2.5 decision.

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

Core remains framework-agnostic, renderer-agnostic, and deterministic.

### Internal to Core (not public)

Not exported from the package root, and not supported if reached via dist files:

- Candidate generation / ranking helpers (`generateCandidates`, `compareCandidates`, `packPlacements`, `SOLVER_STRATEGIES`)
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
- `createLayoutSession`

Types include measurement snapshots, session/interaction state, drag events, and the replaceable `DragMechanicsAdapter` seam.

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

`DnDGemProvider` accepts optional `mechanics` and `ResizeObserver` for tests. Application consumers do not need them.

Hook contract:

- `useDnDGemContainer()` → callback ref for the positioned container
- `useDnDGemItem(id)` → `{ ref, style }` for one item
- `useDnDGem()` → `{ state, ready }`
- All three throw if used outside `DnDGemProvider`

## Provider isolation

`@dnd-kit/dom` is installed only on `@dndgem/dom` as an implementation dependency. It must not appear in:

- `@dndgem/core` public types or dependencies
- `@dndgem/react` public types, dependencies, or imports

Consumers must not import `@dnd-kit/*` to use DnDGem.

## Errors

| Error             | Package | Meaning                                         |
| ----------------- | ------- | ----------------------------------------------- |
| `DomainError`     | core    | Malformed domain input / illegal construction   |
| `ValidityState`   | core    | Evaluated layout quality, not an exception      |
| `DomAdapterError` | dom     | Missing elements, disposed session, environment |
| React `Error`     | react   | Hook used outside `DnDGemProvider`              |

Alpha documents errors and validity honestly. Developer guides and troubleshooting live in `docs/guides/` (DND-2.3).

## Versioning

In-repo package versions remain `0.0.0` until Changesets generates the first prerelease at the publish gate.

- First intended publish version: `0.1.0-alpha.0`
- Official dist-tag: `alpha` (always install with `@alpha`; `latest` is not the Alpha channel)
- `@dndgem/core`, `@dndgem/dom`, and `@dndgem/react` are a **fixed** Changesets group and stay version-aligned
- `get*PackageInfo().version` must match that package's `package.json` `version`

See [release-strategy.md](./release-strategy.md).
