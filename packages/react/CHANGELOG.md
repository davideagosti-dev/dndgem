# @dndgem/react

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
  - @dndgem/dom@0.1.0-alpha.1

## 0.1.0-alpha.0

### Minor Changes

- bf2ffa9: Define the first documented Alpha public API contract for `@dndgem/core`, `@dndgem/dom`, and `@dndgem/react`, and prepare the controlled npm Alpha release pipeline. Packages remain unpublished until the DND-2.5 Public Alpha gate.

### Patch Changes

- Updated dependencies [bf2ffa9]
  - @dndgem/core@0.1.0-alpha.0
  - @dndgem/dom@0.1.0-alpha.0
