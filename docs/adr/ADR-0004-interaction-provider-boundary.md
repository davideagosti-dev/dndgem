# ADR-0004: Interaction Provider Boundary

- **Status:** Accepted
- **Date:** 2026-08-12
- **Sprint:** DND-1.1

## Context

Drag-and-drop providers evolve and differ by platform. Coupling public DnDGem types to a specific library would freeze architecture and leak implementation details.

## Decision

DnDGem owns an interaction abstraction. Low-level DnD libraries are adapters behind that boundary. Public types must not expose provider-specific types.

## Consequences

- Core never imports a DnD provider.
- Provider upgrades, contract tests, and rollbacks remain possible.
- Implementation delivered in DND-1.6 (`createDragInteraction`; see ADR-0012).
