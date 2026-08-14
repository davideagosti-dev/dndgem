# Changesets

This repository uses [Changesets](https://github.com/changesets/changesets) for versioning and changelog generation.

## Version strategy

- In-repo versions stay at **0.0.0** until a release version pass.
- The repo is in **pre** mode with tag `alpha`.
- First intended publish version: **`0.1.0-alpha.0`**.
- `@dndgem/core`, `@dndgem/dom`, and `@dndgem/react` are a fixed group.
- Do not treat any package as stable `1.0` during Phase 2.

## When to add a changeset

Required for consumer-visible API or behavior changes. Not required for docs-only, CI-only, or test-only work unless release notes need it.

## Workflow

1. `pnpm changeset` — record an intended change on the feature branch
2. Merge through `develop` → `master` according to repo policy
3. `pnpm version-packages` (`changeset version`) — generates `0.1.0-alpha.x` while pre mode is active
4. `pnpm sync-package-info` — keep `get*PackageInfo().version` aligned
5. `pnpm test:pack` — packed artifact + consumer import validation
6. Dispatch `.github/workflows/publish.yml` (dry-run default)

Do **not** publish from local machines. Public Alpha publish is DND-2.5.
