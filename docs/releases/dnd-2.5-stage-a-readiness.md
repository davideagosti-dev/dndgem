# DND-2.5 Stage A — Release readiness

Authoritative Stage A audit register for the Public Alpha Release Gate.  
**No npm publication and no repository visibility change occur in Stage A.**

## Verdict (Stage A)

```text
DND-2.5 RELEASE READINESS PASSED — READY FOR PROMOTION
```

Publication (Stage B) remains blocked until external gates below are green and release-prep is on `master`.

---

## Repository baseline

| Item                         | Value                                                         |
| ---------------------------- | ------------------------------------------------------------- |
| Sprint branch                | `feature/dnd-2.5-public-alpha-release-gate`                   |
| Baseline HEAD (from develop) | `76d3563c7892599a22b81691a486c56e16d079d8`                    |
| `develop` / `origin/develop` | `76d3563` (merge of DND-2.4 PR #22)                           |
| `master` / `origin/master`   | `85a5e95` (merge of develop PR #23; already contains DND-2.4) |
| Working tree at branch cut   | clean                                                         |
| DND-2.1 ancestor             | yes (`bad3d40`)                                               |
| DND-2.2 ancestor             | yes (`b65e856`)                                               |
| DND-2.3 ancestor             | yes (`1a430b3`)                                               |
| DND-2.4 ancestor             | yes (`1a9c8b3c7ccc68e5fcf1abc51ffeaf546dc2da48`)              |
| Repository visibility        | **PRIVATE**                                                   |

Note: `master` was ahead of `develop` by the empty merge commit of PR #23 at sprint start. Feature work still branches from `develop` per policy.

---

## Alpha API freeze

| Package         | Runtime export count | Export-lock tests |
| --------------- | -------------------- | ----------------- |
| `@dndgem/core`  | 25                   | PASS              |
| `@dndgem/dom`   | 11                   | PASS              |
| `@dndgem/react` | 7                    | PASS              |

No public API changes in DND-2.5 Stage A. Contract: `docs/architecture/alpha-api-contract.md`.

---

## Versioning / Changesets

| Item                    | State                                          |
| ----------------------- | ---------------------------------------------- |
| In-repo versions        | `0.0.0`                                        |
| Pre mode                | `pre` / tag `alpha` (`.changeset/pre.json`)    |
| Fixed group             | `@dndgem/core`, `@dndgem/dom`, `@dndgem/react` |
| `baseBranch`            | `master`                                       |
| Pending changeset       | `.changeset/dnd-2-2-alpha-api.md` (minor ×3)   |
| Preview after `version` | **`0.1.0-alpha.0`** for all three              |

Do not hand-edit package versions. Run `changeset version` only on the approved release ref (Stage B, after promotion).

---

## npm readiness (Stage B blockers)

| Gate                                     | Assessment                                                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Package names `@dndgem/{core,dom,react}` | Registry HTTP **404** — names appear **available** (unpublished)                                                                                             |
| `@dndgem` scope / org ownership          | **NOT VERIFIED** — no authenticated npm identity in this environment; treat as **PUBLICATION BLOCKER** until release account proves publish rights           |
| GitHub secret `NPM_TOKEN`                | **ABSENT** (`gh secret list` empty) — **PUBLICATION BLOCKER**                                                                                                |
| Local `npm whoami`                       | Unauthenticated                                                                                                                                              |
| Publish workflow                         | `.github/workflows/publish.yml` — `workflow_dispatch`, dry-run default, refuses `latest` unless allowed, refuses real publish at `0.0.0`, runs full CI first |

---

## Package artifacts (packed at `0.0.0`)

| Package         | Tarball                  | Packed  | Unpacked  | Files |
| --------------- | ------------------------ | ------- | --------- | ----- |
| `@dndgem/core`  | `dndgem-core-0.0.0.tgz`  | 24.4 kB | ~98.3 kB  | 59    |
| `@dndgem/dom`   | `dndgem-dom-0.0.0.tgz`   | 23.6 kB | ~102.4 kB | 35    |
| `@dndgem/react` | `dndgem-react-0.0.0.tgz` | 8.0 kB  | ~26.8 kB  | 23    |

Included: `package.json`, `LICENSE`, `README.md`, `dist` JS + types + source maps.  
Excluded: `src/`, tests, benchmarks, secrets.  
Isolated packed-consumer smokes (Core / DOM / React) + typecheck: **PASS** (`pnpm test:pack`).

Metadata (name, description, MIT license, repository, homepage, bugs, keywords, author FinGem-AI, engines `>=20`, ESM `exports`, `publishConfig.access=public`, React peer `^18 \|\| ^19`, no `react-dom` peer): audited OK for Alpha.

---

## Browser / accessibility

Claims unchanged from DND-2.4. Local Stage A re-run: **36/36** e2e PASS (Chromium 12, Firefox 12, WebKit 12).

---

## Documentation / DX

| Item                 | Status                                                          |
| -------------------- | --------------------------------------------------------------- |
| README               | Alpha-oriented; install still conditional until Stage B publish |
| Quick Start          | Executable against workspace / examples                         |
| Vanilla guide        | Present                                                         |
| Limitations          | Honest                                                          |
| Release notes        | `docs/releases/0.1.0-alpha.0.md`                                |
| Time-to-first-layout | ~10–15 minutes (qualitative, workspace path)                    |

---

## Playground

| Item              | Status                                                                             |
| ----------------- | ---------------------------------------------------------------------------------- |
| App               | `apps/playground` — demonstrates constraints, VALID/DEGRADED, resize, pointer drag |
| Static build      | `pnpm --filter @dndgem/playground build` → `apps/playground/dist`                  |
| Public hosting    | **NONE in repo** — Pages / Cloudflare / Vercel / etc. not configured               |
| Phase 2 PASS need | Externally usable demo **or** explicit user acceptance of npm-only Alpha           |

---

## Feedback path

| Option                              | External usability while PRIVATE |
| ----------------------------------- | -------------------------------- |
| GitHub Issues                       | **No** for outsiders             |
| `security@fingem.ai`                | Security only (`SECURITY.md`)    |
| Product Alpha email / public Issues | **DECISION REQUIRED**            |

---

## Repository visibility decision

```text
CURRENT: PRIVATE
STRATEGY (release-strategy.md): visibility separate from npm Alpha
DECISION REQUIRED (explicit user approval before any change):
  - KEEP PRIVATE DURING INITIAL NPM ALPHA  (feedback must be non-GitHub)
  - PUBLIC AT ALPHA                        (enables Issues + optional provenance)
  - PUBLIC BEFORE ALPHA
```

Do **not** change visibility without explicit approval. If going public, run a secrets / proprietary-content safety audit first.

Provenance (`npm --provenance`): remains **deferred** while the repository is private.

---

## Local quality gates (Stage A baseline)

| Command                     | Result    |
| --------------------------- | --------- |
| `pnpm format:check`         | PASS      |
| `pnpm lint`                 | PASS      |
| `pnpm typecheck`            | PASS      |
| `pnpm check:boundaries`     | PASS      |
| `pnpm test`                 | PASS      |
| `pnpm build`                | PASS      |
| `pnpm test:pack`            | PASS      |
| `pnpm test:e2e`             | PASS (36) |
| `pnpm bench:core:semantics` | PASS      |
| `pnpm check:docs-links`     | PASS      |

---

## Production semantics audit

| Area                    | Changed in Stage A? |
| ----------------------- | ------------------- |
| Core solver             | NO                  |
| Validity / scoring      | NO                  |
| Candidate generation    | NO                  |
| DOM measurement         | NO                  |
| Drag / resize semantics | NO                  |
| React runtime           | NO                  |
| Public API              | NO                  |

Release-prep is docs / governance / release notes only (plus minimal playground Alpha copy if present).

---

## CI policy (unchanged)

```text
feature → develop     local Sprint Final Quality Gate; no GitHub CI
develop → master      full GitHub CI (promote-gate + quality + browser-e2e)
publish               workflow_dispatch; re-invokes CI via workflow_call
```

---

## Acceptance matrix (Stage A)

| Area                     | Verdict              | Evidence                               |
| ------------------------ | -------------------- | -------------------------------------- |
| Core API                 | PASS                 | 25 exports; lock tests                 |
| DOM API                  | PASS                 | 11 exports; lock tests                 |
| React API                | PASS                 | 7 exports; lock tests                  |
| Packaging                | PASS                 | `test:pack`                            |
| Types                    | PASS                 | packed consumer typecheck              |
| npm metadata             | PASS                 | package.json audit                     |
| Versioning               | PASS                 | Changesets preview → 0.1.0-alpha.0     |
| Changesets               | PASS                 | pre/alpha/fixed group                  |
| npm publication          | BLOCKED              | Stage B — token + scope                |
| Registry install         | DEFERRED             | after publish                          |
| Quick Start              | PASS WITH LIMITATION | workspace path until publish           |
| React example            | PASS                 | builds                                 |
| Vanilla example          | PASS                 | builds                                 |
| Browser support          | PASS                 | 36 e2e                                 |
| Accessibility baseline   | PASS WITH LIMITATION | deferred keyboard/SR documented        |
| Performance claims       | PASS WITH LIMITATION | contextual, not SLA                    |
| Known limitations        | PASS                 | guides + release notes                 |
| CI                       | PASS                 | policy preserved                       |
| Playground               | PASS WITH LIMITATION | static artifact; hosting TBD           |
| Feedback path            | BLOCKED              | needs public Issues or confirmed email |
| Repo visibility decision | DEFERRED             | user decision                          |

---

## Required user promotion (before Stage B)

```text
1. merge feature/dnd-2.5-public-alpha-release-gate → develop
2. open develop → master PR
3. require full GitHub CI PASS (quality + browser-e2e Chromium/Firefox/WebKit)
4. merge to master
5. resume DND-2.5 Stage B in Cursor
```

Cursor must **not** open/merge those PRs unless explicitly instructed.

---

## Stage B resume checklist (Cursor)

Before real publish:

```text
[ ] release-prep commit is ancestor of master / origin/master
[ ] develop → master CI PASS (record run ID)
[ ] changeset version → 0.1.0-alpha.0 (+ sync-package-info)
[ ] final pack + consumer PASS
[ ] NPM_TOKEN configured in GitHub secrets
[ ] @dndgem scope ownership / publish permission verified
[ ] dist-tag alpha; dry_run false via publish.yml on master
[ ] feedback path externally usable
[ ] playground hosted OR npm-only Alpha explicitly accepted
[ ] visibility handled per explicit decision
[ ] no secrets printed
```

---

## Hard blockers remaining for Stage B / Phase 2 PASS

1. **`NPM_TOKEN` GitHub secret** — absent
2. **`@dndgem` npm scope ownership / publish permission** — unverified
3. **External feedback path** — private Issues insufficient
4. **Public playground hosting** — or explicit npm-only acceptance
5. **Repository visibility decision** — user approval if changing

Items 1–2 block **publication**. Items 3–5 block **Phase 2 PASS** unless explicitly waived/decided by the user.
