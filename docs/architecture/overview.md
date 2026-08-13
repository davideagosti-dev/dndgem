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

## Current status (DND-1.6)

- Monorepo, packages, quality gates, docs, and boundaries exist (DND-1.1).
- `@dndgem/core` defines renderer-agnostic domain types and content constraints (DND-1.2).
- `@dndgem/core` evaluates placements as `VALID` / `DEGRADED` / `INVALID` with deterministic scoring (DND-1.3).
- `@dndgem/core` selects layouts via `solveLayout` with bounded candidates, ranking, stability, and reflow metadata (DND-1.4).
- `@dndgem/dom` measures DOM geometry, normalizes it to Core types, and observes resize (DND-1.5).
- `@dndgem/dom` converts browser drag mechanics into `LayoutIntent` proposals and drop accept/reject via the Core solver (DND-1.6).
- React/vanilla product bindings remain DND-1.7.

See [core-domain.md](./core-domain.md) for domain, scoring, and solver semantics.
See [dom-adapter.md](./dom-adapter.md) for DOM measurement, resize observation (ADR-0011), and drag interaction (ADR-0012).

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

## Non-goals for Phase 1 critical path

- AI inference
- Billing / cloud SaaS
- Vue / Angular / Svelte / Flutter implementations
- Custom native DnD engine

See ADRs under `docs/adr/` for approved decisions.
