# Packages

```text
@dndgem/core
      ▲
@dndgem/dom
      ▲
@dndgem/react   ·   @dndgem/vue (in-repo, unpublished)
```

| Package         | Install when you need…                                                       |
| --------------- | ---------------------------------------------------------------------------- |
| `@dndgem/core`  | Headless solving / evaluation without a browser runtime                      |
| `@dndgem/dom`   | Vanilla browser integration (`createLayoutSession`)                          |
| `@dndgem/react` | React apps (`DnDGemProvider` + hooks)                                        |
| `@dndgem/vue`   | Vue 3 apps (`DnDGemProvider` + composables) — **workspace only, not on npm** |

## Selection guide

- **React app** → depend on `@dndgem/react` (it depends on `dom` and `core`).
- **Vue 3 app** → depend on workspace `@dndgem/vue` until DND-FX.6 publishes it (`vue@^3.5` peer).
- **Vanilla / no framework adapter** → depend on `@dndgem/dom` (and `@dndgem/core` if you import Core types/helpers directly).
- **Custom headless tooling** → `@dndgem/core` alone (`solveLayout`, `evaluateLayout`, constraint factories).

Do not import `@dnd-kit/*` to use DnDGem. The drag provider is internal to `@dndgem/dom`.

## Module contract

- ESM-only (`import` from the package root)
- No deep imports (`@dndgem/core/src/...`) — not supported
- Node `>=20` for tooling / ESM import of published packages
- Types via each package’s `exports["."].types`

Authoritative list: [Alpha API Contract](../architecture/alpha-api-contract.md).

## Recommended vs advanced

| Layer | Recommended public path                    | Advanced (supported escape hatches)                                      |
| ----- | ------------------------------------------ | ------------------------------------------------------------------------ |
| React | `DnDGemProvider`, `useDnDGem*`             | Optional `mechanics` / `ResizeObserver` injection for tests              |
| Vue   | `DnDGemProvider`, `useDnDGem*` (in-repo)   | Same test seams; not published yet                                       |
| DOM   | `createLayoutSession`                      | `measureLayout`, `observeLayout`, `createDragInteraction`, apply helpers |
| Core  | `solveLayout`, constraint/intent factories | Direct `evaluateLayout` for tooling / fixtures                           |

## Installation truth

```bash
npm install @dndgem/react@alpha
```

Published version: `0.1.0-alpha.1`. Always use dist-tag **`alpha`**. Do not rely on bare `npm install @dndgem/*` (`latest` still points at historical `0.1.0-alpha.0` and is not a stable channel).
