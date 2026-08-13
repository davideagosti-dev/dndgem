# DnDGem

**DnDGem** by **FinGem-AI**

> Drag. Resize. Adapt. Without breaking your content.

Category: **Content-Aware Adaptive Layout Engine**

## Project status

DnDGem is in **early technical development**.

Phase 0 audits are closed with a go decision for the Technical MVP. **DND-1.1**–**DND-1.4** established engineering, Core domain, validity, and the adaptive solver. **DND-1.5** adds DOM measurement and resize observation.

| Area                              | Status                                        |
| --------------------------------- | --------------------------------------------- |
| Monorepo / tooling                | Implemented (DND-1.1)                         |
| Package shells (`core/dom/react`) | Implemented (DND-1.1)                         |
| Core domain / constraints         | Implemented (DND-1.2)                         |
| Validity engine / scoring         | Implemented (DND-1.3)                         |
| Adaptive solver / reflow          | Implemented (DND-1.4)                         |
| DOM measurement / resize          | Implemented (DND-1.5)                         |
| Drag & drop integration           | Planned (DND-1.6; `@dnd-kit/dom` deferred)    |
| React / vanilla integrations      | Planned (DND-1.7)                             |
| AI                                | Out of Phase 1 critical path                  |
| Flutter / other frameworks        | Compatibility principle only; not implemented |

## Product thesis

DnDGem aims to provide framework-agnostic adaptive layouts for draggable and resizable interfaces by combining:

```text
Content Constraints
+ Layout Validity
+ Deterministic Adaptive Solver
+ Responsive Reflow
```

Constraint domain types, validity evaluation, and the adaptive solver exist in Core. `@dndgem/dom` normalizes browser geometry into those Core shapes. Drag/drop and framework product bindings are later sprints.

## Architecture overview

```text
@dndgem/core          renderer-agnostic domain, validity, scoring, solver
     ▲
@dndgem/dom           DOM measurement, coordinate normalization, resize observation
     ▲
@dndgem/react         React adapter (future bindings; React is a peerDependency)
```

Details: `docs/architecture/overview.md`, `docs/architecture/core-domain.md`, and `docs/adr/`.

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
pnpm dev
```

Browser smoke (Playwright):

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

## Planned install (not published yet)

Packages are **not published** to npm yet. When they are:

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
