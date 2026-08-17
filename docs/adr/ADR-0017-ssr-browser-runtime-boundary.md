# ADR-0017: SSR / Browser Runtime Boundary

- **Status:** Accepted
- **Date:** 2026-08-17
- **Sprint:** DND-FX.1

## Context

ADR-0013 requires that importing `@dndgem/react` must not touch `window` / `document` at module evaluation, while rendering `DnDGemProvider` is a client-side mount. Full SSR/hydration of the layout session is an Alpha **non-claim**. Framework Expansion targets Next.js, Nuxt, and SvelteKit as **compatibility environments**, so the five-layer rule must be framework-neutral and must not imply dedicated `@dndgem/next|nuxt|sveltekit` packages.

`createLayoutSession` requires connected `HTMLElement`s, `ResizeObserver`, and drag mechanics. That work cannot run during Node/server render.

## Decision

Framework-neutral runtime layers:

```text
1. Module import
2. Server render
3. Client session creation
4. Hydration
5. Cleanup / navigation
```

### 1. Module import

Importing `@dndgem/core`, `@dndgem/dom`, or a JS/DOM adapter **must not**:

- access `window` or `document`
- call `createLayoutSession`
- attach `ResizeObserver` or drag mechanics

Construction of the default `@dnd-kit/dom` adapter is deferred to mechanics `connect()`, not to ESM evaluation.

### 2. Server render

**No** `createLayoutSession`. Consumer markup may render without DnDGem layout styles. Adapters may export components/composables/directives whose **module graph** is import-safe; they must not start a session during SSR.

### 3. Client session creation

Create the session only after the positioned container and every declared item exist as real DOM nodes in the browser (ADR-0015 registration rule).

### 4. Hydration

DnDGem may become `ready` **post-mount**. Empty layout styles until the first session state is allowed. This gate does **not** claim:

- server-side `ResolvedLayout`
- mismatch-free pre-styled SSR
- isomorphic solving

### 5. Cleanup / navigation

Unmount, destruction, and route leave call `session.dispose()`. Route return recreates **one** session after re-registration. Duplicate owners are a contract violation.

### Meta-frameworks

| Environment | Implication                                                                     |
| ----------- | ------------------------------------------------------------------------------- |
| Next.js     | App Router + `'use client'` on the React integration root; no dedicated package |
| Nuxt        | Client-only usage of `@dndgem/vue`; no `@dndgem/nuxt`                           |
| SvelteKit   | Client-only board; no `@dndgem/sveltekit`                                       |

DND-FX.5 validates these environments. Docs may describe the patterns; they must not market “full SSR support.”

## Alternatives

1. **Keep React-only wording** — rejected: Next/Nuxt/SvelteKit would re-litigate the boundary per adapter.
2. **Solve layout on the server and hydrate geometry** — rejected for this gate: session requires measurement, observers, and pointer drag; Alpha does not productize it.
3. **Dedicated meta-framework packages to hide `'use client'` / client-only** — rejected (ADR-0016) unless later evidence shows real adapter logic.

## Consequences

- `@dndgem/dom` and each adapter keep a Node import-safety test.
- Framework Expansion raises the public claim from “React import-safe” to “import-safe + client-only session + dispose on navigation,” still without isomorphic layout SSR.
- Future AI (Phase 4) stays on Core intent and must not require a per-framework SSR hook.
