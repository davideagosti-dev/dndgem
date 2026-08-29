# Packages

```text
@dndgem/core
      ▲
@dndgem/dom
      ▲
@dndgem/react   ·   @dndgem/vue   ·   @dndgem/angular   ·   @dndgem/svelte
```

| Package           | Install when you need…                                  |
| ----------------- | ------------------------------------------------------- |
| `@dndgem/core`    | Headless solving / evaluation without a browser runtime |
| `@dndgem/dom`     | Vanilla browser integration (`createLayoutSession`)     |
| `@dndgem/react`   | React apps (`DnDGemProvider` + hooks)                   |
| `@dndgem/vue`     | Vue 3 apps (`DnDGemProvider` + composables)             |
| `@dndgem/angular` | Angular apps (board directive + signals)                |
| `@dndgem/svelte`  | Svelte 5 apps (provider + actions)                      |

## Selection guide

- **React app** → depend on `@dndgem/react` (it depends on `dom` and `core`).
- **Vue 3 app** → depend on `@dndgem/vue` (`vue@^3.5` peer).
- **Angular app** → depend on `@dndgem/angular` (`@angular/core@^20 \|\| ^21 \|\| ^22` peer).
- **Svelte 5 app** → depend on `@dndgem/svelte` (`svelte@^5` peer).
- **Vanilla / no framework adapter** → depend on `@dndgem/dom` (and `@dndgem/core` if you import Core types/helpers directly).
- **Next.js App Router** → `@dndgem/react` with `'use client'` on the board root. No `@dndgem/next`.
- **Nuxt** → `@dndgem/vue`. No `@dndgem/nuxt`.
- **SvelteKit** → `@dndgem/svelte`. No `@dndgem/sveltekit`.
- **Custom headless tooling** → `@dndgem/core` alone (`solveLayout`, `evaluateLayout`, constraint factories).

Do not import `@dnd-kit/*` to use DnDGem. The drag provider is internal to `@dndgem/dom`.

## Module contract

- ESM-only (`import` from the package root)
- No deep imports (`@dndgem/core/src/...`) — not supported
- Node `>=20` for tooling / ESM import of published packages
- Types via each package’s `exports["."].types`

Authoritative list: [Alpha API Contract](../architecture/alpha-api-contract.md).

## Recommended vs advanced

| Layer   | Recommended public path                    | Advanced (supported escape hatches)                                      |
| ------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| React   | `DnDGemProvider`, `useDnDGem*`             | Optional `mechanics` / `ResizeObserver` injection for tests              |
| Vue     | `DnDGemProvider`, `useDnDGem*`             | Same test seams                                                          |
| Angular | `dndgemBoard` + item/container             | Same test seams                                                          |
| Svelte  | `DnDGemProvider` + actions                 | Same test seams                                                          |
| DOM     | `createLayoutSession`                      | `measureLayout`, `observeLayout`, `createDragInteraction`, apply helpers |
| Core    | `solveLayout`, constraint/intent factories | Direct `evaluateLayout` for tooling / fixtures                           |

## Installation truth

```bash
npm install @dndgem/react@alpha
npm install @dndgem/vue@alpha
npm install @dndgem/angular@alpha
npm install @dndgem/svelte@alpha
npm install @dndgem/dom@alpha
```

Published version: `0.1.0-alpha.3`. Always use dist-tag **`alpha`**. Do not rely on bare `npm install @dndgem/*` (`latest` still points at historical `0.1.0-alpha.0` and is not a stable channel).

## Private workspace packages (not install targets)

| Package                       | Role                                                              |
| ----------------------------- | ----------------------------------------------------------------- |
| `@dndgem/intelligence`        | Private reference — deterministic planner + orchestration helpers |
| `@dndgem/intelligence-openai` | Private experimental reference — model assistance **deferred**    |

Do **not** document these as `npm install` targets. Public planners use the DOM structural contract — see [Advisory Planner](./advisory-planner.md).
