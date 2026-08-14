# `@dndgem/core`

Renderer-agnostic core of **DnDGem** by **FinGem-AI**.

This package owns the domain model, content constraints, validity evaluation, scoring, and the deterministic adaptive solver. It does not import DOM, React, or drag-provider types.

Alpha public contract: `docs/architecture/alpha-api-contract.md` in the DnDGem repository.

Packages are **not published to npm yet**. Consume from the DnDGem workspace until the Public Alpha release gate (DND-2.5).

```ts
import { createLayoutIntent, solveLayout } from '@dndgem/core';
```

License: MIT.
