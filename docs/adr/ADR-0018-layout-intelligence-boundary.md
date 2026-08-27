# ADR-0018: Layout Intelligence Boundary & Provider-Neutral Planning

- **Status:** Accepted (contract DND-4.1; planner implementation deferred to DND-4.2+)
- **Date:** 2026-08-27
- **Sprint:** DND-4.1

## Context

Phase 3 delivered deterministic Adaptive Auto-Layout as an enricher that proposes placement geometry while leaving `solveLayout` / `evaluateLayout` as the only selection and validity authority ([ADR-0014](./ADR-0014-auto-layout-enrichment-provenance.md)).

Phase 4 must address a different problem: higher-level structural, semantic, or application intent over already-plausible layouts. The repository baseline at DND-4.1 start is:

- Phase 3 COMPLETE / RELEASED (`0.1.0-alpha.1`)
- Framework Expansion COMPLETE (`0.1.0-alpha.3` / `@alpha`)
- Six public packages: `@dndgem/core`, `@dndgem/dom`, `@dndgem/react`, `@dndgem/vue`, `@dndgem/angular`, `@dndgem/svelte`
- No intelligence package present
- Core explicitly forbids AI dependencies in package-boundary policy
- Framework adapters are thin siblings over `@dndgem/dom` and must not become AI extension points

Without a contract, Phase 4 risks becoming a second solver, a provider lock-in, a Core purity regression, or a mandatory LLM dependency.

## Decision

1. **Role of intelligence:** Optional advisory planning only. Intelligence proposes; deterministic DnDGem validates and resolves.
2. **Authority:** Existing `solveLayout` → `evaluateLayout` remain the only authority for geometric validity, VALID / DEGRADED / INVALID, scoring, and final `ResolvedLayout`.
3. **Package placement:** Prefer a future **optional intelligence layer depending on Core** (Option B). Approve **consumer-owned planners** as an escape hatch (Option C). Reject intelligence-inside-Core as the default (Option A).
4. **No package in DND-4.1:** Do not create `@dndgem/intelligence` or any production intelligence package in this sprint. The name `@dndgem/intelligence` is provisional and **not** approved public API. Legacy `@dndgem/ai` remains forbidden.
5. **Taxonomy:** Distinguish deterministic placement, heuristic optimization, AI-assisted planning, and model-based intelligence. Phase 4 does **not** mean DnDGem requires an LLM. DND-4.2 targets a deterministic/heuristic planner first.
6. **Provider neutrality:** No specific external AI provider is an architectural dependency of DND-4.1. Remote model use is optional and deferred to evidence-driven experimentation.
7. **Trust boundary:** Planning Proposals are UNTRUSTED / ADVISORY until schema validation, semantic validation, and normalization/filtering succeed. Fail closed to deterministic fallback.
8. **Provenance:** Preserve Phase 3 Source Intent / Generated Placement / Previous Layout / Effective Solver Input distinctions. Intelligence does not silently invent a new placement origin in DND-4.1.
9. **Lifecycle:** Planning may occur on deliberate/idle/application-triggered paths. Model/network planning must not occur on pointermove, drag preview, rAF hot loops, ResizeObserver synchronous paths, measurement primitives, or every solve.
10. **Privacy & accessibility:** Default payloads are structural/serializable. No default external transmission of DOM/HTML/text/form/images/ARIA/credentials. Intelligence must not automatically redefine DOM/read/tab/ARIA semantics.
11. **Replay:** Captured Planning Proposals must yield deterministic downstream DnDGem resolution even if the originating planner was non-deterministic.
12. **Maturity:** Deterministic DnDGem may progress toward Beta independently of model-based intelligence. Intelligence surfaces may remain experimental/Alpha/separately matured.
13. **Framework adapters:** Remain thin. No React/Vue/Angular/Svelte-specific intelligence semantics.

## Consequences

- DND-4.2 may implement a deterministic local planner behind the contract without selecting a cloud provider.
- Optional package creation, if needed, is a later explicit decision and must preserve Core purity and offline defaults.
- Consumer-supplied planners are welcome if they emit contract-shaped Planning Proposals and accept the trust boundary.
- Solver, validity, scoring, and Phase 3 provenance semantics are not opened by this ADR.
- Provider selection, prompt engineering, and network integration remain out of DND-4.1 and are not prerequisites for deterministic intelligence.

See [layout-intelligence-contract.md](../architecture/layout-intelligence-contract.md) and [phase-4-planning-audit.md](../architecture/phase-4-planning-audit.md).
