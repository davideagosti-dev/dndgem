# Benchmarks

Reproducible Core solver performance measurement for DnDGem Technical MVP (DND-1.8).

## Status

- Deterministic Core fixtures and Vitest bench suites are implemented.
- Absolute wall-clock numbers are **hardware-dependent evidence**, not universal claims.
- Correctness of fixtures is a hard gate; absolute timing is reported, not CI-threshold gated.

## Commands

From the repository root (requires Node 20+ and a built `@dndgem/core`):

```bash
pnpm install
pnpm bench
# equivalent focused path:
pnpm bench:core
```

Breakdown:

| Script                   | Purpose                                                          |
| ------------------------ | ---------------------------------------------------------------- |
| `pnpm bench:core:check`  | Semantic gates + fixture determinism (`*.test.ts`)               |
| `pnpm bench:core:timing` | Vitest bench (Tinybench) timing table                            |
| `pnpm bench:core:stats`  | Median / p95 collector → `benchmarks/results/technical-mvp.json` |

`pnpm bench` / `pnpm bench:core` runs build → check → timing → stats.

## Layout

```text
benchmarks/
  README.md
  vitest.config.ts          # semantic + stats tests
  vitest.bench.config.ts    # vitest bench mode
  core/
    fixtures.ts             # deterministic heterogeneous scenarios
    semantic.test.ts
    stats.test.ts
    solver.bench.ts
  results/
    technical-mvp.json      # machine-readable baseline from last stats run
```

## Build mode

Benchmarks import **`packages/core/dist`** (compiled package output), not TypeScript sources.

## Methodology

- Fixtures: static / deterministic (no `Math.random`).
- Each timed iteration rebuilds `SolverInput` then calls `solveLayout`.
- Warm-up iterations are discarded before samples.
- Stats report: 25 warm-up + 200 timed iterations; median and p95 in milliseconds.
- Candidate sets remain bounded (≤ 8) regardless of item count.

## CI policy

GitHub CI remains **browser-smoke only** for the private Technical MVP.

Benchmarks are part of the **local Sprint Final Quality Gate** (`pnpm bench`) because they finish in seconds on typical developer hardware and prove the suite still executes. Absolute timing thresholds are **not** hard CI failures.

## Rules

- Do not invent competitive or marketing performance claims.
- Do not put benchmark APIs into package public exports.
- Keep benchmark tooling as root/dev usage only (Vitest already present).
- Re-run `pnpm bench:core:stats` before freezing documentation numbers if Core changes.

Human-readable interpretation: `docs/benchmarks/technical-mvp-baseline.md`.
