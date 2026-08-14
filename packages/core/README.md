# `@dndgem/core`

Renderer-agnostic core of **DnDGem** by **FinGem-AI**.

This package owns the domain model, content constraints, validity evaluation, scoring, and the deterministic adaptive solver. It does not import DOM, React, or drag-provider types.

## Start here

- Guides: repository `docs/guides/` (Quick Start, Core Concepts, Constraints)
- Alpha contract: `docs/architecture/alpha-api-contract.md`

Public Alpha version: **`0.1.0-alpha.0`** (npm dist-tag `alpha`).

```bash
npm install @dndgem/core@alpha
```

Feedback: `support@fingem-ai.com`. Playground: https://dndgem-playground.pages.dev/

```ts
import { createLayoutIntent, evaluateItemPlacement, solveLayout } from '@dndgem/core';
```

Typical apps use `@dndgem/react` or `@dndgem/dom` rather than calling `solveLayout` directly.

License: MIT.
