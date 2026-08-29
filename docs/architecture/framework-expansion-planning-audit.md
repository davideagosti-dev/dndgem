# Framework Expansion Planning Audit — Decision Record

**Status:** **PASSED WITH REFINEMENTS** — DND-FX.1–FX.6 **COMPLETE**; valid public Alpha **`0.1.0-alpha.3`**

**Product:** DnDGem by DA62  
**Scope:** Framework Expansion Gate (JS/DOM adapters) — architecture / sprint mapping  
**Entry gate:** **READY WITH REFINEMENTS** (closed by DND-FX.1)  
**Sprint map:** **APPROVED** (6 sprints)

This document is the authoritative record of the Framework Expansion Gate after the planning audit. Vue / Angular / Svelte implementation sprints are **COMPLETE**; do not reopen them except for an authorized follow-up.

Related: [roadmap.md](../roadmap.md), [framework-adapter-contract.md](./framework-adapter-contract.md), [ADR-0015](../adr/ADR-0015-universal-framework-adapter-contract.md), [ADR-0016](../adr/ADR-0016-framework-package-topology.md), [ADR-0017](../adr/ADR-0017-ssr-browser-runtime-boundary.md), [ADR-0007](../adr/ADR-0007-react-first-framework-agnostic.md), [ADR-0008](../adr/ADR-0008-flutter-compatibility-principle.md), [ADR-0013](../adr/ADR-0013-react-vanilla-integration-boundary.md), [ADR-0014](../adr/ADR-0014-auto-layout-enrichment-provenance.md).

---

## Verdict

```text
DNDGEM FRAMEWORK EXPANSION PLANNING AUDIT
PASSED WITH REFINEMENTS

ENTRY GATE:
READY WITH REFINEMENTS

FRAMEWORK EXPANSION SPRINT MAP:
APPROVED

NUMBERING:
UNNUMBERED GATE + DND-FX.n

SPRINT COUNT:
6
```

| Sprint       | Title                                                 | Decision     | Implementation status |
| ------------ | ----------------------------------------------------- | ------------ | --------------------- |
| **DND-FX.1** | Shared Framework Adapter Contract & Architecture Gate | **APPROVED** | **COMPLETE**          |
| **DND-FX.2** | Vue Adapter                                           | **APPROVED** | **COMPLETE**          |
| **DND-FX.3** | Angular Adapter                                       | **APPROVED** | **COMPLETE**          |
| **DND-FX.4** | Svelte Adapter                                        | **APPROVED** | **COMPLETE**          |
| **DND-FX.5** | Meta-Framework Compatibility Validation               | **APPROVED** | **COMPLETE**          |
| **DND-FX.6** | Cross-Framework Alpha Release Gate                    | **APPROVED** | **COMPLETE**          |

---

## Numbering (binding)

Framework Expansion is an **unnumbered named gate**, not Phase 4.

```text
Phase 3 — Adaptive Auto-Layout     COMPLETE / RELEASED (0.1.0-alpha.1)
        ↓
Framework Expansion Gate           DND-FX.1 → DND-FX.6
        ↓
Phase 4 — AI-Assisted Layout Intelligence   COMPLETE WITH RELEASE PENDING (see phase-4-planning-audit.md)
```

- Do **not** call this work Phase 4.
- Do **not** renumber AI.
- Do **not** use `DND-4.x` sprint IDs for adapters.
- Flutter remains a **separate ecosystem track** (ADR-0008). It is not a DND-FX sprint.

---

## Approved architectural direction

```text
ONE deterministic Core
ONE browser/session layer (@dndgem/dom)
MULTIPLE thin idiomatic JS/DOM framework adapters
```

Not:

```text
React solver / Vue solver / Angular solver / Svelte solver
```

Target graph:

```text
                  @dndgem/core
                        ↓
                   @dndgem/dom
                        ↓
      ┌────────────┬────┴─────┬────────────┐
      ↓            ↓          ↓            ↓
   React          Vue      Angular       Svelte
      ↓            ↓                       ↓
   Next.js        Nuxt                 SvelteKit
   env only       env only              env only
```

React, Vue, Angular, and Svelte are **siblings** over `@dndgem/dom`. Meta-frameworks are **compatibility environments**, not packages.

Vanilla continues to consume `@dndgem/dom` directly. There is no `@dndgem/vanilla`.

---

## Binding decisions

1. **Thin adapters.** Lifecycle, registration, reactive state, and cleanup only. Solver, Auto-Layout, validity, scoring, reflow, and drag policy stay in Core/DOM.
2. **Session seam.** Adapters create/dispose `createLayoutSession`. They must not assemble a parallel `createAutoLayoutProposal` → `solveLayout` pipeline.
3. **No `@dndgem/framework-core`.** React is small enough that a shared implementation package is premature.
4. **No dedicated `@dndgem/next`, `@dndgem/nuxt`, or `@dndgem/sveltekit`** unless a later sprint proves adapter logic that cannot live in the base framework package plus docs/fixtures.
5. **Auto-Layout remains opt-in** (`autoLayout` default off). Proposal completeness (`proposalUnplacedItemIds`) is not solver validity.
6. **Phase 3 invariants remain binding** (ADR-0014): one solver; VALID / DEGRADED / INVALID; origins `source` \| `generated`; drag is strong intent not a pin; hybrid/partial intent is first-class.
7. **SSR contract** (ADR-0017): import-safe; no session on the server; client session after real DOM nodes; hydration may apply layout post-mount; dispose on navigation.
8. **Versioning.** Alpha / Changesets pre mode continues. New public adapters join the **fixed** group at **DND-FX.6**. Do not add nonexistent packages to `.changeset/config.json`.
9. **Trusted Publishing.** Each new npm package needs its own Trusted Publisher and a `publish.yml` filter before the first real OIDC publish (DND-FX.6).
10. **AI stays downstream** of Core intent. Adapters are not AI extension points.

---

## Scope of the adapter contract

The universal contract is the **JS/DOM Framework Adapter Contract**. It does **not** claim that every future renderer (Flutter) must use `@dndgem/dom`. Flutter would consume Core through a different runtime. Core must remain free of browser and framework concepts (ADR-0001 / ADR-0008).

---

## Dependency chain

```text
DND-FX.1
  Contract + topology + SSR ADR + repo gates
        ↓
DND-FX.2
  @dndgem/vue
        ↓
DND-FX.3
  @dndgem/angular
        ↓
DND-FX.4
  @dndgem/svelte
        ↓
DND-FX.5
  Next.js / Nuxt / SvelteKit compatibility (no dedicated packages)
        ↓
DND-FX.6
  Changesets fixed-group + OIDC publish on @alpha
```

DND-FX.2 must not start until DND-FX.1 is closed. Do not combine Vue, Angular, and Svelte into one implementation sprint.

---

## Explicitly deferred (unchanged)

Phase 4 AI · Flutter implementation · Pin/Lock API · grouping / region DSL · CSS grid/flex clone · Large-N optimization · full keyboard / SR drag product · mobile/touch certification · monetization / cloud · dedicated meta-framework packages · default-on Auto-Layout.

---

## Next action

**DND-FX.1**–**DND-FX.6** are **COMPLETE**. Framework Expansion Gate is **COMPLETE**. Valid public Alpha is **`0.1.0-alpha.3`** (`@alpha`). `0.1.0-alpha.2` is **superseded**. Phase 4 — AI-Assisted Layout Intelligence is **COMPLETE WITH RELEASE PENDING** (DND-4.1–DND-4.5); see [phase-4-planning-audit.md](./phase-4-planning-audit.md).
