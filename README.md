# DnDGem

**DnDGem** by **FinGem-AI**

> Drag. Resize. Adapt. Without breaking your content.

Category: **Content-Aware Adaptive Layout Engine**

## What it is

DnDGem lays out draggable dashboard-style content using **content-aware constraints**, **deterministic solving**, and **adaptive reflow** — so a layout that geometrically fits can still be classified as less useful when content needs are missed.

```text
GEOMETRICALLY FITS  ≠  CONTENT REMAINS USEFUL
```

It is **not** merely a grid library, a drag-and-drop wrapper, a React-only library, or a dnd-kit abstraction. React is a thin adapter; Core stays framework-agnostic.

## Project status

| Phase                          | Status                                                             |
| ------------------------------ | ------------------------------------------------------------------ |
| Phase 1 Technical MVP          | **CLOSED** (DND-1.1 → DND-1.8)                                     |
| Phase 2 Public Alpha Readiness | **ACTIVE** — DND-2.5 Public Alpha Release Gate (Stage A readiness) |

First intended npm version: **`0.1.0-alpha.0`** under dist-tag **`alpha`**. Publication is Stage B after promotion to `master` and external npm gates. Draft notes: [0.1.0-alpha.0](docs/releases/0.1.0-alpha.0.md).

## Packages

```text
@dndgem/core          renderer-agnostic domain, validity, scoring, solver
     ▲
@dndgem/dom           DOM measurement, resize, drag, layout session
     ▲
@dndgem/react         React adapter (peerDependency: react)
```

| Need                        | Package         |
| --------------------------- | --------------- |
| Headless solve / evaluate   | `@dndgem/core`  |
| Vanilla browser integration | `@dndgem/dom`   |
| React integration           | `@dndgem/react` |

## Installation

### After Public Alpha publication

```bash
# React (pulls @dndgem/dom + @dndgem/core)
npm install @dndgem/react@alpha

# Vanilla / DOM
npm install @dndgem/dom@alpha
```

Until the packages appear on the registry, consume from this workspace (or packed tarballs via `pnpm test:pack`).

### Local workspace

```bash
pnpm install
pnpm build
pnpm --filter @dndgem/example-react dev
```

## Quick Start

See [Quick Start](docs/guides/quick-start.md) (~10–15 minutes once packages are available to your app).

### Illustrative React snippet

```tsx
import { DnDGemProvider, useDnDGemContainer, useDnDGemItem } from '@dndgem/react';

function Board() {
  const containerRef = useDnDGemContainer();
  const revenue = useDnDGemItem('revenue');
  return (
    <div ref={containerRef} style={{ position: 'relative', width: 480, height: 240 }}>
      <article ref={revenue.ref} style={{ background: '#2f6f5e', color: '#fff', ...revenue.style }}>
        Revenue
      </article>
    </div>
  );
}

export function App() {
  return (
    <DnDGemProvider
      items={[
        { id: 'revenue', constraints: { minWidth: 96, minUsefulWidth: 140, preferredWidth: 180 } },
      ]}
      desiredPlacements={{ revenue: { x: 12, y: 12, width: 180, height: 88 } }}
    >
      <Board />
    </DnDGemProvider>
  );
}
```

## Where to start

1. [Developer guides](docs/guides/README.md) — full journey
2. [Quick Start](docs/guides/quick-start.md)
3. [Core Concepts](docs/guides/core-concepts.md)
4. Validated examples: `examples/react`, `examples/vanilla`
5. Playground: `apps/playground` (`pnpm --filter @dndgem/playground build`)

## Browser support

Validated for Public Alpha on **Chromium**, **Firefox**, and **WebKit** (Playwright desktop engines). Mobile / touch are **not validated**.

Details: [Browser Support](docs/guides/browser-support.md)

## Accessibility status

Pointer drag and Escape cancel are supported. Focus / consumer ARIA preservation are baseline-supported. Keyboard drag and screen-reader drag announcements are **deferred**.

Details: [Accessibility](docs/guides/accessibility.md)

## Alpha limitations (short)

- Desktop Chromium / Firefox / WebKit validated; mobile not validated
- Pointer drag + Escape cancel supported; keyboard drag deferred
- `DnDGemProvider` is client-mount only (no full SSR claim)
- No Auto-Layout, AI, Flutter, or other framework adapters yet
- Absolute-positioning rendering model

Details: [Limitations](docs/guides/limitations.md) · [Alpha API Contract](docs/architecture/alpha-api-contract.md) · [Release notes](docs/releases/0.1.0-alpha.0.md)

## Playground / demo

The Alpha playground is a static client-side demo under `apps/playground`. Build with:

```bash
pnpm --filter @dndgem/playground build
```

Public hosting is a separate DND-2.5 decision (no in-repo Pages/hosting workflow yet). Readiness: [Stage A report](docs/releases/dnd-2.5-stage-a-readiness.md).

## Feedback

- Security: `security@fingem.ai` (`SECURITY.md`)
- Product / Alpha developer feedback: while this GitHub repository is **PRIVATE**, Issues are not reachable to external Alpha users. Confirm a public feedback email **or** make the repository public before treating feedback as Phase 2 complete. See release notes.

## Development

Requirements: Node.js 20+, pnpm 10.

```bash
pnpm install
pnpm build
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm check:boundaries
pnpm check:docs-links
pnpm test:pack
pnpm test:e2e
pnpm bench:core:semantics
```

`pnpm test:e2e` runs the Alpha browser matrix (Chromium + Firefox + WebKit). Install browsers once with `pnpm test:e2e:install`. Chromium-only: `pnpm test:e2e:chromium`.

Quality policy: **feature → develop** uses the full **local** Sprint Final Quality Gate (no GitHub CI). **develop → master** runs full GitHub CI. See [Testing Strategy](docs/architecture/testing-strategy.md).

## License

MIT — see `LICENSE`.

## Contributing

See `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`. Security reports: `SECURITY.md`.
