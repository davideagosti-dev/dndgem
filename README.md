# DnDGem

**DnDGem** by **DA62**

> Drag. Resize. Adapt. Without breaking your content.

Category: **Content-Aware Adaptive Layout Engine**

**Canonical website:** [https://dndgem.dev](https://dndgem.dev)

**DA62:** [https://davideagosti.com](https://davideagosti.com)

## What it is

DnDGem lays out draggable dashboard-style content using **content-aware constraints**, **deterministic solving**, and **adaptive reflow** — so a layout that geometrically fits can still be classified as less useful when content needs are missed.

```text
GEOMETRICALLY FITS  ≠  CONTENT REMAINS USEFUL
```

It is **not** merely a grid library, a drag-and-drop wrapper, a React-only library, or a dnd-kit abstraction. React is a thin adapter; Core stays framework-agnostic.

## Project status

| Phase                          | Status                                                   |
| ------------------------------ | -------------------------------------------------------- |
| Phase 1 Technical MVP          | **CLOSED** (DND-1.1 → DND-1.8)                           |
| Phase 2 Public Alpha Readiness | **PASS** — Public Alpha **LIVE**                         |
| Phase 3 Adaptive Auto-Layout   | **COMPLETE / RELEASED** (`0.1.0-alpha.1`)                |
| Framework Expansion Gate       | **ACTIVE** (DND-FX.1–FX.5 COMPLETE; **DND-FX.6 ACTIVE**) |

Current official npm Alpha: **`0.1.0-alpha.2`** (cross-framework; pre-publish ready in repository). Install with dist-tag **`alpha`** (`npm install @dndgem/react@alpha`, `@dndgem/vue@alpha`, etc.). Release notes: [0.1.0-alpha.2](docs/releases/0.1.0-alpha.2.md). Previous: [0.1.0-alpha.1](docs/releases/0.1.0-alpha.1.md). Historical first Alpha: [0.1.0-alpha.0](docs/releases/0.1.0-alpha.0.md) (`latest` still points here and is **not** the Alpha channel).

Public product home: **https://dndgem.dev** (see [Public site & domain hosting](docs/architecture/public-site.md)).

## Packages

```text
@dndgem/core          renderer-agnostic domain, validity, scoring, solver
     ▲
@dndgem/dom           DOM measurement, resize, drag, layout session
     ▲
@dndgem/react         React adapter (peerDependency: react)
@dndgem/vue           Vue 3 adapter (peerDependency: vue)
@dndgem/angular       Angular adapter (peerDependency: @angular/core)
@dndgem/svelte        Svelte 5 adapter (peerDependency: svelte)
```

| Need                        | Package           |
| --------------------------- | ----------------- |
| Headless solve / evaluate   | `@dndgem/core`    |
| Vanilla browser integration | `@dndgem/dom`     |
| React integration           | `@dndgem/react`   |
| Vue integration             | `@dndgem/vue`     |
| Angular integration         | `@dndgem/angular` |
| Svelte integration          | `@dndgem/svelte`  |

Validated meta-framework environments (not npm packages): Next.js → `@dndgem/react`; Nuxt → `@dndgem/vue`; SvelteKit → `@dndgem/svelte`.

## Installation

### Public Alpha (npm)

```bash
npm install @dndgem/react@alpha
npm install @dndgem/vue@alpha
npm install @dndgem/angular@alpha
npm install @dndgem/svelte@alpha
npm install @dndgem/dom@alpha
```

Install with dist-tag **`alpha`** only (`@dndgem/*@alpha` → `0.1.0-alpha.2`). This is not a stable release; do not treat `latest` as a stable channel (`latest` still points at historical `0.1.0-alpha.0`).

### Local workspace

```bash
pnpm install
pnpm build
pnpm --filter @dndgem/example-react dev
pnpm --filter @dndgem/example-vue dev
pnpm --filter @dndgem/example-angular dev
pnpm --filter @dndgem/example-svelte dev
```

## Quick Start

See [Quick Start](docs/guides/quick-start.md) (~10–15 minutes once packages are available to your app), or the public page: https://dndgem.dev/docs/quick-start/

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

1. [https://dndgem.dev](https://dndgem.dev) — canonical public product home
2. [Developer guides](docs/guides/README.md) — full journey (in-repo)
3. [Quick Start](docs/guides/quick-start.md)
4. [Core Concepts](docs/guides/core-concepts.md)
5. Validated examples: `examples/react`, `examples/vanilla`, `examples/vue`, `examples/angular`, `examples/svelte` (Vue, Angular, and Svelte are workspace-only). Meta-framework fixtures: `apps/compat-next`, `apps/compat-nuxt`, `apps/compat-sveltekit` (see [Meta-frameworks](docs/guides/meta-frameworks.md)).
6. Playground: https://playground.dndgem.dev/ (provider: https://dndgem-playground.pages.dev/)

## Browser support

Validated for Public Alpha on **Chromium**, **Firefox**, and **WebKit** (Playwright desktop engines). Mobile / touch are **not validated**.

Details: [Browser Support](docs/guides/browser-support.md)

## Accessibility status

Pointer drag and Escape cancel are supported. Focus / consumer ARIA preservation are baseline-supported. Keyboard drag and screen-reader drag announcements are **deferred**.

Details: [Accessibility](docs/guides/accessibility.md)

## Alpha limitations (short)

- Desktop Chromium / Firefox / WebKit validated; mobile not validated
- Pointer drag + Escape cancel supported; keyboard drag deferred
- `DnDGemProvider` is client-mount only (no server-side layout claim; Next.js / Nuxt / SvelteKit are validated compatibility environments — [Meta-frameworks](docs/guides/meta-frameworks.md))
- Auto-Layout is opt-in on `@alpha` (`0.1.0-alpha.1`); default off
- Vue, Angular, and Svelte adapters are implemented in this repository (`@dndgem/vue`, `@dndgem/angular`, `@dndgem/svelte`) and **not yet published**
- No AI, no Flutter adapter yet
- Absolute-positioning rendering model

Details: [Limitations](docs/guides/limitations.md) · [Alpha API Contract](docs/architecture/alpha-api-contract.md) · [Release notes](docs/releases/0.1.0-alpha.1.md)

## Playground / demo

Preferred public playground: **https://playground.dndgem.dev/**

Provider URL (keep available): **https://dndgem-playground.pages.dev/**

Local static build:

```bash
pnpm --filter @dndgem/playground build
```

Public landing site (static):

```bash
pnpm --filter @dndgem/www build
```

## Feedback

- Product / Alpha developer feedback: **`support@dndgem.dev`**
- Public support page: https://dndgem.dev/support/
- Security: `security@dndgem.dev` (`SECURITY.md`)
- GitHub Issues are not reachable to external Alpha users while this repository remains **PRIVATE**.

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
