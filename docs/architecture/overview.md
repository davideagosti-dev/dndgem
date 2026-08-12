# Architecture Overview

DnDGem (by FinGem-AI) is a content-aware adaptive layout engine for draggable/resizable interfaces.

## Product thesis (planned)

```text
Content Constraints
+ Layout Validity
+ Deterministic Adaptive Solver
+ Responsive Reflow
```

## Current status (DND-1.2)

- Monorepo, packages, quality gates, docs, and boundaries exist (DND-1.1).
- `@dndgem/core` defines renderer-agnostic domain types and content constraints (DND-1.2).
- Validity evaluation, scoring, solver, measurement, and DnD behaviour remain later sprints.

See [core-domain.md](./core-domain.md) for domain semantics.

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
