# Benchmarks

Reproducible Core solver and Auto-Layout proposal performance measurement for DnDGem.

## Status

- Deterministic Core solver fixtures and Vitest bench suites (DND-1.8) are implemented.
- DND-3.2 adds Auto-Layout proposal + solve fixtures (INTERNAL module + public `solveLayout`).
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

| Script                      | Purpose                                                                   |
| --------------------------- | ------------------------------------------------------------------------- |
| `pnpm bench:core:check`     | Full local semantic suite (`*.test.ts`, including stats writers)          |
| `pnpm bench:core:semantics` | CI-safe semantics only (solver + Auto-Layout + stats.unit; no JSON write) |
| `pnpm bench:core:timing`    | Vitest bench (Tinybench) timing table                                     |
| `pnpm bench:core:stats`     | Median / p95 collector → `benchmarks/results/*.json`                      |

`pnpm bench` / `pnpm bench:core` runs build → check → timing → stats.

## Layout

```text
benchmarks/
  README.md
  vitest.config.ts          # semantic + stats tests
  vitest.bench.config.ts    # vitest bench mode
  core/
    fixtures.ts             # deterministic heterogeneous solver scenarios
    auto-layout-fixtures.ts # DND-3.2 proposal + solve scenarios
    semantic.test.ts
    auto-layout.semantic.test.ts
    stats.test.ts
    auto-layout.stats.test.ts
    solver.bench.ts
    auto-layout.bench.ts
  results/
    technical-mvp.json          # solver baseline from last stats run
    auto-layout-dnd-3.2.json    # Auto-Layout baseline from last stats run
```

## Build mode

Benchmarks import **`packages/core/dist`** (compiled package output), not TypeScript sources.
Auto-Layout benches import the compiled **INTERNAL** `dist/auto-layout.js` module (not a package-root export).

## Methodology

- Fixtures: static / deterministic (no `Math.random`).
- Solver timings: each iteration rebuilds `SolverInput` then calls `solveLayout`.
- Auto-Layout timings: each iteration rebuilds `LayoutIntent` then `createAutoLayoutProposal` + `solveLayout`.
- Warm-up iterations are discarded before samples.
- Stats report: 25 warm-up + 200 timed iterations; median and p95 in milliseconds.
- Candidate sets remain bounded (≤ 8) regardless of item count.
- Auto-Layout probe sets remain bounded (`1 + 2·k` per placement step).

## CI policy

Phase 2 (DND-2.1+) GitHub CI runs `pnpm bench:core:semantics` (fixture determinism + stats helpers). Absolute timing thresholds are **not** hard CI failures. Stats collectors that overwrite `benchmarks/results/*.json` remain **local** (`pnpm bench:core:stats` / full `pnpm bench`).

## Rules

- Do not invent competitive or marketing performance claims.
- Do not put benchmark APIs into package public exports.
- Keep benchmark tooling as root/dev usage only (Vitest already present).
- Re-run `pnpm bench:core:stats` before freezing documentation numbers if Core changes.

Human-readable interpretation:

- Solver: `docs/benchmarks/technical-mvp-baseline.md`
- Auto-Layout: `docs/benchmarks/auto-layout-dnd-3.2.md`
