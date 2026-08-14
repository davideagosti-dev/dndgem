# Architecture Overview

DnDGem (by FinGem-AI) is a content-aware adaptive layout engine for draggable/resizable interfaces.

## Product thesis

```text
Content Constraints
+ Layout Validity
+ Deterministic Adaptive Solver
+ Responsive Reflow
```

Executable Core distinction (DND-1.3):

```text
GEOMETRICALLY FITS  ≠  CONTENT REMAINS USEFUL
```

## Current status

- Technical MVP (Phase 1, DND-1.1 → DND-1.8) is **CLOSED**.
- Active phase: **Phase 2 — Public Alpha Readiness** (`docs/roadmap.md`).
- Monorepo, packages, quality gates, docs, and boundaries exist (DND-1.1).
- `@dndgem/core` defines renderer-agnostic domain types and content constraints (DND-1.2).
- `@dndgem/core` evaluates placements as `VALID` / `DEGRADED` / `INVALID` with deterministic scoring (DND-1.3).
- `@dndgem/core` selects layouts via `solveLayout` with bounded candidates, ranking, stability, and reflow metadata (DND-1.4).
- `@dndgem/dom` measures DOM geometry, normalizes it to Core types, and observes resize (DND-1.5).
- `@dndgem/dom` converts browser drag mechanics into `LayoutIntent` proposals and drop accept/reject via the Core solver (DND-1.6).
- `@dndgem/dom` `createLayoutSession` is the Vanilla integration entry; `@dndgem/react` is a thin lifecycle adapter over that session (DND-1.7).
- DND-1.8 adds reproducible Core benchmarks, an acceptance matrix, and a Technical MVP closure report.
- DND-2.1–DND-2.3 complete (engineering baseline, Alpha API/release infra, developer guides + CI promotion policy). **Next:** DND-2.4 Browser Matrix & Accessibility Baseline.

**Technical MVP:** CLOSED

Developer journey: [../guides/README.md](../guides/README.md).
See [alpha-api-contract.md](./alpha-api-contract.md) for the Alpha public surface and stability policy.
See [core-domain.md](./core-domain.md) for domain, scoring, and solver semantics.
See [dom-adapter.md](./dom-adapter.md) for DOM measurement, resize observation (ADR-0011), drag interaction (ADR-0012), and layout application (ADR-0013).
See [release-strategy.md](./release-strategy.md) for Alpha versioning and the controlled publish path.
See [../technical-mvp/closure-report.md](../technical-mvp/closure-report.md) for closure evidence.

## Package graph

```text
@dndgem/core
     ▲
     │
@dndgem/dom
     ▲
     │
@dndgem/react
```

Consumers (playground/examples) use public package exports only.

## Non-goals for Phase 2 critical path

- Deterministic Auto-Layout product (Phase 3)
- AI inference (Phase 4)
- Billing / cloud SaaS
- Vue / Angular / Svelte / Flutter implementations
- Custom native DnD engine

See ADRs under `docs/adr/` for approved decisions.
