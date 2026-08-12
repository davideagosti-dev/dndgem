# Testing Strategy

## Layers

| Layer          | Tool                            | Scope                                    | Phase 1 timing           |
| -------------- | ------------------------------- | ---------------------------------------- | ------------------------ |
| Unit           | Vitest                          | Pure TS packages (`core`, later solvers) | DND-1.1+                 |
| Package smoke  | Vitest                          | Public export / workspace link checks    | DND-1.1                  |
| Browser / E2E  | Playwright                      | DOM, drag, resize, React, cross-browser  | smoke now; product later |
| Property-based | TBD                             | Solver / validity invariants             | DND-1.3 / DND-1.4        |
| Benchmarks     | Vitest bench / dedicated suites | Solver & MVP perf                        | DND-1.4 / DND-1.8        |

## Property-based testing

Deferred. Candidate library (e.g. `fast-check`) will be selected when validity/solver tests begin. Not installed in DND-1.1 solely for planning mentions.

## Rules

- Do not write elaborate product tests before product logic exists.
- Prefer deterministic fixtures and reproducible benchmarks.
- Browser smoke in DND-1.1 only proves playground bootstrapping.
