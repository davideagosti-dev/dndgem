# Packages

```text
@dndgem/core
      ▲
@dndgem/dom
      ▲
@dndgem/react
```

| Package         | Install when you need…                                  |
| --------------- | ------------------------------------------------------- |
| `@dndgem/core`  | Headless solving / evaluation without a browser runtime |
| `@dndgem/dom`   | Vanilla browser integration (`createLayoutSession`)     |
| `@dndgem/react` | React apps (`DnDGemProvider` + hooks)                   |

## Selection guide

- **React app** → depend on `@dndgem/react` (it depends on `dom` and `core`).
- **Vanilla / no React** → depend on `@dndgem/dom` (and `@dndgem/core` if you import Core types/helpers directly).
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
| DOM   | `createLayoutSession`                      | `measureLayout`, `observeLayout`, `createDragInteraction`, apply helpers |
| Core  | `solveLayout`, constraint/intent factories | Direct `evaluateLayout` for tooling / fixtures                           |

## Installation truth

Packages are **not published** to public npm during DND-2.3.

```bash
# After DND-2.5 Public Alpha — not available today
npm install @dndgem/react@alpha
```

Local validation of packed consumers: `pnpm test:pack`.
