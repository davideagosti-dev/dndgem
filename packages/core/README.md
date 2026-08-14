# `@dndgem/core`

Renderer-agnostic core of **DnDGem** by **FinGem-AI**.

This package owns the domain model, content constraints, validity evaluation, scoring, and the deterministic adaptive solver. It does not import DOM, React, or drag-provider types.

## Start here

- Guides: repository `docs/guides/` (Quick Start, Core Concepts, Constraints)
- Alpha contract: `docs/architecture/alpha-api-contract.md`

Public Alpha target: `0.1.0-alpha.0` under npm dist-tag `alpha` (DND-2.5 Stage B). Until published, consume from the DnDGem workspace or packed tarballs.

```ts
import { createLayoutIntent, evaluateItemPlacement, solveLayout } from '@dndgem/core';
```

Typical apps use `@dndgem/react` or `@dndgem/dom` rather than calling `solveLayout` directly.

License: MIT.
