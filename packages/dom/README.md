# `@dndgem/dom`

DOM adapter for **DnDGem** by **FinGem-AI**.

This package measures DOM geometry, observes resize, converts pointer drag into `LayoutIntent` proposals, and orchestrates Vanilla layout sessions. `@dnd-kit/dom` is an internal provider and is not part of the public API.

Typical Vanilla entry: `createLayoutSession`.

Alpha public contract: `docs/architecture/alpha-api-contract.md` in the DnDGem repository.

Packages are **not published to npm yet**. Consume from the DnDGem workspace until the Public Alpha release gate (DND-2.5).

```ts
import { createLayoutSession } from '@dndgem/dom';
```

License: MIT.
