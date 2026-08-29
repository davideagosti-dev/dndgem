# `@dndgem/dom`

DOM adapter for **DnDGem** by **DA62**.

This package measures DOM geometry, observes resize, converts pointer drag into `LayoutIntent` proposals, and orchestrates Vanilla layout sessions. `@dnd-kit/dom` is an internal provider and is not part of the public API.

## Start here

- Website: https://dndgem.dev
- Quick Start: https://dndgem.dev/docs/quick-start/
- Support: https://dndgem.dev/support/
- Recommended path: `createLayoutSession`

Prepared source version: **`0.1.0-alpha.4`**. Current npm `@alpha`: **`0.1.0-alpha.3`** until publication.

```bash
npm install @dndgem/dom@alpha
```

Always use `@alpha`. Feedback: `support@dndgem.dev`. Playground: https://playground.dndgem.dev/ (provider: https://dndgem-playground.pages.dev/).

```ts
import { createLayoutSession } from '@dndgem/dom';
```

Advanced escape hatches (`measureLayout`, `observeLayout`, `createDragInteraction`, …) are documented as advanced — prefer the session for ordinary apps.

License: MIT.
