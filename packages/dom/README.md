# `@dndgem/dom`

DOM adapter for **DnDGem** by **FinGem-AI**.

This package measures DOM geometry, observes resize, converts pointer drag into `LayoutIntent` proposals, and orchestrates Vanilla layout sessions. `@dnd-kit/dom` is an internal provider and is not part of the public API.

## Start here

- Recommended path: `createLayoutSession`
- Guide: repository `docs/guides/vanilla.md`
- Alpha contract: `docs/architecture/alpha-api-contract.md`

Packages are **not published to npm yet**. Consume from the DnDGem workspace until the Public Alpha release gate (DND-2.5).

```ts
import { createLayoutSession } from '@dndgem/dom';
```

Advanced escape hatches (`measureLayout`, `observeLayout`, `createDragInteraction`, …) are documented as advanced — prefer the session for ordinary apps.

Validated example: `examples/vanilla`.

License: MIT.
