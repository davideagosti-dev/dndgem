# Known Alpha Limitations

Honest boundaries for Public Alpha readiness. Deferred items are planned work, not silent defects.

| Area                       | Alpha statement                                                                                                                                                                       | Owned by                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Browser validation         | Chromium / Firefox / WebKit desktop engines **SUPPORTED FOR ALPHA**                                                                                                                   | [Browser Support](./browser-support.md)                           |
| Mobile / touch             | **NOT VALIDATED**                                                                                                                                                                     | later                                                             |
| Accessibility              | Baseline: pointer + Escape + focus/ARIA preservation; not full WCAG                                                                                                                   | [Accessibility](./accessibility.md)                               |
| Keyboard drag              | **DEFERRED** (not productized)                                                                                                                                                        | post-Alpha                                                        |
| Screen-reader drag UX      | **DEFERRED** (no DnDGem announcement product)                                                                                                                                         | post-Alpha                                                        |
| DOM vs visual order        | Absolute placement may diverge from DOM/tab order                                                                                                                                     | consumer guidance                                                 |
| SSR / hydration            | Module import-safe without `window`; provider is client-mount only; no server-side layout claim                                                                                       | [ADR-0017](../adr/ADR-0017-ssr-browser-runtime-boundary.md)       |
| Next.js / Nuxt / SvelteKit | Validated **compatibility environments** (client session); no dedicated packages                                                                                                      | [Meta-frameworks](./meta-frameworks.md)                           |
| npm packages               | Public Alpha `0.1.0-alpha.3`; install with `@alpha` only                                                                                                                              | DND-FX.6                                                          |
| npm `latest` dist-tag      | Not the Alpha channel. Core/DOM/React: historical `0.1.0-alpha.0`. Vue/Angular/Svelte: `0.1.0-alpha.2` (first-package npm assignment). Non-blocking Alpha-era exception; not mutated. | future stable release                                             |
| Auto-Layout                | Opt-in on `@alpha` (`0.1.0-alpha.3`); default off                                                                                                                                     | [Auto-Layout engine](../architecture/auto-layout-engine.md)       |
| AI layout                  | Optional advisory planner hooks only (DND-4.2/4.3); private `@dndgem/intelligence`; no LLM/provider; default path unchanged                                                           | [Deterministic planner](../architecture/deterministic-planner.md) |
| Flutter                    | Not implemented (Core-contract dependent later)                                                                                                                                       | separate track                                                    |
| Vue / Angular / Svelte     | Published on `@alpha` (`@dndgem/vue`, `@dndgem/angular`, `@dndgem/svelte` at `0.1.0-alpha.3`)                                                                                         | Framework Expansion Gate (DND-FX.6 COMPLETE)                      |
| Animation framework        | Not implemented                                                                                                                                                                       | later                                                             |
| Persistence helpers        | Absent (`schemaVersion` principle only)                                                                                                                                               | later                                                             |
| Nested layouts             | Not a productized feature                                                                                                                                                             | later                                                             |
| Large-N scale              | Dashboard-scale evidence (~tens of items); not proven huge-N                                                                                                                          | later                                                             |
| Public playground          | https://playground.dndgem.dev/ (provider: https://dndgem-playground.pages.dev/)                                                                                                       | DND-2.5 + domain follow-up (COMPLETE)                             |
| Feedback path              | GitHub Issues · `support@dndgem.dev` / https://dndgem.dev/support/ · security via `SECURITY.md`                                                                                       | public OSS + DND-2.5                                              |

## Positioning model

Resolved items are applied with **absolute** positioning inside a positioned container. Other CSS layout modes are outside the Alpha apply path.

## Language to use

- Say: “validated on Chromium, Firefox, and WebKit (Playwright desktop engines)”
- Do **not** say: “works in all browsers” or “mobile certified”

- Say: “pointer drag and Escape cancel are supported; keyboard drag is deferred”
- Do **not** say: “fully accessible drag-and-drop”

- Say: “client mount required for `DnDGemProvider`”
- Do **not** say: “full SSR support”

Contract reference: [Alpha API Contract](../architecture/alpha-api-contract.md).
