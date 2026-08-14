# Release Strategy

## Versioning

- Packages remain at **0.0.0** through DND-2.1.
- Changesets manages intended version bumps and changelogs.
- Expected Alpha convention (DND-2.2): approximately `0.1.0-alpha.x`.
- DnDGem is **not** stable `1.0` during Phase 2.

## Historical (DND-1.1)

- Changesets initialized (`.changeset/`).
- No npm publish during Technical MVP.

## Current (Phase 2)

- **DND-2.1:** full CI quality gate; no version bumps; no npm publish.
- **DND-2.2:** Alpha API contract, package metadata, publish workflow / dry-run.
- **DND-2.5:** npm Alpha publication gate.

## npm scope

Target scope: `@dndgem`.

Availability/ownership of the npm org is an external manual follow-up. Repository naming remains `@dndgem/*` regardless.

## Publish gate

Publish only after an explicit release decision (DND-2.5), with:

- CI green
- Changesets present
- Public API review (Alpha contract from DND-2.2)
- License/header checks as required

Repository visibility (private → public) is a **separate** gate from npm Alpha.
