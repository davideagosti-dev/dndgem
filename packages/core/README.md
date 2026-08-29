# `@dndgem/core`

Renderer-agnostic core of **DnDGem** by **DA62**.

This package owns the domain model, content constraints, validity evaluation, scoring, and the deterministic adaptive solver. It does not import DOM, React, or drag-provider types.

## Start here

- Website: https://dndgem.dev
- Quick Start: https://dndgem.dev/docs/quick-start/
- Support: https://dndgem.dev/support/

Prepared source version: **`0.1.0-alpha.4`**. Current npm `@alpha`: **`0.1.0-alpha.3`** until publication.

```bash
npm install @dndgem/core@alpha
```

Always use `@alpha`. Feedback: `support@dndgem.dev`. Playground: https://playground.dndgem.dev/ (provider: https://dndgem-playground.pages.dev/).

```ts
import {
  createAutoLayoutProposal,
  createLayoutIntent,
  evaluateItemPlacement,
  solveLayout,
} from '@dndgem/core';
```

Typical apps use `@dndgem/react` or `@dndgem/dom` rather than calling `solveLayout` directly.

License: MIT.
