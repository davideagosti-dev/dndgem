# Auto-Layout Core Baseline (DND-3.3)

- **Sprint:** DND-3.3 (extends DND-3.2 fixtures)
- **Measurement:** local proposal + `solveLayout` via `pnpm bench:core`
- **Machine-readable:** `benchmarks/results/auto-layout-dnd-3.3.json`
- **Prior baseline:** `benchmarks/results/auto-layout-dnd-3.2.json` / [auto-layout-dnd-3.2.md](./auto-layout-dnd-3.2.md)
- **Caveat:** Absolute timings are **hardware-dependent local evidence**, not SLA or CI thresholds.

## What was measured

Each single-cycle iteration rebuilds a deterministic `LayoutIntent` (and optional `previous` `ResolvedLayout`), then runs:

```text
createAutoLayoutProposal (PUBLIC ALPHA minimal; may use previous for retention)
        →
solveLayout (public; may receive same previous for ADR-0010 ranking)
```

Sequence scenarios time multi-cycle propose→solve chains (resize / grow-shrink-grow) without DOM observers.

### Cold-start (DND-3.2) scenarios

| ID                     | Items | Semantics                                                  | Expected                                       |
| ---------------------- | ----: | ---------------------------------------------------------- | ---------------------------------------------- |
| `auto-small`           |     6 | fully automatic                                            | VALID                                          |
| `auto-medium`          |    16 | fully automatic                                            | VALID                                          |
| `auto-dense`           |    24 | fully automatic                                            | VALID                                          |
| `hybrid-explicit-auto` |     8 | mixed source + generated                                   | VALID                                          |
| `constrained-auto`     |    12 | constrained automatic                                      | VALID                                          |
| `unsat-auto`           |     4 | impossible hard mins                                       | INVALID (constraint-unsat)                     |
| `spatial-nofit`        |     2 | individually feasible; no non-overlapping Auto-Layout room | proposal incomplete (`unplaced`); no fake rect |

### Reflow (DND-3.3) scenarios

| ID                             | Items | Semantics                                     | Expected |
| ------------------------------ | ----: | --------------------------------------------- | -------- |
| `reflow-stable`                |     8 | retain feasible previous generated            | VALID    |
| `reflow-shrink`                |     6 | retain feasible; reflow/unplace displaced     | VALID    |
| `reflow-grow`                  |     6 | retain + room for recovery                    | VALID    |
| `reflow-hybrid`                |     8 | source + retained + reflowed generated        | VALID    |
| `reflow-source-insert`         |     4 | source wins over previous generated occupancy | VALID    |
| `reflow-unplaced-recovery`     |     2 | grow after no-fit → both generated            | VALID    |
| `reflow-size-change-stable`    |     1 | previous x/y + larger current size retained   | VALID    |
| `reflow-size-change-displaced` |     1 | resized previous x/y infeasible → Stage C     | VALID    |

### Sequences

| ID                            | Cycles | Semantics               |
| ----------------------------- | -----: | ----------------------- |
| `reflow-seq-resize`           |      2 | initial → resize reflow |
| `reflow-seq-grow-shrink-grow` |      4 | grow → shrink → grow    |

## Measured results (local evidence)

Captured 2026-08-16 on win32/x64 Node v24.14.1. Absolute timings are **not SLA**.

### Single-cycle

| Scenario                     | Items | Prev | State   | Generated | Unplaced | Median (ms) | p95 (ms) |
| ---------------------------- | ----: | ---- | ------- | --------: | -------: | ----------: | -------: |
| auto-small                   |     6 | no   | VALID   |         6 |        0 |       0.119 |    0.266 |
| auto-medium                  |    16 | no   | VALID   |        16 |        0 |       0.192 |    0.516 |
| auto-dense                   |    24 | no   | VALID   |        24 |        0 |       0.225 |    0.438 |
| hybrid-explicit-auto         |     8 | no   | VALID   |         6 |        0 |       0.069 |    0.142 |
| constrained-auto             |    12 | no   | VALID   |        12 |        0 |       0.122 |    0.266 |
| unsat-auto                   |     4 | no   | INVALID |         1 |        3 |       0.048 |    0.092 |
| spatial-nofit                |     2 | no   | VALID\* |         0 |        1 |       0.022 |    0.051 |
| reflow-stable                |     8 | yes  | VALID   |         8 |        0 |       0.076 |    0.160 |
| reflow-shrink                |     6 | yes  | VALID   |         6 |        0 |       0.054 |    0.102 |
| reflow-grow                  |     6 | yes  | VALID   |         6 |        0 |       0.053 |    0.089 |
| reflow-hybrid                |     8 | yes  | VALID   |         6 |        0 |       0.068 |    0.091 |
| reflow-source-insert         |     4 | yes  | VALID   |         3 |        0 |       0.037 |    0.060 |
| reflow-unplaced-recovery     |     2 | yes  | VALID   |         2 |        0 |       0.020 |    0.028 |
| reflow-size-change-stable    |     1 | yes  | VALID   |         1 |        0 |       0.015 |    0.026 |
| reflow-size-change-displaced |     1 | yes  | VALID   |         1 |        0 |       0.015 |    0.027 |

\*Solver may still pack independently; Auto-Layout signal is `unplacedItemIds`.

### Sequences

| Sequence                    | Cycles | Items | Final | Median (ms) | p95 (ms) |
| --------------------------- | -----: | ----: | ----- | ----------: | -------: |
| reflow-seq-resize           |      2 |     8 | VALID |       0.145 |    0.200 |
| reflow-seq-grow-shrink-grow |      4 |     6 | VALID |       0.227 |    0.276 |

Qualitative: reflow-stable is faster than cold auto-medium-scale packs when retention dominates; shrink/grow/hybrid/source-insert/unplaced-recovery terminate; sequences remain deterministic; no fabricated no-fit geometry.
