# @dndgem/svelte

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
