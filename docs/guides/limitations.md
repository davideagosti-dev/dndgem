# Known Alpha Limitations

Honest boundaries for Public Alpha readiness. Deferred items are planned work, not silent defects.

| Area                   | Alpha statement                                                                 | Owned by                                                        |
| ---------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Browser validation     | Chromium / Firefox / WebKit desktop engines **SUPPORTED FOR ALPHA**             | [Browser Support](./browser-support.md)                         |
| Mobile / touch         | **NOT VALIDATED**                                                               | later                                                           |
| Accessibility          | Baseline: pointer + Escape + focus/ARIA preservation; not full WCAG             | [Accessibility](./accessibility.md)                             |
| Keyboard drag          | **DEFERRED** (not productized)                                                  | post-Alpha                                                      |
| Screen-reader drag UX  | **DEFERRED** (no DnDGem announcement product)                                   | post-Alpha                                                      |
| DOM vs visual order    | Absolute placement may diverge from DOM/tab order                               | consumer guidance                                               |
| SSR / hydration        | Module import-safe without `window`; provider is client-mount only              | —                                                               |
| Next.js / Remix        | Not validated / not claimed                                                     | —                                                               |
| npm packages           | Public Alpha `0.1.0-alpha.0`; install with `@alpha` only                        | DND-2.5                                                         |
| npm `latest` dist-tag  | Aliases sole published prerelease; not a stable channel                         | future stable release                                           |
| Auto-Layout            | Not implemented — DND-3.1 **contract** complete; implementation starts DND-3.2  | [Auto-Layout contract](../architecture/auto-layout-contract.md) |
| AI layout              | Not implemented                                                                 | Phase 4                                                         |
| Flutter                | Not implemented (Core-contract dependent later)                                 | post-Alpha                                                      |
| Vue / Angular / Svelte | Not implemented                                                                 | post-Alpha                                                      |
| Animation framework    | Not implemented                                                                 | later                                                           |
| Persistence helpers    | Absent (`schemaVersion` principle only)                                         | later                                                           |
| Nested layouts         | Not a productized feature                                                       | later                                                           |
| Large-N scale          | Dashboard-scale evidence (~tens of items); not proven huge-N                    | later                                                           |
| Public playground      | https://playground.dndgem.dev/ (provider: https://dndgem-playground.pages.dev/) | DND-2.5 + domain follow-up (COMPLETE)                           |
| Feedback path          | `support@dndgem.dev` / https://dndgem.dev/support/ (repo remains PRIVATE)       | DND-2.5                                                         |

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
