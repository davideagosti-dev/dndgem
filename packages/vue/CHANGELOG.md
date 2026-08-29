# @dndgem/vue

## 0.1.0-alpha.4

### Minor Changes

- c557c8b: Add optional session `planner` / `onPlannerEvent` and `session.replan(): Promise<void>` with framework adapter parity (DND-4.3). Default behavior is unchanged when no planner is configured. `@dndgem/intelligence` remains private and is not published.

### Patch Changes

- Updated dependencies [d06408c]
- Updated dependencies [c557c8b]
  - @dndgem/core@0.1.0-alpha.4
  - @dndgem/dom@0.1.0-alpha.4

## 0.1.0-alpha.3

### Patch Changes

- 89eb8ac: Recovery release (DND-FX.6 alpha.3).
  
  - Republish all six public packages through the approved pnpm/OIDC release path
  - Fix external installability: Vue/Angular/Svelte `0.1.0-alpha.2` bootstrap artifacts contained unresolved `workspace:*` dependency metadata from manual `npm publish` (bypassed pnpm workspace rewriting)
  - Strengthen pack validation to assert no `workspace:` protocol in published tarball metadata
  - No runtime API changes
- Updated dependencies [89eb8ac]
  - @dndgem/core@0.1.0-alpha.3
  - @dndgem/dom@0.1.0-alpha.3

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
  - @dndgem/dom@0.1.0-alpha.2
