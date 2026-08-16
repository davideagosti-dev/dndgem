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

| Tag      | Use                                                                  |
| -------- | -------------------------------------------------------------------- |
| `alpha`  | Official Public Alpha channel (`0.1.0-alpha.0` and later 0.x alphas) |
| `latest` | Reserved for a future **stable** release                             |

Install (Public Alpha):

```bash
npm install @dndgem/react@alpha
```

Always document and use **`@alpha`**. Do not describe this Alpha as stable.

### First Alpha registry note (`0.1.0-alpha.0`)

After the first publish, verified registry state is:

- `alpha` → `0.1.0-alpha.0` (correct / official)
- `latest` → `0.1.0-alpha.0` (aliases the only published version)

Removal of `latest` was attempted through verified release/admin paths and refused by the registry. Document this as a **non-blocking** Alpha limitation. A future stable release must take ownership of `latest`. See [0.1.0-alpha.0 release notes](../releases/0.1.0-alpha.0.md).

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
    → develop          (local Sprint Final Quality Gate; no GitHub CI required)
        → master       (full GitHub CI on develop → master PR must PASS)
            → changeset version (0.1.0-alpha.x)
            → pack validation
            → workflow_dispatch publish (dist-tag alpha)
```

- Feature → develop: authoritative **local** validation only (DND-2.3 CI policy).
- Develop → master: authoritative **GitHub** CI (`quality` + `browser-e2e`) via `.github/workflows/ci.yml`.
- Publish still re-invokes CI through `workflow_call` (compatible with the promotion-only automatic triggers).
- `baseBranch` for Changesets is `master`.
- DND-2.2 prepared the pipeline; it does **not** publish.
- DND-2.5 is the Public Alpha publication gate.

## Publish workflow

Workflow: `.github/workflows/publish.yml`

- Trigger: **manual** `workflow_dispatch` only (never on push)
- Default `dry_run: true`
- Default dist-tag: `alpha`
- Refuses `latest` unless `allow_latest` is explicitly set (Alpha must not)
- Re-runs the full CI workflow first (`workflow_call`)
- Builds packages and runs `pnpm test:pack`
- Non-dry-run publish is refused unless the workflow runs on `master`
- Actual `pnpm publish` is skipped when `dry_run` is true
- Actual publish is refused while package versions are still `0.0.0`

### Authentication (Trusted Publishing / OIDC)

Primary publish authentication:

```text
GitHub Actions (publish.yml npm job)
      │  permissions: id-token: write
      ▼
GitHub OIDC identity
      │
      ▼
npm Trusted Publisher (per package)
      │
      ▼
short-lived publish token → npm registry
```

- **No long-lived write token** is used on the primary publish path.
- Each of `@dndgem/core`, `@dndgem/dom`, and `@dndgem/react` must have its own Trusted Publisher on npmjs.com pointing at:
  - Provider: GitHub Actions
  - Owner: `davideagosti-dev`
  - Repository: `dndgem`
  - Workflow filename: `publish.yml`
  - Environment: _(blank / none — no GitHub Environment is required today)_
  - Allowed action: `npm publish`
- `pnpm publish` packs the package (including `workspace:*` rewrite) and invokes `npm publish` on the tarball; the **npm CLI** performs the OIDC exchange. Publish runners use Node **24** and npm CLI **≥ 11.5.1**.
- GitHub-hosted runners only (`ubuntu-latest`). Self-hosted runners are not supported by npm Trusted Publishing.
- `npm publish --dry-run` / `pnpm publish --dry-run` validates pack safety only — it does **not** prove Trusted Publishing.

`NPM_TOKEN` GitHub secret classification:

| State                                                                    | Meaning                                                           |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| ~~PRIMARY~~                                                              | Former token-based publish path (retired for routine publish)     |
| **LEGACY FALLBACK — DO NOT REVOKE UNTIL FIRST REAL OIDC RELEASE PASSES** | Keep until a legitimate non-dry-run publish succeeds via OIDC     |
| REMOVED                                                                  | Only after verified OIDC publish + optional token lockdown on npm |

Do **not** revoke `NPM_TOKEN` solely because the workflow YAML was migrated.

Optional CLI equivalent (do not run without maintainer approval / 2FA):

```bash
npm trust github @dndgem/core  --repo davideagosti-dev/dndgem --file publish.yml --allow-publish
npm trust github @dndgem/dom   --repo davideagosti-dev/dndgem --file publish.yml --allow-publish
npm trust github @dndgem/react --repo davideagosti-dev/dndgem --file publish.yml --allow-publish
```

(`npm trust` requires npm ≥ 11.15.0, package write access, and account 2FA.)

### workflow_call / OIDC identity

`publish.yml` calls `ci.yml` for the quality gate, then publishes in its own `npm` job.

- The workflow filename npm validates for Trusted Publishing is **`publish.yml`** (the workflow that performs publish under `workflow_dispatch`).
- `id-token: write` is granted only on the `npm` publish job (least privilege). The reusable `ci.yml` jobs do not publish and do not need OIDC.
- Dist-tag / admin repair remains in `.github/workflows/npm-repair-alpha.yml` and uses token auth — OIDC does **not** authorize `dist-tag`, `access`, `unpublish`, or other non-publish admin commands.

### GitHub Environment (optional, not enabled)

A future `npm-release` Environment (required reviewers, `master`-only) could add an approval gate. It is **not** required for Trusted Publishing. If introduced later, the same Environment name must be entered on each package’s Trusted Publisher config.

Release authority: repository maintainers via the dispatch UI. Rollback: npm dist-tag adjustment / deprecate; Alpha makes no compatibility guarantee beyond documenting the break.

## Provenance

OIDC Trusted Publishing and npm provenance are independent.

| Capability                             | Status while repository is **PRIVATE**                                           |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| Trusted Publishing (OIDC publish auth) | **SUPPORTED** (configure + verify on next real publish)                          |
| npm provenance attestations            | **NOT AVAILABLE** for private repositories, even when publishing public packages |

Do **not** pass `--provenance` while the repository remains private. Lack of provenance is **not** a Trusted Publishing blocker. Provenance may be reconsidered only after an explicit public-visibility decision.

## npm scope

Target scope: `@dndgem`.

`@dndgem` scope ownership and first Alpha publication are complete for DND-2.5. Package names remain `@dndgem/{core,dom,react}`.

## Historical Stage B external gates (resolved)

| Item                         | Blocks                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `@dndgem` npm org ownership  | Stage B publication                                                                |
| GitHub secret `NPM_TOKEN`    | Stage B publication (legacy; superseded by Trusted Publishing for routine publish) |
| External feedback path       | Phase 2 PASS (if repo private)                                                     |
| Public playground hosting    | Phase 2 PASS (or npm-only waiver)                                                  |
| GitHub Environment approvals | optional                                                                           |
| Public repository visibility | separate explicit decision                                                         |
| Actual `npm publish`         | Stage B after master promotion                                                     |

Post-Alpha security follow-up: migrate primary publish auth to npm Trusted Publishing + GitHub Actions OIDC. Status: **CONFIGURED — PENDING FIRST REAL OIDC RELEASE** until a legitimate non-dry-run publish succeeds.

Canonical public product home: **https://dndgem.dev** (**OWNED AND LIVE**; static site in `apps/www`). Canonical playground: **https://playground.dndgem.dev/** (**LIVE**; provider fallback `https://dndgem-playground.pages.dev/` remains). See [Public site & domain hosting](./public-site.md).

Authoritative Stage A register: `docs/releases/dnd-2.5-stage-a-readiness.md`.

## Historical

- **DND-1.1:** Changesets initialized; no publish.
- **DND-2.1:** full CI quality gate; no version bumps; no npm publish.
- **DND-2.2:** Alpha API contract, package metadata, pack validation, controlled publish workflow, dry-run only.
- **DND-2.3:** Developer guides + CI promotion policy (GitHub CI on develop → master only).
- **DND-2.5:** Public Alpha LIVE — `@dndgem/{core,dom,react}@0.1.0-alpha.0` under dist-tag `alpha`.

Repository visibility (private → public) remains a **separate** gate from npm Alpha.
