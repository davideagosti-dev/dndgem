# Changesets

This repository uses [Changesets](https://github.com/changesets/changesets) for versioning and changelog generation.

## Version strategy

- Published packages start at **0.0.0** (pre-release engineering baseline).
- Do not treat any package as stable `1.0` until Phase 1 closure and an explicit release decision.
- During DND-1.1 there is **no publish** and **no release automation**.

## Workflow (later)

1. `pnpm changeset` — record an intended change
2. `pnpm version-packages` — bump versions locally when releasing
3. Publish only when an explicit release sprint authorizes it
