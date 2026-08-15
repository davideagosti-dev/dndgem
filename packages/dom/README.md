# `@dndgem/dom`

DOM adapter for **DnDGem** by **FinGem-AI**.

This package measures DOM geometry, observes resize, converts pointer drag into `LayoutIntent` proposals, and orchestrates Vanilla layout sessions. `@dnd-kit/dom` is an internal provider and is not part of the public API.

## Start here

- Website: https://dndgem.dev
- Quick Start: https://dndgem.dev/docs/quick-start/
- Support: https://dndgem.dev/support/
- Recommended path: `createLayoutSession`

Public Alpha version: **`0.1.0-alpha.0`** (official npm dist-tag **`alpha`**).

```bash
npm install @dndgem/dom@alpha
```

Always use `@alpha`. Feedback: `support@fingem-ai.com`. Playground: https://playground.dndgem.dev/ (provider: https://dndgem-playground.pages.dev/).

```ts
import { createLayoutSession } from '@dndgem/dom';
```

Advanced escape hatches (`measureLayout`, `observeLayout`, `createDragInteraction`, …) are documented as advanced — prefer the session for ordinary apps.

License: MIT.
