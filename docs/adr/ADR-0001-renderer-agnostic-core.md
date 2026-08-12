# ADR-0001: Renderer-Agnostic Core

- **Status:** Accepted
- **Date:** 2026-08-12
- **Sprint:** DND-1.1

## Context

DnDGem must support multiple renderers over time (DOM/React first; Flutter later). If core types encode HTML/CSS/DOM semantics, adapters become leaky and Flutter compatibility collapses.

## Decision

`@dndgem/core` is renderer-agnostic. It must not depend on DOM APIs, CSS, browser globals, React, Vue, Angular, Svelte, Flutter, dnd-kit, or AI SDKs.

Adapters (`@dndgem/dom`, `@dndgem/react`, future Flutter) normalize measurements and apply resolved layouts.

## Consequences

- Core remains portable and testable in Node.
- DOM/React packages own browser and framework concerns.
- Enforcement via package boundaries, ESLint restricted imports, and `pnpm check:boundaries`.
