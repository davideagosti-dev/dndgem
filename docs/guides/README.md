# Developer guides

Authoritative Alpha developer journey for **DnDGem by FinGem-AI**.

These guides document the **current public Alpha API** only. They are executable truth: examples use public package entrypoints (`@dndgem/core`, `@dndgem/dom`, `@dndgem/react`) and match the validated workspace examples.

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
React Guide  ·  Vanilla / DOM Guide
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

| Guide                                                 | Purpose                                      |
| ----------------------------------------------------- | -------------------------------------------- |
| [Quick Start](./quick-start.md)                       | First working layout in ~10–15 minutes       |
| [Core Concepts](./core-concepts.md)                   | Mental model: intent → evaluate → solve      |
| [Packages](./packages.md)                             | Which package to install and why             |
| [React Guide](./react.md)                             | Provider, hooks, lifecycle                   |
| [Vanilla / DOM Guide](./vanilla.md)                   | `createLayoutSession` path                   |
| [Constraints & Validity](./constraints.md)            | Hard vs useful; VALID / DEGRADED / INVALID   |
| [Drag, Resize & Reflow](./drag-resize-reflow.md)      | Explicit intent vs previous-layout stability |
| [Troubleshooting](./troubleshooting.md)               | Common integration failures                  |
| [Browser Support](./browser-support.md)               | Alpha Chromium / Firefox / WebKit matrix     |
| [Accessibility](./accessibility.md)                   | Alpha a11y baseline and ownership split      |
| [Limitations](./limitations.md)                       | Honest Alpha boundaries                      |
| [Performance](./performance.md)                       | Contextualized Core solve evidence           |
| [DX Findings](./dx-findings.md)                       | DND-2.3 authoring / DX register              |
| [Browser / A11y Findings](./browser-a11y-findings.md) | DND-2.4 evidence register                    |

Architecture / contract references (not the day-one path):

- [Alpha API Contract](../architecture/alpha-api-contract.md)
- [Release Strategy](../architecture/release-strategy.md)
- [Testing Strategy](../architecture/testing-strategy.md)
- [Core Domain](../architecture/core-domain.md)

## Installation truth

| When                         | How                                                   |
| ---------------------------- | ----------------------------------------------------- |
| **Now (this repository)**    | Workspace / local packages — see Quick Start          |
| **After Public Alpha (2.5)** | `npm install @dndgem/react@alpha` (not published yet) |

Packages are **not** on the public npm registry until DND-2.5.
