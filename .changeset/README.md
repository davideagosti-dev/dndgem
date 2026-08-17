# Changesets

This repository uses [Changesets](https://github.com/changesets/changesets) for versioning and changelog generation.

## Version strategy

- Changesets owns versions and changelogs. Do not hand-edit `packages/*/package.json` versions.
- The repo is in **pre** mode with tag `alpha` (`.changeset/pre.json`).
- Current published version: **`0.1.0-alpha.1`**.
- `@dndgem/core`, `@dndgem/dom`, and `@dndgem/react` are a **fixed** group.
- Future public adapters join the fixed group at **DND-FX.6**. Do not add nonexistent packages to `.changeset/config.json`.
- Do not treat any package as stable `1.0` during Alpha.

## When to add a changeset

Required for consumer-visible API or behavior changes. Not required for docs-only, CI-only, or test-only work unless release notes need it.

## Workflow

1. `pnpm changeset` — record an intended change on the feature branch
2. Merge through `develop` → `master` according to repo policy
3. `pnpm version-packages` (`changeset version`) — generates `0.1.0-alpha.x` while pre mode is active
4. `pnpm sync-package-info` — keep `get*PackageInfo().version` aligned
5. `pnpm test:pack` — packed artifact + consumer import validation
6. Dispatch `.github/workflows/publish.yml` (dry-run default)

Do **not** publish from local machines. Official Alpha channel is `@alpha`.
