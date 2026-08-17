# Developer guides

Authoritative Alpha developer journey for **DnDGem by DA62**.

These guides document the **current public Alpha API** plus in-repository Framework Expansion adapters that are not yet on npm. Published examples use public package entrypoints (`@dndgem/core`, `@dndgem/dom`, `@dndgem/react`). `@dndgem/vue`, `@dndgem/angular`, and `@dndgem/svelte` are workspace-only until DND-FX.6.

## Journey

```text
README
  ↓
Quick Start
  ↓
Core Concepts
  ↓
Packages
  ↓
  React Guide  ·  Vue Guide (in-repo)  ·  Angular Guide (in-repo)  ·  Svelte Guide (in-repo)
  ·  Vanilla / DOM Guide  ·  Meta-frameworks (Next.js / Nuxt / SvelteKit)
  ↓
Constraints & Validity
  ↓
Drag / Resize / Reflow
  ↓
Troubleshooting
  ↓
Performance & Limitations
  ↓
Alpha API Contract
```

| Guide                                                 | Purpose                                          |
| ----------------------------------------------------- | ------------------------------------------------ |
| [Quick Start](./quick-start.md)                       | First working layout in ~10–15 minutes           |
| [Core Concepts](./core-concepts.md)                   | Mental model: intent → evaluate → solve          |
| [Packages](./packages.md)                             | Which package to install and why                 |
| [React Guide](./react.md)                             | Provider, hooks, lifecycle                       |
| [Vue Guide](./vue.md)                                 | Provider, composables, lifecycle (in-repo)       |
| [Angular Guide](./angular.md)                         | Directives, board DI, signals (in-repo)          |
| [Svelte Guide](./svelte.md)                           | Provider, actions, stores (in-repo, unpublished) |
| [Meta-frameworks](./meta-frameworks.md)               | Next.js / Nuxt / SvelteKit compatibility         |
| [Vanilla / DOM Guide](./vanilla.md)                   | `createLayoutSession` path                       |
| [Constraints & Validity](./constraints.md)            | Hard vs useful; VALID / DEGRADED / INVALID       |
| [Drag, Resize & Reflow](./drag-resize-reflow.md)      | Explicit intent vs previous-layout stability     |
| [Troubleshooting](./troubleshooting.md)               | Common integration failures                      |
| [Browser Support](./browser-support.md)               | Alpha Chromium / Firefox / WebKit matrix         |
| [Accessibility](./accessibility.md)                   | Alpha a11y baseline and ownership split          |
| [Limitations](./limitations.md)                       | Honest Alpha boundaries                          |
| [Performance](./performance.md)                       | Contextualized Core solve evidence               |
| [DX Findings](./dx-findings.md)                       | DND-2.3 authoring / DX register                  |
| [Browser / A11y Findings](./browser-a11y-findings.md) | DND-2.4 evidence register                        |

Architecture / contract references (not the day-one path):

- [Alpha API Contract](../architecture/alpha-api-contract.md)
- [Auto-Layout Contract (Phase 3)](../architecture/auto-layout-contract.md)
- [Auto-Layout Engine (Phase 3)](../architecture/auto-layout-engine.md)
- [Framework Adapter Contract (DND-FX)](../architecture/framework-adapter-contract.md)
- [Framework Expansion Gate](../architecture/framework-expansion-planning-audit.md)
- [Release Strategy](../architecture/release-strategy.md)
- [Testing Strategy](../architecture/testing-strategy.md)
- [Core Domain](../architecture/core-domain.md)

## Installation truth

| When                   | How                               |
| ---------------------- | --------------------------------- |
| **Public Alpha (npm)** | `npm install @dndgem/react@alpha` |
| **This repository**    | Workspace / local packages        |

Published version: `0.1.0-alpha.1`. Always use **`@alpha`**. Release notes: [0.1.0-alpha.1](../releases/0.1.0-alpha.1.md).

Canonical public home: [https://dndgem.dev](https://dndgem.dev). Public Quick Start: [https://dndgem.dev/docs/quick-start/](https://dndgem.dev/docs/quick-start/). Support: [https://dndgem.dev/support/](https://dndgem.dev/support/).
