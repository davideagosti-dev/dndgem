# Release Strategy

## Versioning

- Packages start at **0.0.0**.
- Changesets manages intended version bumps and changelogs.
- DnDGem is **not** stable `1.0` during Phase 1.

## Scope of DND-1.1

- Changesets initialized (`.changeset/`).
- No npm publish.
- No release CI job.
- No fake release notes claiming product features.

## npm scope

Target scope: `@dndgem`.

Availability/ownership of the npm org is an external manual follow-up. Repository naming remains `@dndgem/*` regardless.

## Future publish gate (not now)

Publish only after an explicit release decision, with:

- CI green
- Changesets present
- Public API review
- License/header checks as required
