---
'@dndgem/core': patch
'@dndgem/dom': patch
'@dndgem/react': patch
'@dndgem/vue': patch
'@dndgem/angular': patch
'@dndgem/svelte': patch
---

Recovery release (DND-FX.6 alpha.3).

- Republish all six public packages through the approved pnpm/OIDC release path
- Fix external installability: Vue/Angular/Svelte `0.1.0-alpha.2` bootstrap artifacts contained unresolved `workspace:*` dependency metadata from manual `npm publish` (bypassed pnpm workspace rewriting)
- Strengthen pack validation to assert no `workspace:` protocol in published tarball metadata
- No runtime API changes
