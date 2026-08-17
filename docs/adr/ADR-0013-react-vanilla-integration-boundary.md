# ADR-0013: React / Vanilla Integration Boundary

- **Status:** Accepted (DND-1.7). **Framework Expansion (DND-FX.1):** remains the React/Vanilla reference implementation. Universal JS/DOM adapter parity is [ADR-0015](./ADR-0015-universal-framework-adapter-contract.md); SSR layers are [ADR-0017](./ADR-0017-ssr-browser-runtime-boundary.md).
- **Date:** 2026-08-13
- **Sprint:** DND-1.7

## Context

DND-1.2–1.6 established a renderer-agnostic Core, DOM measurement/resize, and vendor-isolated drag interaction. DND-1.7 must make those primitives usable from Vanilla DOM and React without moving solver semantics into framework layers or leaking `@dnd-kit` types.

## Decision

1. **Vanilla consumes `@dndgem/dom` directly.** There is no `@dndgem/vanilla` package. The public orchestration entry is `createLayoutSession`, which composes `measureLayout` / `observeLayout` (via `createDragInteraction`), `solveLayout`, and resolved-geometry application.
2. **React is a thin adapter.** `@dndgem/react` provides `DnDGemProvider`, `useDnDGem`, `useDnDGemContainer`, and `useDnDGemItem`. It registers `ItemId` → `HTMLElement`, owns React lifecycle, and exposes session state. It does not reimplement intent building, scoring, collision, or reflow.
3. **One runtime.** React creates and disposes the same `createLayoutSession` Vanilla uses. Framework lifecycle must not change Core output for identical intent, measurements, and interaction events.
4. **Rendering ownership.** Core returns `Rect`. `@dndgem/dom` maps Rect → `position: absolute; box-sizing: border-box; left; top; width; height` in CSS pixels. React applies the same descriptor via the item `style` binding. No CSS, class names, or transforms are added to Core.
5. **State ownership.** `LayoutIntent` and `ResolvedLayout` remain distinct. The session holds the committed pair plus transient `DragProposal`. React state mirrors that session; DOM nodes and the session instance live in refs.
6. **Controlled vs uncontrolled.** Consumers supply initial items, constraints, and optional desired placements. The integration owns transient drag/solve state and reports through callbacks/`getState()`. Constraint or item-set changes recreate the session, seeding `previous` from the last committed resolved layout for idle stability only. An explicit `desiredPlacements` change omits `previous` so ADR-0010 `preserve-previous` cannot suppress the new author intent.
7. **Drag vs idle solver.** Drag proposals keep DND-1.6 semantics: `solveLayout({ intent })` without Core `previous`. Idle resize and constraint-only continuation may pass `previous` so ADR-0010 stability can keep a still-valid layout. Explicit author desired updates and the first mount do **not** pass `previous`.
8. **Provider isolation.** React and Vanilla public APIs must not mention dnd-kit types. Optional `mechanics` remains a test/replacement seam, not a consumer requirement.
9. **Lifecycle.** React cleanup calls `session.dispose()`, which disposes interaction and observers. Disposal is idempotent. StrictMode setup/cleanup/setup must not leak duplicate observers or provider sessions. `dispose()` does **not** restore pre-session layout inline styles; DnDGem owns `position` / `left` / `top` / `width` / `height` / `box-sizing` (and clears `transform`) on mapped items after mount.
10. **Accessibility.** Pointer integration is the validated path. Keyboard drag is not claimed as product-validated.
11. **SSR.** Importing `@dndgem/react` must not touch `window` / `document` at module evaluation. Rendering the provider requires a client-side mount; full SSR/hydration of the layout session is out of scope for DND-1.7.
12. **Dynamic items.** The declared item set must be fully registered before a session starts. Changing the declared set recreates the session (in-flight drag is discarded). Mid-session add/remove without recreation is not a supported API.

## Consequences

- Flutter or other future adapters can still use Core (and a non-DOM measurement layer) without React.
- Replacing `@dnd-kit/dom` must not change Vanilla or React consumer code.
- Examples and the playground must import public package entry points only.
