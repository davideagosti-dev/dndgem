# Testing Strategy

## Layers

| Layer          | Tool                                      | Scope                                                                                                                  | Timing                                  |
| -------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Unit           | Vitest                                    | Core domain/solver; DOM measurement with mocked geometry / fake `ResizeObserver`; drag interaction with fake mechanics | DND-1.1+                                |
| Package smoke  | Vitest                                    | Public export / workspace link checks                                                                                  | DND-1.1                                 |
| Browser / E2E  | Playwright                                | Playground boot; drag fixture; Vanilla + React integration proofs                                                      | Chromium now; Firefox/WebKit in DND-2.4 |
| Property-based | Table-driven Vitest (fast-check deferred) | Validity / solver invariants                                                                                           | DND-1.3 table-driven; library TBD       |
| Benchmarks     | Vitest bench + stats collector            | Core `solveLayout` perf (hardware-dependent); semantics gated in CI                                                    | DND-1.8+                                |

## Quality gates (Phase 2 / DND-2.1+)

GitHub CI and the local Sprint Final Quality Gate are **materially aligned**. Absolute hardware-specific benchmark timings remain non-blocking.

### GitHub CI

GitHub Actions (`.github/workflows/ci.yml`) runs the authoritative merge safety gate:

1. **quality** — install, `format:check`, lint, typecheck, `check:boundaries`, unit/integration tests, build, playground + example builds, `bench:core:semantics`
2. **browser-e2e** — Chromium Playwright (`pnpm test:e2e`) after packages build

`bench:core:semantics` validates fixture determinism and stats helpers. It does **not** enforce historical Ryzen median latencies and does **not** overwrite `benchmarks/results/technical-mvp.json` (that write path is `pnpm bench:core:stats`, local only).

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
pnpm bench
```

Benchmarks (`pnpm bench`) must execute and pass semantic checks. Absolute wall-clock thresholds are not hard failures.

## Property-based testing

DND-1.3 uses comprehensive table-driven Vitest cases for validity boundaries. A dedicated property-testing library (e.g. `fast-check`) remains deferred until solver search space testing justifies the dependency.

## Rules

- Do not write elaborate product tests before product logic exists.
- Prefer deterministic fixtures and reproducible benchmarks (`pnpm bench`; see `benchmarks/README.md`).
- Do not declare a sprint complete without a passing local Sprint Final Quality Gate and green GitHub CI on the feature branch.
