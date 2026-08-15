# `@dndgem/core`

Renderer-agnostic core of **DnDGem** by **FinGem-AI**.

This package owns the domain model, content constraints, validity evaluation, scoring, and the deterministic adaptive solver. It does not import DOM, React, or drag-provider types.

## Start here

- Website: https://dndgem.dev
- Quick Start: https://dndgem.dev/docs/quick-start/
- Support: https://dndgem.dev/support/

Public Alpha version: **`0.1.0-alpha.0`** (official npm dist-tag **`alpha`**).

```bash
npm install @dndgem/core@alpha
```

Always use `@alpha`. Feedback: `support@fingem-ai.com`. Playground: https://playground.dndgem.dev/ (provider: https://dndgem-playground.pages.dev/).

```ts
import { createLayoutIntent, evaluateItemPlacement, solveLayout } from '@dndgem/core';
```

Typical apps use `@dndgem/react` or `@dndgem/dom` rather than calling `solveLayout` directly.

License: MIT.
