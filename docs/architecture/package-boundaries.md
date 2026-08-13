# Package Boundaries

## Allowed dependencies

| Package         | May depend on                    | Must not depend on                                    |
| --------------- | -------------------------------- | ----------------------------------------------------- |
| `@dndgem/core`  | nothing DnDGem-specific / no DOM | `dom`, `react`, browser APIs, React, dnd-kit, AI SDKs |
| `@dndgem/dom`   | `@dndgem/core`; browser/DOM APIs | `@dndgem/react`, React, dnd-kit                       |
| `@dndgem/react` | `@dndgem/core`, `@dndgem/dom`    | reverse imports; must keep React as peerDependency    |

## Public API rule

Cross-package and app/example imports must use package names:

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
2. ESLint `no-restricted-imports` for core/dom/consumers
3. `pnpm check:boundaries` script

DOM measurement and `ResizeObserver` belong in `@dndgem/dom` (DND-1.5). They must not leak `HTMLElement` / `DOMRect` into Core public contracts.

## Planned interaction provider

- Provider: `@dnd-kit/dom`
- Status: deferred to DND-1.6
- Must remain behind DnDGem’s interaction abstraction (ADR-0004 / ADR-0005)
