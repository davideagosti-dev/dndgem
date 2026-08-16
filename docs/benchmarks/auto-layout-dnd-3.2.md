# Auto-Layout Core Baseline (DND-3.2)

- **Sprint:** DND-3.2
- **Measurement:** local proposal + `solveLayout` via `pnpm bench:core`
- **Machine-readable:** `benchmarks/results/auto-layout-dnd-3.2.json`
- **Caveat:** Absolute timings are **hardware-dependent local evidence**, not SLA or CI thresholds.

## What was measured

Each iteration rebuilds a deterministic `LayoutIntent`, then runs:

```text
createAutoLayoutProposal (PUBLIC ALPHA minimal — was INTERNAL at DND-3.2 baseline)
        →
solveLayout (public)
```

Scenarios:

| ID                     | Items | Semantics                                                  | Expected                                       |
| ---------------------- | ----: | ---------------------------------------------------------- | ---------------------------------------------- |
| `auto-small`           |     6 | fully automatic                                            | VALID                                          |
| `auto-medium`          |    16 | fully automatic                                            | VALID                                          |
| `auto-dense`           |    24 | fully automatic                                            | VALID                                          |
| `hybrid-explicit-auto` |     8 | mixed source + generated                                   | VALID                                          |
| `constrained-auto`     |    12 | constrained automatic                                      | VALID                                          |
| `unsat-auto`           |     4 | impossible hard mins                                       | INVALID (constraint-unsat)                     |
| `spatial-nofit`        |     2 | individually feasible; no non-overlapping Auto-Layout room | proposal incomplete (`unplaced`); no fake rect |

## Measured results (local evidence)

Captured 2026-08-16 on win32/x64 Node v24.14.1. Absolute timings are **not SLA**.

| Scenario             | Items | State   | Generated | Unplaced | Median (ms) | p95 (ms) |
| -------------------- | ----: | ------- | --------: | -------: | ----------: | -------: |
| auto-small           |     6 | VALID   |         6 |        0 |       0.084 |    0.235 |
| auto-medium          |    16 | VALID   |        16 |        0 |       0.170 |    0.365 |
| auto-dense           |    24 | VALID   |        24 |        0 |       0.214 |    0.417 |
| hybrid-explicit-auto |     8 | VALID   |         6 |        0 |       0.067 |    0.127 |
| constrained-auto     |    12 | VALID   |        12 |        0 |       0.122 |    0.304 |
| unsat-auto           |     4 | INVALID |         1 |        3 |       0.038 |    0.078 |
| spatial-nofit        |     2 | VALID\* |         0 |        1 |       0.021 |    0.045 |

\*Solver may still pack independently; Auto-Layout signal is `unplacedItemIds`, not a parallel validity state.

Qualitative: small → medium → dense scales without combinatorial explosion; constraint-unsat and spatial no-fit terminate; spatial no-fit fabricates no overlapping geometry.
