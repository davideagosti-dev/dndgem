# ADR-0015: Universal JS/DOM Framework Adapter Behavioral Contract

- **Status:** Accepted
- **Date:** 2026-08-17
- **Sprint:** DND-FX.1

## Context

Phase 3 shipped Adaptive Auto-Layout through `@dndgem/core`, `@dndgem/dom` `createLayoutSession`, and a thin `@dndgem/react` adapter (`0.1.0-alpha.1`). ADR-0013 defines the React/Vanilla boundary. Framework Expansion (unnumbered gate, DND-FX.2–FX.4) will add Vue, Angular, and Svelte adapters.

Without a framework-neutral contract, each adapter could grow its own validity language, Auto-Layout defaults, session ownership rules, or solver pipeline — collapsing “one Core / one DOM session / multiple adapters.”

## Decision

1. All JS/DOM framework adapters are **thin** translations of lifecycle, registration, reactive state, and cleanup onto `createLayoutSession`.
2. **Behavioral parity is required; syntax is not.** React Provider/hooks are a reference, not a template other frameworks must copy.
3. Adapters **must not** implement solver, Auto-Layout placement, scoring, validity, or reflow policy.
4. Binding behaviors are recorded in [framework-adapter-contract.md](../architecture/framework-adapter-contract.md): one session per board; wait for container + all items; recreate on significant config change (no `session.update()` in this gate); Auto-Layout opt-in default off; `proposalUnplacedItemIds` ≠ solver validity; dispose on teardown.
5. This contract applies to **JS/DOM adapters**. It does not require Flutter or other non-DOM renderers to use `@dndgem/dom`.

## Alternatives

1. **Framework-specific adapter policy** — each adapter invents session/validity/Auto-Layout rules. Rejected: produces multiple layout products and breaks Phase 3 invariants (ADR-0014).
2. **Shared framework-neutral behavioral contract** (accepted) — document parity; implement idiomatic DX per framework.
3. **Shared implementation package (`@dndgem/framework-core`)** — extract registration/lifecycle into a third runtime. Rejected for now: `@dndgem/react` is small; a shared package would freeze React-shaped APIs and is premature abstraction (ADR-0016).

## Consequences

- DND-FX.2–FX.4 implement Vue/Angular/Svelte against this contract.
- ADR-0013 remains the React/Vanilla reference implementation.
- New adapter tests emphasize lifecycle and Vanilla parity, not Core algorithm duplication.
- Revisit `@dndgem/framework-core` only if substantial duplicated **framework-neutral** lifecycle logic is proven after two or more adapters exist.
