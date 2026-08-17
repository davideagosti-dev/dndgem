# Testing Strategy

## Layers

| Layer          | Tool                                      | Scope                                                                                                                  | Timing                                                                            |
| -------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Unit           | Vitest                                    | Core domain/solver; DOM measurement with mocked geometry / fake `ResizeObserver`; drag interaction with fake mechanics | DND-1.1+                                                                          |
| Package smoke  | Vitest                                    | Public export / workspace link checks                                                                                  | DND-1.1                                                                           |
| Browser / E2E  | Playwright                                | Playground boot; drag fixture; Vanilla + React + Vue + Angular integration; a11y baseline                              | Chromium + Firefox + WebKit (DND-2.4; Vue smoke DND-FX.2; Angular smoke DND-FX.3) |
| Property-based | Table-driven Vitest (fast-check deferred) | Validity / solver invariants                                                                                           | DND-1.3 table-driven; library TBD                                                 |
| Benchmarks     | Vitest bench + stats collector            | Core `solveLayout` perf (hardware-dependent); semantics gated in CI                                                    | DND-1.8+                                                                          |
| Docs links     | `pnpm check:docs-links`                   | Relative markdown link integrity for guides / entry docs                                                               | DND-2.3+                                                                          |

## Quality gates (Phase 2 / DND-2.3+)

Quality responsibility is split on purpose:

```text
Feature Sprint Gate
→ full LOCAL quality gate (mandatory)

Develop Integration
→ feature merged to develop WITHOUT GitHub CI requirement

Master Promotion Gate
→ full GITHUB CI on develop → master PR (mandatory)

Release Workflow
→ reusable CI via workflow_call (publish pipeline)
```

Absolute hardware-specific benchmark timings remain non-blocking.

### Sprint Final Quality Gate (local, mandatory)

Before a feature sprint is complete and before final commit/push to the feature branch:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm check:boundaries
pnpm test
pnpm build
pnpm test:pack
pnpm check:docs-links
pnpm --filter @dndgem/playground build
pnpm --filter @dndgem/example-react build
pnpm --filter @dndgem/example-vanilla build
pnpm --filter @dndgem/example-vue build
pnpm --filter @dndgem/example-angular build
pnpm test:e2e
pnpm bench:core:semantics
pnpm check:publish-workflow
```

`pnpm test:e2e` is the Alpha browser matrix (Chromium, Firefox, WebKit). Optional: `pnpm test:e2e:chromium` for a faster local Chromium-only loop. Install browsers with `pnpm test:e2e:install`.

Full local `pnpm bench` (including timings/stats capture) remains useful evidence but absolute wall-clock thresholds are not hard failures.

### GitHub CI — promotion only

Workflow: `.github/workflows/ci.yml`

**Runs automatically for:**

- `pull_request` with **base `master`** and **head `develop`** (promotion path)
- `workflow_call` (publish workflow)
- `workflow_dispatch` (manual)

**Does not run automatically for:**

- feature branch push
- feature → develop PR
- develop push
- ordinary feature development

Jobs (unchanged substance from DND-2.1):

1. **promote-gate** — on `pull_request` only; fails if head ≠ `develop`
2. **quality** — install, `format:check`, lint, typecheck, `check:boundaries`, tests, build, `test:pack`, playground + example builds, `check:docs-links`, `bench:core:semantics`
3. **browser-e2e** — Playwright Alpha matrix (`pnpm test:e2e` after installing Chromium, Firefox, and WebKit). Job name remains `browser-e2e` for stable branch-protection matching.

`bench:core:semantics` validates fixture determinism and stats helpers. It does **not** enforce historical Ryzen median latencies and does **not** overwrite `benchmarks/results/technical-mvp.json` (that write path is `pnpm bench:core:stats`, local only).

### Branch protection (GitHub settings outside the repo)

Recommended remote settings (maintainers configure in GitHub; not applied by this repository alone):

| Branch    | Required checks                                          | Notes                                          |
| --------- | -------------------------------------------------------- | ---------------------------------------------- |
| `develop` | none for full CI                                         | Local Sprint Final Quality Gate is the gate    |
| `master`  | `quality`, `browser-e2e` (and optionally `promote-gate`) | Only develop → master should pass promote-gate |

## Property-based testing

DND-1.3 uses comprehensive table-driven Vitest cases for validity boundaries. A dedicated property-testing library (e.g. `fast-check`) remains deferred until solver search space testing justifies the dependency.

## Rules

- Do not write elaborate product tests before product logic exists.
- Prefer deterministic fixtures and reproducible benchmarks (`pnpm bench`; see `benchmarks/README.md`).
- Do not declare a feature sprint complete without a passing **local** Sprint Final Quality Gate.
- Do not require GitHub CI on feature → develop.
- Do not merge develop → master without green promotion CI.
