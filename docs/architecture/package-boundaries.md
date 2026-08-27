# Package Boundaries

## Allowed dependencies

JS/DOM topology (DND-FX.1 / [ADR-0016](../adr/ADR-0016-framework-package-topology.md)):

```text
@dndgem/core ← @dndgem/intelligence (private, optional — DND-4.2)
@dndgem/core ← @dndgem/dom ← sibling adapters (react, vue, angular, svelte)
```

| Package                | May depend on                                                                                  | Must not depend on                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `@dndgem/core`         | nothing DnDGem-specific / no DOM                                                               | `dom`, adapters, intelligence, browser APIs, UI frameworks, dnd-kit, AI |
| `@dndgem/intelligence` | `@dndgem/core` only (private workspace package; not published in DND-4.2)                      | `dom`, adapters, UI frameworks, dnd-kit, AI                             |
| `@dndgem/dom`          | `@dndgem/core`; browser/DOM APIs; `@dnd-kit/dom` (internal)                                    | adapters, intelligence, React/Vue/Angular/Svelte                        |
| JS/DOM adapter         | `@dndgem/dom`; `@dndgem/core` when public types require it; UI framework as **peerDependency** | other adapters; intelligence; `@dnd-kit/*`                              |

Current adapters: `@dndgem/react`, `@dndgem/vue`, `@dndgem/angular`, and `@dndgem/svelte` are **published** on `@alpha` (`0.1.0-alpha.3`).

Meta-framework fixtures (`apps/compat-next`, `apps/compat-nuxt`, `apps/compat-sveltekit`) are private unpublished apps, not `packages/` adapters.

Forbidden package names: `@dndgem/framework-core`, `@dndgem/vanilla`, `@dndgem/next`, `@dndgem/nuxt`, `@dndgem/sveltekit`, `@dndgem/flutter`, `@dndgem/ai`.

`@dndgem/intelligence` exists as a **private** optional workspace layer (DND-4.2 Stage B). It is not published, not part of the Alpha public surface, and not depended on by `@dndgem/dom` or framework adapters in this sprint. Public API review belongs to DND-4.3 / DND-4.5. Preferred direction: optional intelligence layer depending on Core ([ADR-0018](../adr/ADR-0018-layout-intelligence-boundary.md)); not inside `@dndgem/core` by default. Framework adapters must not become intelligence extension points.

Allowlist: `scripts/package-topology.mjs`.

## Public API rule

Alpha consumers may import only the package root (see [alpha-api-contract.md](./alpha-api-contract.md)). Cross-package and app/example imports must use package names:

```ts
import { getCorePackageInfo } from '@dndgem/core';
```

Forbidden:

```ts
import { ... } from '../../packages/core/src/...';
import { ... } from '@dndgem/core/src/internal/...';
```

## Enforcement

1. `package.json` dependency declarations
2. ESLint `no-restricted-imports` for core/dom/adapters/consumers
3. `pnpm check:boundaries` script

DOM measurement, `ResizeObserver`, and drag interaction belong in `@dndgem/dom`. They must not leak `HTMLElement` / `DOMRect` / dnd-kit types into Core public contracts.

## Interaction provider

- Provider: `@dnd-kit/dom` (internal to `@dndgem/dom`, DND-1.6)
- Public API: `createDragInteraction` and `createLayoutSession` (ADR-0004 / ADR-0012 / ADR-0013)
- Must remain behind DnDGem’s interaction abstraction; never imported from Core or framework adapters
