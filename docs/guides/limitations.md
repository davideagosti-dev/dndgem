# Known Alpha Limitations

Honest boundaries for Public Alpha readiness. Deferred items are planned work, not silent defects.

| Area                   | Alpha statement                                                     | Owned by                                |
| ---------------------- | ------------------------------------------------------------------- | --------------------------------------- |
| Browser validation     | Chromium / Firefox / WebKit desktop engines **SUPPORTED FOR ALPHA** | [Browser Support](./browser-support.md) |
| Mobile / touch         | **NOT VALIDATED**                                                   | later                                   |
| Accessibility          | Baseline: pointer + Escape + focus/ARIA preservation; not full WCAG | [Accessibility](./accessibility.md)     |
| Keyboard drag          | **DEFERRED** (not productized)                                      | post-Alpha                              |
| Screen-reader drag UX  | **DEFERRED** (no DnDGem announcement product)                       | post-Alpha                              |
| DOM vs visual order    | Absolute placement may diverge from DOM/tab order                   | consumer guidance                       |
| SSR / hydration        | Module import-safe without `window`; provider is client-mount only  | —                                       |
| Next.js / Remix        | Not validated / not claimed                                         | —                                       |
| npm packages           | **Not published** yet                                               | DND-2.5                                 |
| Auto-Layout            | Not implemented                                                     | Phase 3                                 |
| AI layout              | Not implemented                                                     | Phase 4                                 |
| Flutter                | Not implemented (Core-contract dependent later)                     | post-Alpha                              |
| Vue / Angular / Svelte | Not implemented                                                     | post-Alpha                              |
| Animation framework    | Not implemented                                                     | later                                   |
| Persistence helpers    | Absent (`schemaVersion` principle only)                             | later                                   |
| Nested layouts         | Not a productized feature                                           | later                                   |
| Large-N scale          | Dashboard-scale evidence (~tens of items); not proven huge-N        | later                                   |
| Public playground      | Internal playground only                                            | DND-2.5                                 |

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
