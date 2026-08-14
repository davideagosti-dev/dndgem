# Release Strategy

## Versioning

- In-repo package versions stay at **0.0.0** until a Changesets version pass generates a publishable prerelease.
- Changesets owns version numbers and changelogs. Do not hand-edit `packages/*/package.json` versions.
- DnDGem is in **0.x Alpha**. This is not SemVer 1.0.
- Expected first published version: **`0.1.0-alpha.0`**.
- The three publishable packages are a Changesets **fixed** group (`@dndgem/core`, `@dndgem/dom`, `@dndgem/react`) so they remain version-aligned.
- The repository is in Changesets **pre** mode with tag `alpha` (`.changeset/pre.json`).

`getCorePackageInfo` / `getDomPackageInfo` / `getReactPackageInfo` expose the same version string as `package.json`. After `changeset version`, run `pnpm sync-package-info` so source constants match.

## Dist-tags

| Tag      | Use                                               |
| -------- | ------------------------------------------------- |
| `alpha`  | First Public Alpha and subsequent 0.x prereleases |
| `latest` | Forbidden for the first Alpha                     |

Install (after DND-2.5 publish, not before):

```bash
npm install @dndgem/react@alpha
```

## Changeset policy

A changeset **is required** when a change is consumer-visible:

- Public API additions, removals, or renames
- Documented public behavior changes (solver output, drag/resize intent rules, React/DOM session contract)
- Bug fixes that change what a consumer observes

A changeset is **not** required for:

- Docs-only or governance-only work that does not need release notes
- Internal tooling, CI, or pack-script changes
- Test-only changes

Use `pnpm changeset` on library work. Do not publish from a local machine unless release maintainers authorize it.

## Promotion model

```text
feature/*
    → develop
        → master
            → changeset version (0.1.0-alpha.x)
            → pack validation
            → workflow_dispatch publish (dist-tag alpha)
```

- `baseBranch` for Changesets is `master`.
- DND-2.2 prepares the pipeline; it does **not** publish.
- DND-2.5 is the Public Alpha publication gate.

## Publish workflow

Workflow: `.github/workflows/publish.yml`

- Trigger: **manual** `workflow_dispatch` only (never on push)
- Default `dry_run: true`
- Default dist-tag: `alpha`
- Refuses `latest` unless `allow_latest` is explicitly set (Alpha must not)
- Re-runs the full CI workflow first (`workflow_call`)
- Builds packages and runs `pnpm test:pack`
- Authenticates to npm with GitHub secret `NPM_TOKEN` (never committed)
- Actual `pnpm publish` is skipped when `dry_run` is true
- Actual publish is refused while package versions are still `0.0.0`

Release authority: repository maintainers via the dispatch UI (and optional future GitHub Environment reviewers). Rollback: npm dist-tag adjustment / deprecate; Alpha makes no compatibility guarantee beyond documenting the break.

## Provenance

npm `--provenance` is **prepared as a DND-2.5 item**, not enabled in DND-2.2.

Provenance via GitHub OIDC is intended for a public repository publishing public packages. This repository is currently **PRIVATE**. Enabling provenance before a visibility decision would be premature.

## npm scope

Target scope: `@dndgem`.

Ownership/availability of the npm organization is an **external DND-2.5 blocker**. DND-2.2 does not create accounts or change registry ownership. Package names remain `@dndgem/*` in-repo.

## External blockers (do not block DND-2.2)

| Item                         | Blocks                  |
| ---------------------------- | ----------------------- |
| `@dndgem` npm org ownership  | DND-2.5                 |
| GitHub secret `NPM_TOKEN`    | DND-2.5                 |
| GitHub Environment approvals | DND-2.5 optional        |
| Public repository visibility | separate from npm Alpha |
| Actual `npm publish`         | DND-2.5                 |

## Historical

- **DND-1.1:** Changesets initialized; no publish.
- **DND-2.1:** full CI quality gate; no version bumps; no npm publish.
- **DND-2.2:** Alpha API contract, package metadata, pack validation, controlled publish workflow, dry-run only.
- **DND-2.5:** npm Alpha publication gate.

Repository visibility (private → public) remains a **separate** gate from npm Alpha.
