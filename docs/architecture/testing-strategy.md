# Testing Strategy

## Layers

| Layer          | Tool                                      | Scope                                    | Phase 1 timing                            |
| -------------- | ----------------------------------------- | ---------------------------------------- | ----------------------------------------- |
| Unit           | Vitest                                    | Pure TS packages (`core`, later solvers) | DND-1.1+                                  |
| Package smoke  | Vitest                                    | Public export / workspace link checks    | DND-1.1                                   |
| Browser / E2E  | Playwright                                | DOM, drag, resize, React, cross-browser  | smoke now; product later                  |
| Property-based | Table-driven Vitest (fast-check deferred) | Validity / solver invariants             | DND-1.3 table-driven; library TBD for 1.4 |
| Benchmarks     | Vitest bench / dedicated suites           | Solver & MVP perf                        | DND-1.4 / DND-1.8                         |

## Quality gates (private Technical MVP)

During the **private Technical MVP**, automated GitHub CI and the sprint Definition of Done are split on purpose. This does **not** weaken the Definition of Done — only where the full gate runs.

### GitHub CI

GitHub Actions (`.github/workflows/ci.yml`) runs **browser smoke only** (`pnpm test:e2e`, plus install/build/Playwright prerequisites required for that smoke).

### Sprint Final Quality Gate (local, mandatory)

Before a sprint is considered complete and before final commit/push, the full gate must pass **locally**:

```bash
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm build
pnpm check:boundaries
pnpm --filter @dndgem/playground build
pnpm --filter @dndgem/example-react build
pnpm --filter @dndgem/example-vanilla build
pnpm test:e2e
```

### Public Alpha note

This split is a **private Technical MVP policy**. CI may be strengthened again before Public Alpha / external contributions. Do not treat smoke-only GitHub CI as the long-term open-source contribution bar.

## Property-based testing

DND-1.3 uses comprehensive table-driven Vitest cases for validity boundaries. A dedicated property-testing library (e.g. `fast-check`) remains deferred until solver search space testing in DND-1.4 justifies the dependency.

## Rules

- Do not write elaborate product tests before product logic exists.
- Prefer deterministic fixtures and reproducible benchmarks.
- Browser smoke in DND-1.1 only proves playground bootstrapping.
- Do not declare a sprint complete without a passing local Sprint Final Quality Gate.
