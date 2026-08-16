---
'@dndgem/core': minor
'@dndgem/dom': minor
'@dndgem/react': minor
---

Opt-in Auto-Layout for Vanilla and React consumers (DND-3.4).

- `@dndgem/core`: public `createAutoLayoutProposal` (+ types) for headless compose with `solveLayout`
- `@dndgem/dom`: `createLayoutSession({ autoLayout })` with partial/absent `desiredPlacements`, Source Intent retention, and `state.autoLayout.proposalUnplacedItemIds` (proposal completeness metadata)
- `@dndgem/react`: matching `DnDGemProvider` `autoLayout` prop
- Accepted drag promotes only the active item to Source Intent; cancel/reject leave provenance unchanged
- Default remains explicit-only (Auto-Layout off). Not included in published `0.1.0-alpha.0` until the next Alpha publish (DND-3.5)
