# Performance

Core solve latency evidence comes from the Technical MVP benchmark capture. Numbers are **hardware-specific** and are **not** universal product guarantees.

## Summary (historical local capture)

On the documented DND-1.8 measurement machine (AMD Ryzen 9 6900HX, Windows, Node as recorded in the baseline doc), dashboard-scale Core `solveLayout` medians were approximately:

| Envelope                        | Approx. median  |
| ------------------------------- | --------------- |
| Small / medium dashboard scenes | ~0.038–0.123 ms |
| Larger (~40 items) scenario     | ~0.279 ms       |

Full tables, methodology, and environment: [Technical MVP baseline](../benchmarks/technical-mvp-baseline.md) and `benchmarks/results/technical-mvp.json`.

## What CI enforces

- `pnpm bench:core:semantics` — fixture determinism / stats helpers
- **Not** absolute wall-clock thresholds

## Guidance

- Treat timings as evidence under a stated context
- Re-run `pnpm bench` on your hardware before drawing local conclusions
- Framework adapters must not change Core semantics to chase numbers
