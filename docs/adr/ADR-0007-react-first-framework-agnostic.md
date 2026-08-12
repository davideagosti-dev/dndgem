# ADR-0007: React-First, Framework-Agnostic

- **Status:** Accepted
- **Date:** 2026-08-12
- **Sprint:** DND-1.1

## Context

Phase 1 needs a practical integration path without locking the architecture to one UI framework.

## Decision

Ship React bindings first (`@dndgem/react`) while keeping `@dndgem/core` framework-agnostic and `@dndgem/dom` free of React.

Vue, Angular, and Svelte adapters are out of Phase 1 scope and must not be stub-implemented.

## Consequences

- Playground and first examples can use React.
- Core/DOM remain reusable for other adapters later.
- No Vue/Angular/Svelte packages in this repository during Phase 1.
