# Contributing

Thanks for your interest in DnDGem.

## Project status

DnDGem is in **early technical development**. Phase 1 focuses on a Technical MVP of the adaptive layout engine. Large product surfaces (AI, cloud, billing, multi-framework adapters beyond React) are out of scope unless a sprint explicitly requires them.

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

Use Changesets for package version intent when contributing library changes. Do not publish from local machines unless release maintainers authorize it.

## Code of conduct

Participation is governed by `CODE_OF_CONDUCT.md`.
