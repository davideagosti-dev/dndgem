# @dndgem/dom

## 0.1.0-alpha.3

### Patch Changes

- 89eb8ac: Recovery release (DND-FX.6 alpha.3).
  
  - Republish all six public packages through the approved pnpm/OIDC release path
  - Fix external installability: Vue/Angular/Svelte `0.1.0-alpha.2` bootstrap artifacts contained unresolved `workspace:*` dependency metadata from manual `npm publish` (bypassed pnpm workspace rewriting)
  - Strengthen pack validation to assert no `workspace:` protocol in published tarball metadata
  - No runtime API changes
- Updated dependencies [89eb8ac]
  - @dndgem/core@0.1.0-alpha.3

## 0.1.0-alpha.2

### Minor Changes

- Cross-Framework Alpha release (DND-FX.6).
  
  - `@dndgem/vue`: first public Vue 3 adapter (`vue@^3.5` peer)
  - `@dndgem/angular`: first public Angular adapter (`@angular/core@^20 || ^21 || ^22` peer)
  - `@dndgem/svelte`: first public Svelte 5 adapter (`svelte@^5` peer; client/server export boundary)
  - Next.js compatibility validated with `@dndgem/react` (App Router, `'use client'` integration root)
  - Nuxt compatibility validated with `@dndgem/vue`
  - SvelteKit compatibility validated with `@dndgem/svelte` (SSR import/build shell safe; client session after mount)
  - Svelte SSR compatibility fix included for server compile / import safety
  - `@dndgem/core`, `@dndgem/dom`, and `@dndgem/react` version-aligned with the new adapters on the shared Alpha channel

### Patch Changes

- Updated dependencies
  - @dndgem/core@0.1.0-alpha.2

## 0.1.0-alpha.1

### Minor Changes

- fcbee7d: Opt-in Auto-Layout for Vanilla and React consumers (DND-3.4).
  
  - `@dndgem/core`: public `createAutoLayoutProposal` (+ types) for headless compose with `solveLayout`
  - `@dndgem/dom`: `createLayoutSession({ autoLayout })` with partial/absent `desiredPlacements`, Source Intent retention, and `state.autoLayout.proposalUnplacedItemIds` (proposal completeness metadata)
  - `@dndgem/react`: matching `DnDGemProvider` `autoLayout` prop
  - Accepted drag promotes only the active item to Source Intent; cancel/reject leave provenance unchanged
  - Default remains explicit-only (Auto-Layout off). Not included in published `0.1.0-alpha.0` until the next Alpha publish (DND-3.5)

### Patch Changes

- Updated dependencies [fcbee7d]
  - @dndgem/core@0.1.0-alpha.1

## 0.1.0-alpha.0

### Minor Changes

- bf2ffa9: Define the first documented Alpha public API contract for `@dndgem/core`, `@dndgem/dom`, and `@dndgem/react`, and prepare the controlled npm Alpha release pipeline. Packages remain unpublished until the DND-2.5 Public Alpha gate.

### Patch Changes

- Updated dependencies [bf2ffa9]
  - @dndgem/core@0.1.0-alpha.0
