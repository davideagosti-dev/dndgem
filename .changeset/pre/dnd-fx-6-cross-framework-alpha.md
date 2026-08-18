---
'@dndgem/core': minor
'@dndgem/dom': minor
'@dndgem/react': minor
'@dndgem/vue': minor
'@dndgem/angular': minor
'@dndgem/svelte': minor
---

Cross-Framework Alpha release (DND-FX.6).

- `@dndgem/vue`: first public Vue 3 adapter (`vue@^3.5` peer)
- `@dndgem/angular`: first public Angular adapter (`@angular/core@^20 || ^21 || ^22` peer)
- `@dndgem/svelte`: first public Svelte 5 adapter (`svelte@^5` peer; client/server export boundary)
- Next.js compatibility validated with `@dndgem/react` (App Router, `'use client'` integration root)
- Nuxt compatibility validated with `@dndgem/vue`
- SvelteKit compatibility validated with `@dndgem/svelte` (SSR import/build shell safe; client session after mount)
- Svelte SSR compatibility fix included for server compile / import safety
- `@dndgem/core`, `@dndgem/dom`, and `@dndgem/react` version-aligned with the new adapters on the shared Alpha channel
