# ADR-0008: Flutter Compatibility Principle

- **Status:** Accepted (principle only; no implementation)
- **Date:** 2026-08-12
- **Sprint:** DND-1.1

## Context

Flutter is an official future target. Encoding HTML/CSS assumptions into core would force a rewrite for Flutter.

## Decision

Core types and concepts must remain renderer-agnostic so a future Flutter adapter can consume equivalent normalized measurements and constraints without requiring HTML/CSS semantics inside core.

Flutter code, packages, and tooling are **not** introduced in Phase 1.

## Consequences

- Prefer normalized geometric/content concepts over DOM vocabulary in core.
- Architectural reviews should reject HTML-only leakage into `@dndgem/core`.
- Compatibility is a design constraint now; implementation is later.
