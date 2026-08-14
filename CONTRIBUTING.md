# Contributing

Thanks for your interest in DnDGem.

## Project status

DnDGem is in **early technical development**. Phase 1 Technical MVP is **CLOSED**. Active work is **Phase 2 — Public Alpha Readiness** (`docs/roadmap.md`). Large product surfaces (Auto-Layout, AI, Flutter, cloud, billing, multi-framework adapters beyond React) are out of Phase 2 unless a sprint explicitly requires them.

## Development setup

Requirements:

- Node.js 20+ (CI uses Node 22)
- pnpm 10 (`packageManager` field pins the version)

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm format:check
pnpm typecheck
```

Playground:

```bash
pnpm dev
```

## Branching

Long-term model:

- `master`
- `develop`
- `feature/*`

Do not expand scope beyond the active sprint.

## Package boundaries

- Import public package entry points only (`@dndgem/core`, etc.).
- Never import another package’s `src/` internals.
- `@dndgem/core` must stay renderer-agnostic.

See `docs/architecture/package-boundaries.md`.

## Changesets

Use Changesets for consumer-visible library changes (`pnpm changeset`). Docs-only, CI-only, and test-only work does not need a package bump.

Do not publish from local machines. The controlled publish workflow is `.github/workflows/publish.yml` (manual, dry-run by default). Public Alpha publication is DND-2.5.

## Code of conduct

Participation is governed by `CODE_OF_CONDUCT.md`.
