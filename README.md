# DnDGem

**DnDGem** by **FinGem-AI**

> Drag. Resize. Adapt. Without breaking your content.

Category: **Content-Aware Adaptive Layout Engine**

## Project status

DnDGem’s **Technical MVP (Phase 1)** is **CLOSED** (DND-1.1 → DND-1.8).

That means the repository contains reproducible evidence for content-aware constraints, deterministic validity/scoring, adaptive solve/reflow, DOM measurement/resize, provider-isolated drag, and Vanilla/React integration — within a documented dashboard-scale operating envelope.

This is **not** a production-ready, fully accessible, publicly released, or commercially packaged product.

| Area                              | Status                                                          |
| --------------------------------- | --------------------------------------------------------------- |
| Monorepo / tooling                | Implemented (DND-1.1)                                           |
| Package shells (`core/dom/react`) | Implemented (DND-1.1)                                           |
| Core domain / constraints         | Implemented (DND-1.2)                                           |
| Validity engine / scoring         | Implemented (DND-1.3)                                           |
| Adaptive solver / reflow          | Implemented (DND-1.4)                                           |
| DOM measurement / resize          | Implemented (DND-1.5)                                           |
| Drag & drop interaction           | Implemented (DND-1.6; `@dnd-kit/dom` internal to `@dndgem/dom`) |
| React / vanilla integrations      | Implemented (DND-1.7)                                           |
| Technical proof / benchmarks      | Implemented (DND-1.8)                                           |
| AI                                | Out of Phase 1 critical path                                    |
| Flutter / other frameworks        | Compatibility principle only; not implemented                   |

Closure artifacts: `docs/technical-mvp/closure-report.md`, `docs/technical-mvp/acceptance-matrix.md`, `docs/benchmarks/technical-mvp-baseline.md`.

## What the Technical MVP proves

```text
content constraints
  → LayoutIntent
  → validity + scoring
  → deterministic adaptive solver
  → ResolvedLayout
  → DOM measurement / resize
  → drag proposal → solver reflow
  → accept / reject / cancel
  → Vanilla + React (same Core semantics)
```

## Product thesis

DnDGem provides framework-agnostic adaptive layouts for draggable interfaces by combining:

```text
Content Constraints
+ Layout Validity
+ Deterministic Adaptive Solver
+ Responsive Reflow
```

Constraint domain types, validity evaluation, and the adaptive solver live in Core. `@dndgem/dom` normalizes browser geometry, converts drag mechanics into `LayoutIntent` proposals, and applies resolved geometry. `@dndgem/react` is a thin lifecycle adapter over the DOM session.

## Architecture overview

```text
@dndgem/core          renderer-agnostic domain, validity, scoring, solver
     ▲
@dndgem/dom           DOM measurement, resize, drag interaction, layout session
     ▲
@dndgem/react         React adapter (peerDependency: react)
```

Vanilla apps depend on `@dndgem/dom` (and `@dndgem/core` types as needed). React apps depend on `@dndgem/react`.

Details: `docs/architecture/overview.md`, `docs/architecture/core-domain.md`, and `docs/adr/`.

## Usage (workspace)

Packages are **not published** to npm yet. Consume them from this workspace.

Vanilla:

```ts
import { createLayoutSession } from '@dndgem/dom';

const session = createLayoutSession({
  container,
  items: [
    {
      id: 'chart',
      element: chartEl,
      constraints: { minWidth: 120, preferredWidth: 240 },
    },
  ],
  desiredPlacements: { chart: { x: 12, y: 12, width: 240, height: 96 } },
});

session.dispose();
```

React:

```tsx
import { DnDGemProvider, useDnDGemContainer, useDnDGemItem } from '@dndgem/react';

function Board() {
  const containerRef = useDnDGemContainer();
  const chart = useDnDGemItem('chart');
  return (
    <div ref={containerRef}>
      <article ref={chart.ref} style={chart.style}>
        Chart
      </article>
    </div>
  );
}
```

The container should be a positioned containing block. Items are absolutely positioned from the resolved layout (`left` / `top` / `width` / `height`, `box-sizing: border-box`). Merge layout style after consumer visual styles so DnDGem wins those properties: `style={{ color: '…', ...chart.style }}`. Visual design may also live in CSS classes.

`session.dispose()` / unmount does not restore pre-session layout inline styles.

Importing `@dndgem/react` is safe without `window`. Rendering the provider is client-side only (not a full SSR/hydration path). Pointer drag is the validated interaction path; keyboard drag is not product-validated.

## Phase 1 roadmap

`DND-1.1` → `DND-1.8` — see `docs/roadmap.md`.

## Development setup

Requirements: Node.js 20+, pnpm 10.

```bash
pnpm install
pnpm build
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm check:boundaries
pnpm bench
pnpm dev
```

Browser smoke (Playwright, Chromium):

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

Examples:

```bash
pnpm --filter @dndgem/example-react dev
pnpm --filter @dndgem/example-vanilla dev
```

### Technical MVP evidence reproduction

```bash
pnpm install
pnpm test
pnpm test:e2e
pnpm bench
```

## Current limitations (honest)

- Dashboard-scale solver envelope (measured through tens of items); not claimed for huge item counts
- Chromium e2e focus
- Pointer DnD validated; keyboard product path deferred
- Absolute positioning apply path
- No public npm release yet

## Planned install (not published yet)

```bash
# planned — not yet published
npm install @dndgem/react
```

Until then, consume packages via this workspace.

## npm scope note

Target scope `@dndgem` is pending external org/availability confirmation. Package names remain `@dndgem/*` in-repo.

## License

MIT — see `LICENSE`.

## Contributing

See `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`. Security reports: `SECURITY.md`.
