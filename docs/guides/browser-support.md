# Browser Support (Public Alpha)

Authoritative Public Alpha browser support statement for **DnDGem by DA62**.

Sprint evidence: **DND-2.4** (engine-level Playwright validation). This is **not** certification of every Chrome / Firefox / Safari version, mobile browser, or embedded webview.

## Alpha verdict

| Engine / surface              | Classification          |
| ----------------------------- | ----------------------- |
| Chromium (desktop Playwright) | **SUPPORTED FOR ALPHA** |
| Firefox (desktop Playwright)  | **SUPPORTED FOR ALPHA** |
| WebKit (desktop Playwright)   | **SUPPORTED FOR ALPHA** |
| Mobile browsers / touch       | **NOT VALIDATED**       |
| Embedded webviews             | **NOT VALIDATED**       |

## What was tested

Shared behavioral e2e suite × three Playwright projects (`chromium`, `firefox`, `webkit`):

| Capability            | Evidence path                                     |
| --------------------- | ------------------------------------------------- |
| Initial layout        | Playground smoke + React/Vanilla geometry asserts |
| Resize / reflow       | React + Vanilla container resize → measured space |
| Pointer drag          | Drag fixture + React/Vanilla accepted drops       |
| Drop commit           | Accepted drop updates placement                   |
| Escape cancel         | Vanilla + React Escape → restore committed layout |
| Post-drag stability   | Rejected drop preserves previous; cancel restores |
| Focus / ARIA baseline | Accessibility e2e (non-destructive mechanics)     |

Authoritative command:

```bash
pnpm test:e2e:install   # once per machine
pnpm test:e2e           # Alpha matrix (all three engines)
```

Optional fast path (developer convenience only — not the Alpha gate):

```bash
pnpm test:e2e:chromium
```

## Known differences

- Automated evidence uses Playwright desktop engine profiles (`Desktop Chrome`, `Desktop Firefox`, `Desktop Safari`), not every shipping browser build.
- Runtime cost of the full matrix is higher than Chromium-only (local ~tens of seconds with parallel workers; CI uses a single worker).
- Mobile / touch pointer paths are intentionally outside the Alpha claim.
- SSR / hydration remain non-claims (client DOM required for interaction); see [Alpha API Contract](../architecture/alpha-api-contract.md).

## Language to use

- Say: “validated on Chromium, Firefox, and WebKit via Playwright desktop engines”
- Do **not** say: “works in all browsers” or “Safari iOS certified”

Related:

- [Accessibility](./accessibility.md)
- [Limitations](./limitations.md)
- [Testing Strategy](../architecture/testing-strategy.md)
