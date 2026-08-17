# ADR-0016: JS/DOM Framework Package Topology

- **Status:** Accepted
- **Date:** 2026-08-17
- **Sprint:** DND-FX.1

## Context

Published Alpha packages are `@dndgem/core`, `@dndgem/dom`, and `@dndgem/react` (fixed Changesets group, pre mode `alpha`). ADR-0007 shipped React first and forbade Vue/Angular/Svelte stubs in Phase 1. Framework Expansion now authorizes those adapters as real packages — without placeholders, without meta-framework packages, and without a shared `framework-core` layer.

## Decision

1. **Sibling adapters over DOM:**

```text
                  @dndgem/core
                        ↓
                   @dndgem/dom
                        ↓
      ┌────────────┬────┴─────┬────────────┐
      ↓            ↓          ↓            ↓
 @dndgem/react  @dndgem/vue  @dndgem/angular  @dndgem/svelte
```

2. **Dependencies**
   - Each adapter **must** depend on `@dndgem/dom`.
   - Direct `@dndgem/core` is allowed for public Core types and package-info helpers (as React does today).
   - The framework runtime is a **peerDependency** (`react`, `vue`, `@angular/core`, `svelte` respectively).
   - Adapters **must not** depend on another adapter or on `@dnd-kit/*`.

3. **Forbidden packages (do not create):**
   - `@dndgem/framework-core`
   - `@dndgem/vanilla` (Vanilla uses `@dndgem/dom`)
   - `@dndgem/next`, `@dndgem/nuxt`, `@dndgem/sveltekit` (compatibility environments)
   - `@dndgem/flutter`, `@dndgem/ai`

4. **Public surface:** ESM-only; supported import is the package root (`exports["."]`). Deep imports are not part of the Alpha contract. Additional export conditions (e.g. Svelte, Angular packager) may be added in the implementing sprint if the compiler requires them; they must not replace the root ESM/types contract.

5. **Boundaries:** `scripts/package-topology.mjs` is the allowlist. `pnpm check:boundaries` applies adapter rules only to folders that exist. Planned folders that are still absent (`svelte`) must not be stubbed.

6. **Changesets:** Keep `@dndgem/core`, `@dndgem/dom`, `@dndgem/react` as the current **fixed** group. **Do not** add nonexistent packages to `.changeset/config.json`. DND-FX.2–FX.4 may create packages unpublished. **DND-FX.6** joins existing public adapters into the fixed group so versions stay aligned, then publishes on `@alpha`. Adding a package to the fixed group locksteps a bump of existing packages even if Core algorithms did not change — document that as alignment.

7. **npm / OIDC:** Each new package needs npm creation + Trusted Publisher on `publish.yml` + a workflow `--filter` **before** the first real OIDC publish (DND-FX.6). Do not add filters for packages that do not exist.

## Alternatives

1. **Dedicated meta-framework packages** — rejected unless a later sprint proves adapter logic that cannot live in `@dndgem/react|vue|svelte` plus docs/fixtures.
2. **`@dndgem/framework-core`** — rejected until proven duplication (ADR-0015).
3. **Independent versioning per adapter** — rejected for Alpha: consumers install `@alpha` and expect aligned `@dndgem/*` versions.

## Consequences

- `scripts/check-boundaries.mjs`, ESLint restricted imports, pack validation, and the publish-workflow checker consume the topology module.
- ADR-0007’s Phase 1 “no Vue/Angular/Svelte packages” is historically accepted and **superseded for Framework Expansion** by this ADR + sprint-scoped authorization (DND-FX.2/3/4).
- Flutter remains a separate renderer track and is not a sibling on this graph.
