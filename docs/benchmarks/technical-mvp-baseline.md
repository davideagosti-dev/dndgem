# Technical MVP Core Solver Baseline

- **Sprint:** DND-1.8
- **Captured:** 2026-08-13
- **Repository baseline (branch point / develop at capture):** `06e3874d3aef7c56f8faa492595b1a72334b0335` (`06e3874`)
- **Measurement context:** benchmarks executed on the DND-1.8 working tree based on baseline `06e3874` (not a claim that timings belong to that commit’s tree alone)
- **Post-merge note (DND-2.1):** Technical MVP later landed on `develop` at `26ccb40` and `master` at `61719e6`. Capture SHAs remain historical; do not reinterpret medians as measured on those merge commits.
- **Machine-readable:** `benchmarks/results/technical-mvp.json`

## Environment

| Field          | Value                                                  |
| -------------- | ------------------------------------------------------ |
| Node           | v24.14.1                                               |
| Platform       | win32                                                  |
| Architecture   | x64                                                    |
| CPU            | AMD Ryzen 9 6900HX with Radeon Graphics                |
| Benchmark tool | Vitest 3.2.7 (`vitest bench` + custom stats collector) |
| Build mode     | `packages/core/dist` (compiled `@dndgem/core`)         |

These numbers are **not** portable across machines. Re-run `pnpm bench` locally to reproduce on your hardware.

## Methodology

- Warm-up: 25 discarded solves per scenario
- Timed iterations: 200
- Each iteration rebuilds deterministic fixtures, then calls `solveLayout`
- Metrics: median ms, p95 ms (via `performance.now()`)
- Semantic wrongness fails the command before timings are trusted

## Scenarios

| ID                 | Items | Density     | Operation               | Expected                |
| ------------------ | ----- | ----------- | ----------------------- | ----------------------- |
| `valid-small-6`    | 6     | moderate    | initial (already valid) | VALID, not reflowed     |
| `reflow-medium-16` | 16    | moderate    | passive wide→narrow     | VALID, reflowed         |
| `explicit-move-8`  | 8     | moderate    | explicit desired move   | VALID                   |
| `unsat-4`          | 4     | constrained | impossible mins         | INVALID / UNSATISFIABLE |
| `scale-small-6`    | 6     | light       | initial                 | VALID                   |
| `scale-medium-16`  | 16    | moderate    | initial                 | VALID                   |
| `scale-large-40`   | 40    | moderate    | initial                 | VALID                   |
| `constrained-12`   | 12    | constrained | initial                 | VALID                   |

Fixtures use heterogeneous `min*` / `minUseful*` / `preferred*` profiles (chart / table / details / metric cycle).

## Measured results

Final checked-in capture (local machine; wall-clock varies slightly between runs):

| Scenario         | Items | State   | Candidates | Median (ms) | p95 (ms) |
| ---------------- | ----- | ------- | ---------- | ----------- | -------- |
| valid-small-6    | 6     | VALID   | 7          | 0.0691      | 0.1405   |
| reflow-medium-16 | 16    | VALID   | 7          | 0.1227      | 0.2698   |
| explicit-move-8  | 8     | VALID   | 8          | 0.0678      | 0.0939   |
| unsat-4          | 4     | INVALID | 6          | 0.0292      | 0.0521   |
| scale-small-6    | 6     | VALID   | 6          | 0.0377      | 0.0593   |
| scale-medium-16  | 16    | VALID   | 6          | 0.0969      | 0.1358   |
| scale-large-40   | 40    | VALID   | 6          | 0.2790      | 0.4589   |
| constrained-12   | 12    | VALID   | 6          | 0.0802      | 0.1187   |

Across consecutive local runs, medians stayed in the same order of magnitude (roughly 0.03–0.30 ms for these scenarios). Do not treat a single run as a universal latency guarantee.

## Scaling (empirical)

Observed median solve time on this machine:

- 6 items (light): ~0.038 ms
- 16 items (moderate): ~0.097 ms
- 40 items (moderate): ~0.279 ms

Candidate generation is **bounded by design** (preserve* + fixed pack strategies → ≤ 8 candidates). That is distinct from claiming total solver complexity is constant: packing/evaluation work still grows with item count. Solve time rose with item count roughly in line with that work — **not** a combinatorial explosion in this envelope. No Big-O claim is made beyond that empirical observation.

## Interpretation

| Question                      | Answer                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------- |
| What is measured?             | Pure Core `solveLayout` on compiled package output                                |
| Why representative?           | Heterogeneous dashboard-like constraints; valid / reflow / explicit / unsat paths |
| Observed?                     | Sub-millisecond median solves through 40 items on this CPU                        |
| Acceptable for Technical MVP? | **Yes** for dashboard-scale layouts (tens of items)                               |
| Not proven?                   | Hundreds/thousands of items; browser paint FPS; cross-library comparisons         |

## Performance verdict

**PASS WITH LIMITATIONS**

Suitable for the intended Technical MVP operating envelope (dashboard-scale adaptive layouts). Scaling beyond the measured range is **deferred**, not hidden. Absolute timings will differ on other hardware.

## Limitations

- Hardware-dependent wall clock
- Core-only (DOM/React overhead not benchmarked as primary evidence)
- No competitive library comparison (out of scope)
- Vitest bench mode is experimental; stats JSON is the durable numeric artifact
