# Benchmarks

Infrastructure for future DnDGem performance measurement.

## Status (DND-1.1)

- Directory and conventions established.
- No solver benchmarks yet (solver lands in DND-1.4).
- No fabricated performance claims.

## Planned usage

| Sprint  | Focus                                    |
| ------- | ---------------------------------------- |
| DND-1.4 | Adaptive solver micro-benchmarks         |
| DND-1.8 | End-to-end Technical MVP benchmark suite |

## Convention

```text
benchmarks/
  README.md                 # this file
  suites/                   # future named suites
  fixtures/                 # future layout fixtures
```

## Runner strategy

- Prefer Vitest bench (or a dedicated bench runner) for pure TypeScript core suites.
- Prefer Playwright/browser timing only when DOM measurement is in scope (DND-1.5+).
- Record methodology, hardware notes, and schemaVersion of fixtures when results exist.

## Rules

- Do not invent FPS / solve-time / widget-count claims before measurements exist.
- Benchmarks must be reproducible and versioned with the code under test.
