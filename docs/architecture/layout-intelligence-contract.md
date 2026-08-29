# Layout Intelligence Contract (DND-4.1)

Authoritative Phase 4 contract for optional layout intelligence planning.

**Status:** Contract COMPLETE — Phase 4 **COMPLETE WITH RELEASE PENDING** (DND-4.5)  
**Sprint:** DND-4.1 (contract) → DND-4.2 (deterministic planner) → DND-4.3 (optional integration) → DND-4.4 (optional model experiment) → DND-4.5 (decision gate) — all COMPLETE  
**Product:** DnDGem by DA62

Related: [phase-4-planning-audit.md](./phase-4-planning-audit.md), [ADR-0018](../adr/ADR-0018-layout-intelligence-boundary.md), [auto-layout-contract.md](./auto-layout-contract.md), [ADR-0014](../adr/ADR-0014-auto-layout-enrichment-provenance.md), [core-domain.md](./core-domain.md), [package-boundaries.md](./package-boundaries.md), [roadmap.md](../roadmap.md).

---

## 1. Scope

### What Phase 4 intelligence is

An **optional advisory planning layer** that proposes higher-level structural, semantic, or application-oriented layout strategies. Downstream deterministic DnDGem remains the only authority for geometric validity, scoring, and final resolution.

```text
Intelligence proposes.
Deterministic DnDGem validates and resolves.
```

### What Phase 4 intelligence is not

- Not a second solver
- Not a second scoring or validity engine
- Not a bypass for hard geometric constraints
- Not a mandatory LLM dependency
- Not framework-specific (React/Vue/Angular/Svelte/Vanilla) layout semantics
- Not automatic accessibility/DOM reordering
- Not default-on Alpha behavior
- Not a silent new placement origin that collapses Phase 3 provenance

### Explicit product statement

```text
Phase 4 AI-Assisted Layout Intelligence
does NOT mean
DnDGem requires an LLM.
```

### Sprint boundary

DND-4.1 defines this contract only. No production AI SDK, provider selection, network integration, new solver, or new production package lands in DND-4.1.

---

## 2. Taxonomy

| Term                         | Classification intent                                                                 | Preferred first home                                  |
| ---------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Deterministic placement**  | Existing Core geometry, constraints, Auto-Layout enricher, solver, validity           | `@dndgem/core` (existing)                             |
| **Heuristic optimization**   | Bounded deterministic planning/search that improves strategy without model inference  | Future optional intelligence layer (DND-4.2)          |
| **AI-assisted planning**     | Higher-level semantic/structural Planning Proposals behind a neutral planner boundary | Same optional layer / consumer planner                |
| **Model-based intelligence** | Local or remote ML/LLM inference                                                      | Optional provider behind the same boundary (DND-4.4+) |

Heuristic optimization is the preferred first implementation direction for DND-4.2. Model-based intelligence is optional and never treated as synonymous with Phase 4 itself.

---

## 3. Twelve invariants (binding)

| #       | Invariant                           | Contract statement                                                                                                                                                                                                                |
| ------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I1**  | Solver authority                    | `solveLayout` / `evaluateLayout` remain the only authority for geometric validity, VALID / DEGRADED / INVALID, scoring, and deterministic final resolution. Intelligence may propose but must not declare authoritative validity. |
| **I2**  | Hard constraints authoritative      | Intelligence must never bypass, weaken, reinterpret, or silently modify hard geometric constraints.                                                                                                                               |
| **I3**  | Intelligence optional               | Existing deterministic DnDGem must work unchanged when intelligence is absent. No network connection may be required for normal DnDGem functionality.                                                                             |
| **I4**  | No framework-specific intelligence  | Do not create separate intelligence semantics for React, Vue, Angular, Svelte, or Vanilla. Framework adapters remain thin integration layers.                                                                                     |
| **I5**  | Renderer-neutral contract           | No `HTMLElement`, `DOMRect`, `ReactNode`, Vue/Angular/Svelte component instances, `ResizeObserver`, or `PointerEvent` may become part of the planning contract.                                                                   |
| **I6**  | Preserve Phase 3 provenance         | Do not collapse Source Intent, Generated Placement, Previous Layout, or Effective Solver Input. Intelligence must not silently invent a new placement origin.                                                                     |
| **I7**  | No model inference in hot paths     | External/model inference must never be required from pointermove, drag preview frames, rAF layout loops, ResizeObserver synchronous paths, measurement primitives, or every `solveLayout` invocation.                             |
| **I8**  | Deterministic fallback              | Any intelligence-enabled architecture must define deterministic fallback for planner unavailable, timeout, exception, malformed result, impossible proposal, network unavailable, and provider failure.                           |
| **I9**  | Privacy by default                  | Do not assume external intelligence receives raw DOM, HTML, textContent, form values, images, ARIA labels, or unrelated application state. Default planning data is structural/serializable.                                      |
| **I10** | Accessibility ownership intact      | Intelligence must not automatically reorder DOM nodes or redefine reading order, focus order, ARIA semantics, or consumer content semantics. Visual optimization ≠ semantic DOM reordering.                                       |
| **I11** | Provider neutrality                 | DND-4.1 does not select OpenAI, Gemini, Anthropic, Azure, or any other provider as an architectural dependency. Future providers sit behind a provider-neutral planner boundary.                                                  |
| **I12** | Replayable deterministic resolution | A planner may eventually be non-deterministic, but once a Planning Proposal is captured, downstream DnDGem validation/resolution must remain deterministic and reproducible from that captured proposal.                          |

---

## 4. Conceptual pipeline

```text
Application / semantic hints
            ↓
Optional Intelligence Planner
            ↓
Planning Proposal
            ↓
deterministic normalization
            ↓
Phase 3 Auto-Layout proposal/enrichment
            ↓
solveLayout
            ↓
evaluateLayout
            ↓
VALID / DEGRADED / INVALID
            ↓
ResolvedLayout
```

Notes:

- Intelligence output is advisory until trust-boundary validation succeeds.
- Phase 3 Auto-Layout remains the deterministic placement enricher for partial/absent Source Intent.
- `solveLayout` / `evaluateLayout` remain unchanged in semantics for DND-4.1.

---

## 5. Type / name classification legend

Every conceptual name below is classified as one of:

| Tag                 | Meaning                                                         |
| ------------------- | --------------------------------------------------------------- |
| **EXISTING PUBLIC** | Already part of the published Alpha public surface              |
| **INTERNAL**        | Exists in-repo; not a frozen public intelligence API            |
| **PROPOSED**        | Conceptual contract name for Phase 4; **not** frozen public API |
| **DEFERRED**        | Possible later; not approved for implementation in DND-4.1      |

Do not treat PROPOSED names as approved package exports.

---

## 6. Planning input contract

### Conceptual planning snapshot (**PROPOSED**)

A renderer-neutral structural snapshot that a planner may consume. It is **not** a public TypeScript export in DND-4.1.

Potentially included fields (conceptual):

| Field / concern            | Classification                                         | Notes                                                             |
| -------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| Layout space               | EXISTING PUBLIC concepts via Core layout/space types   | Geometry of available board/space                                 |
| Items                      | EXISTING PUBLIC                                        | Stable item identities and sizing signals                         |
| Constraints                | EXISTING PUBLIC                                        | Hard/content constraints already owned by Core                    |
| Measured sizes             | EXISTING PUBLIC / INTERNAL normalize path              | Already normalized into Core-compatible inputs                    |
| Source Intent              | EXISTING PUBLIC / INTERNAL (Phase 3)                   | Durable explicit placement                                        |
| Generated placement state  | EXISTING PUBLIC / INTERNAL (Phase 3)                   | Auto-Layout generated geometry + origin                           |
| Placement provenance       | EXISTING PUBLIC (`PlacementOrigin` minimal) / INTERNAL | Must remain distinguishable                                       |
| Previous `ResolvedLayout`  | EXISTING PUBLIC                                        | Stability-only; never Source Intent; never an origin              |
| Current resolved geometry  | EXISTING PUBLIC                                        | Last trusted result if available                                  |
| Optional semantic hints    | **PROPOSED**                                           | Explicit consumer-supplied structural roles/hints only by default |
| Optional layout objectives | **PROPOSED**                                           | Preferences such as grouping, density, alignment bias (advisory)  |

### Forbidden in the planning contract (I5 / I9)

Must not appear as required planning-contract types:

- `HTMLElement`, `DOMRect`, `ReactNode`
- Vue / Angular / Svelte component instances
- `ResizeObserver`, `PointerEvent`
- Raw HTML, textContent, form values, images, ARIA labels, credentials, unrelated app state

### Default payload policy

Default planning data is **structural and serializable**: anonymous/stable item IDs, dimensions, constraints, placement/provenance, explicitly supplied structural roles/hints, and layout objectives.

Any future semantic content beyond that default requires **explicit consumer policy / opt-in**.

---

## 7. Planning output contract

### Conceptual Planning Proposal (**PROPOSED**)

Advisory planner output. It must **not** directly become an authoritative `ResolvedLayout` and must **not** invent alternative validity states.

May express:

| Advisory concern           | Classification | Notes                                                        |
| -------------------------- | -------------- | ------------------------------------------------------------ |
| Strategy suggestion        | **PROPOSED**   | High-level arrangement strategy                              |
| Item preference / ranking  | **PROPOSED**   | Soft ordering preferences                                    |
| Soft relationships         | **PROPOSED**   | Affinity / adjacency suggestions                             |
| Soft placement preferences | **PROPOSED**   | Preferred regions/slots without hard pins                    |
| Grouping suggestion        | **PROPOSED**   | Structural grouping advice                                   |
| Constraint suggestion      | **PROPOSED**   | Soft suggestions only; never silent hard-constraint mutation |
| Planner metadata           | **PROPOSED**   | Planner id/version, timing, mode                             |
| Confidence / explanation   | **PROPOSED**   | Optional explainability metadata                             |

Must not express:

| Forbidden output                               | Reason                                 |
| ---------------------------------------------- | -------------------------------------- |
| Authoritative `ResolvedLayout`                 | Solver authority (I1)                  |
| VALID / DEGRADED / INVALID declarations        | Validity vocabulary owned by Core (I1) |
| Silent hard-constraint edits                   | Hard constraints authoritative (I2)    |
| New placement origin that collapses provenance | Provenance preservation (I6)           |
| Framework/renderer handles                     | Renderer neutrality (I5)               |

### Normalization before deterministic pipeline

```text
Planning Proposal (advisory)
        ↓
schema validation
        ↓
semantic validation (unknown ids, impossible refs, hard-constraint conflicts)
        ↓
normalization / filtering (drop unsafe/soft-only keep safe advisory signals)
        ↓
map into Phase 3 enrichment inputs and/or LayoutIntent preferences
        ↓
createAutoLayoutProposal / existing deterministic path (when applicable)
        ↓
solveLayout → evaluateLayout
```

Malformed, incomplete, or unsafe planner output **fails closed** into deterministic fallback (I8). Soft suggestions that conflict with hard constraints are discarded; they never weaken constraints.

---

## 8. Trust boundary

```text
UNTRUSTED / ADVISORY
Planning Proposal
        ↓
schema validation
        ↓
semantic validation
        ↓
normalization / filtering
        ↓
Phase 3 proposal/enrichment
        ↓
solveLayout
        ↓
evaluateLayout
        ↓
TRUSTED DNDGEM RESULT
```

Only the trusted DnDGem result may be treated as authoritative layout state. Capturing the Planning Proposal enables replay (I12); capturing does not make the proposal trusted by itself.

---

## 9. Provenance interaction with Phase 3

Existing Phase 3 layers remain binding:

| Layer                  | Role                                         | Intelligence interaction                                                                                                |
| ---------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Source Intent          | Durable explicit consumer/user placement     | Intelligence must not silently rewrite it into generated/source without explicit product rules                          |
| Generated Placement    | Auto-Layout geometry for automatic items     | Intelligence may influence strategy that feeds enrichment; origin remains generated unless product rules promote source |
| Previous Layout        | Stability-only input                         | Never an origin; never Source Intent                                                                                    |
| Effective Solver Input | Transient compose artifact for `solveLayout` | Not an origin; not a place to launder planner authority                                                                 |

Intelligence itself is **not** a placement origin in DND-4.1. If a later sprint needs an explicit intelligence-derived provenance tag, that requires a dedicated ADR reopen. Until then, planner influence remains advisory upstream of Phase 3 composition.

---

## 10. Execution lifecycle

### Where planning MAY occur

- Explicit optimization request from the application
- Initial high-level planning before interactive use
- Deliberate post-drop optimization (after drag settle; not during pointermove)
- Layout-mode / objective change
- Idle / background planning
- Application-triggered replanning

### Where model/network planning MUST NOT occur

- `pointermove`
- Drag preview frame
- Synchronous measurement primitives
- `ResizeObserver` hot loop
- Animation frame layout loops
- Every `solveLayout` invocation

### Async / stale-result behavior (DND-4.3)

Async planners must:

- Accept optional `AbortSignal` in invoke-time `PlannerContext` (not serialized into `PlanningSnapshot`)
- Support cancellation when a newer planning request supersedes an older one
- Reject stale proposals via monotone request ids before apply (abort alone is insufficient)
- Fail closed to deterministic fallback on throw/reject/malformed output

Implemented by `runLayoutPlanner` (intelligence) + DOM `session.replan()` stale/cancel guards. No remote inference in DND-4.3.

---

## 11. Deterministic fallback (I8)

Intelligence-enabled architectures must fall back to the existing deterministic path when any of the following occur:

| Failure mode        | Required behavior                                      |
| ------------------- | ------------------------------------------------------ |
| Planner unavailable | Deterministic DnDGem continues without intelligence    |
| Timeout             | Ignore late/partial result; continue deterministically |
| Exception           | Catch/fail closed; no partial authoritative apply      |
| Malformed result    | Schema validation fail → discard                       |
| Impossible proposal | Semantic validation fail → discard                     |
| Network unavailable | No hard dependency; offline deterministic path remains |
| Provider failure    | Treat as unavailable planner                           |

Fallback must preserve solver authority, hard constraints, and Phase 3 provenance semantics.

---

## 12. Privacy contract (I9)

### Allowed by default (structural)

- Anonymous / stable item IDs
- Dimensions and measured sizes already normalized for Core
- Constraints
- Placement / provenance
- Explicitly supplied structural roles / hints
- Layout objectives / preferences

### Not transmitted externally by default

- DOM HTML
- Text content
- User-entered form values
- Images
- ARIA labels
- Credentials / secrets
- Unrelated application state

If future semantic content is required for model-assisted experiments, it must require **explicit consumer policy / opt-in**. Privacy defaults are fail-closed.

---

## 13. Accessibility contract (I10)

Binding principle (unchanged):

```text
DnDGem owns layout mechanics.
Consumer owns content semantics.
```

Implications:

- Intelligence may influence **visual placement**.
- Intelligence must **not** automatically redefine DOM order, reading order, focus/tab order, or ARIA semantics.
- Absolute visual optimization that diverges from DOM/tab order remains a known Alpha limitation owned by consumer guidance — Phase 4 must not worsen this by silently rewriting content semantics.
- Any future assistive-technology features remain separate product work; they are not implied by Planning Proposals.

---

## 14. Provider strategy (I11)

DND-4.1 records:

```text
Provider-neutral planner architecture: required
Specific external provider: deferred
Remote model dependency: optional
Consumer-supplied planner: desirable
Deterministic/local planner: first implementation target
```

Provider selection belongs to later evidence-driven experimentation (DND-4.4), not architecture lock-in.

Provisional future package name `@dndgem/intelligence` is **PROVISIONAL / NOT APPROVED PUBLIC API**. DND-4.1 does not create it. Forbidden legacy name `@dndgem/ai` remains forbidden.

---

## 15. Beta / maturity policy

- Deterministic DnDGem functionality may progress toward Beta **independently** from model-based intelligence.
- Intelligence APIs may remain experimental, Alpha, and/or separately versioned in maturity.
- LLM/model integration is **not** a prerequisite for Beta unless later evidence explicitly justifies that policy change.
- DND-4.1 performs **no** Beta release and **no** version bump.

---

## 16. Package / API impact (DND-4.1)

| Concern                              | DND-4.1 decision |
| ------------------------------------ | ---------------- |
| New production package               | **No**           |
| AI SDK / provider dependency         | **No**           |
| Solver / validity / scoring changes  | **No**           |
| Framework adapter intelligence logic | **No**           |
| Frozen public intelligence exports   | **No**           |
| Conceptual Planning Proposal names   | PROPOSED only    |
| Existing public Auto-Layout API      | Unchanged        |

---

## 17. Test model (contract-level)

DND-4.1 does not add production tests for unimplemented planners. Future sprints must cover at least:

1. Planning Proposal never bypasses hard constraints
2. Malformed proposals fail closed
3. Captured proposal replay is deterministic downstream
4. Intelligence absent ⇒ existing behavior unchanged
5. No planner invocation from hot-path fixtures
6. Privacy default payload excludes content/DOM scrapes
7. Framework adapters do not diverge in intelligence semantics

Existing deterministic quality gates remain authoritative for this sprint.

---

## 18. Relationship to existing ADRs

| ADR         | Relationship                                                                      |
| ----------- | --------------------------------------------------------------------------------- |
| 0001        | Reinforced — Core stays renderer-agnostic; intelligence stays out of Core default |
| 0003 / 0010 | Reinforced — deterministic solver authority unchanged                             |
| 0006        | Reinforced — intent vs resolved layout distinction preserved                      |
| 0009        | Reinforced — validity/scoring vocabulary unchanged                                |
| 0014        | Reinforced — Phase 3 provenance preserved; intelligence is not a new origin       |
| 0015–0017   | Reinforced — adapters stay thin; no per-framework intelligence; SSR safety        |
| **0018**    | Records Phase 4 intelligence boundary decision                                    |

---

## 19. Closure

DND-4.1 is complete when this contract, the Phase 4 planning audit, and ADR-0018 are accepted, current-state docs are reconciled without rewriting historical release evidence, and the repository contains no production intelligence implementation from this sprint.
