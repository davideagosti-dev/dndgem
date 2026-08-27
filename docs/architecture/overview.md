# Architecture Overview

DnDGem (by DA62) is a content-aware adaptive layout engine for draggable/resizable interfaces.

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
- Phase 2 — Public Alpha Readiness is **PASS** / Public Alpha **LIVE**. Official channel: **`0.1.0-alpha.3` / `@alpha`** (Phase 3 Auto-Layout was `0.1.0-alpha.1`; first Alpha was `0.1.0-alpha.0`; `0.1.0-alpha.2` is superseded).
- **Phase 3 — Adaptive Auto-Layout** is **COMPLETE / RELEASED** (`0.1.0-alpha.1` / `@alpha`). Planning audit **PASSED WITH ARCHITECTURAL REFINEMENTS**. DND-3.1–DND-3.5 COMPLETE. Minimal public `createAutoLayoutProposal` + session/provider `autoLayout` ([auto-layout-engine.md](./auto-layout-engine.md)). Release notes: [0.1.0-alpha.1](../releases/0.1.0-alpha.1.md).
- **Framework Expansion Gate** is **COMPLETE** (unnumbered; **not** Phase 4). **DND-FX.1–FX.6 COMPLETE.** Valid public Alpha: **`0.1.0-alpha.3` / `@alpha`**. See [framework-expansion-planning-audit.md](./framework-expansion-planning-audit.md), [framework-adapter-contract.md](./framework-adapter-contract.md).
- **Phase 4 — AI-Assisted Layout Intelligence** is **ACTIVE**. **DND-4.1 COMPLETE** (contract only). Does **not** require an LLM. See [phase-4-planning-audit.md](./phase-4-planning-audit.md), [layout-intelligence-contract.md](./layout-intelligence-contract.md), [ADR-0018](../adr/ADR-0018-layout-intelligence-boundary.md).
- Monorepo, packages, quality gates, docs, and boundaries exist (DND-1.1).
- `@dndgem/core` defines renderer-agnostic domain types and content constraints (DND-1.2).
- `@dndgem/core` evaluates placements as `VALID` / `DEGRADED` / `INVALID` with deterministic scoring (DND-1.3).
- `@dndgem/core` selects layouts via `solveLayout` with bounded candidates, ranking, stability, and reflow metadata (DND-1.4).
- `@dndgem/dom` measures DOM geometry, normalizes it to Core types, and observes resize (DND-1.5).
- `@dndgem/dom` converts browser drag mechanics into `LayoutIntent` proposals and drop accept/reject via the Core solver (DND-1.6).
- `@dndgem/dom` `createLayoutSession` is the Vanilla integration entry; `@dndgem/react` is a thin lifecycle adapter over that session (DND-1.7).
- DND-1.8 adds reproducible Core benchmarks, an acceptance matrix, and a Technical MVP closure report.
- DND-2.1–DND-2.5 complete (engineering baseline through Public Alpha release gate, plus post-release DA62 / `dndgem.dev` follow-ups).

**Technical MVP:** CLOSED · **Public Alpha:** LIVE (`0.1.0-alpha.3` / `@alpha`) · **Phase 3:** COMPLETE / RELEASED · **Framework Expansion:** COMPLETE (DND-FX.1–FX.6) · **Phase 4:** ACTIVE (DND-4.1 contract COMPLETE)

Developer journey: [../guides/README.md](../guides/README.md).
See [auto-layout-contract.md](./auto-layout-contract.md) for the Phase 3 Auto-Layout contract (DND-3.1).
See [auto-layout-engine.md](./auto-layout-engine.md) for the Core placement + stability/reflow engine and DND-3.4 consumer wiring.
See [phase-3-planning-audit.md](./phase-3-planning-audit.md) for the approved Phase 3 sprint map and binding refinements.
See [framework-expansion-planning-audit.md](./framework-expansion-planning-audit.md) and [framework-adapter-contract.md](./framework-adapter-contract.md) for the JS/DOM adapter gate (DND-FX).
See [phase-4-planning-audit.md](./phase-4-planning-audit.md) and [layout-intelligence-contract.md](./layout-intelligence-contract.md) for Phase 4 intelligence boundary (DND-4.1).
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
@dndgem/react   ·   @dndgem/vue   ·   @dndgem/angular   ·   @dndgem/svelte
```

Consumers (playground/examples/compat fixtures) use public package exports only. Next.js / Nuxt / SvelteKit fixtures consume `@dndgem/react` / `@dndgem/vue` / `@dndgem/svelte` respectively — they are not adapter packages.

## Non-goals for Phase 2 critical path

- Deterministic Auto-Layout product (Phase 3 — **RELEASED** in `0.1.0-alpha.1`)
- AI inference / layout intelligence (Phase 4 — **ACTIVE** at DND-4.1 contract; no production intelligence yet)
- Billing / cloud SaaS
- Vue / Angular / Svelte implementations (Framework Expansion Gate — **COMPLETE**; published `0.1.0-alpha.3`)
- Flutter implementation (separate track)
- Custom native DnD engine

See ADRs under `docs/adr/` for approved decisions.
