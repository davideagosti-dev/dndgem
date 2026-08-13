# Package Boundaries

## Allowed dependencies

| Package         | May depend on                                               | Must not depend on                                          |
| --------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| `@dndgem/core`  | nothing DnDGem-specific / no DOM                            | `dom`, `react`, browser APIs, React, dnd-kit, AI SDKs       |
| `@dndgem/dom`   | `@dndgem/core`; browser/DOM APIs; `@dnd-kit/dom` (internal) | `@dndgem/react`, React                                      |
| `@dndgem/react` | `@dndgem/core`, `@dndgem/dom`; React as peerDependency      | reverse imports; dnd-kit; must keep React as peerDependency |

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

DOM measurement, `ResizeObserver`, and drag interaction belong in `@dndgem/dom`. They must not leak `HTMLElement` / `DOMRect` / dnd-kit types into Core public contracts.

## Interaction provider

- Provider: `@dnd-kit/dom` (internal to `@dndgem/dom`, DND-1.6)
- Public API: `createDragInteraction` and `createLayoutSession` (ADR-0004 / ADR-0012 / ADR-0013)
- Must remain behind DnDGem’s interaction abstraction; never imported from Core or `@dndgem/react`
