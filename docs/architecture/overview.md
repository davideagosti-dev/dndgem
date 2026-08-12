# Architecture Overview

DnDGem (by FinGem-AI) is a content-aware adaptive layout engine for draggable/resizable interfaces.

## Product thesis (planned)

```text
Content Constraints
+ Layout Validity
+ Deterministic Adaptive Solver
+ Responsive Reflow
```

## Current status (DND-1.1)

Engineering baseline only:

- Monorepo, packages, quality gates, docs, and boundaries exist.
- No constraint model, solver, measurement, or DnD behaviour yet.

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
