# Troubleshooting

Symptoms map to **actual** Alpha behavior. Weak or missing runtime errors are called out as DX findings, not invented messages.

## Nothing renders / items stacked wrong

- Container missing `position: relative` (or other positioned containing block)
- Forgot to spread `item.style` (React) or session never applied (Vanilla)
- Provider/session created before elements exist — wait for registration (`ready` in React)

## Container not measured

- Element not in the document or zero-sized
- CSS hiding the board (`display: none`) during first measure
- In Vanilla, wrong element passed as `container`

## Item not registered (React)

- `useDnDGemItem('id')` id must match an entry in `DnDGemProvider` `items`
- Ref not attached to a DOM node
- Hook used outside `DnDGemProvider` → throws `Error` (provider required)

## Layout `INVALID`

- Hard `min*` / `max*` cannot be satisfied in the measured space
- Desired placements conflict with hard bounds
- Inspect `state.solver.evaluation` reasons; shrink desired sizes or relax hard mins
- See [Constraints](./constraints.md) INVALID example

## Layout `DEGRADED`

- Hard bounds OK; one or more `minUseful*` missed (often after narrowing the board)
- Expected differentiation signal — not necessarily a bug
- Raise space, lower `minUseful*`, or accept degraded usefulness

## Drag rejected / unexpected

- Proposal violates hard constraints → solver may reject; previous layout kept
- Explicit drag omits `previous` by design — do not expect sticky old slots to override the drag
- Keyboard drag is not a validated product path

## Resize / reflow unexpected

- Passive resize may keep spatial continuity via `previous`
- Changing `desiredPlacements` should **not** pass stale `previous` (adapters handle this)
- No animation — jumps are immediate geometry updates

## Placements not applied

- Session disposed already (`DomAdapterError` on use-after-dispose paths)
- Merged styles overwritten layout properties (spread `…item.style` last)
- Absolute positioning expected; other layout modes are not the apply path

## React provider misuse

- Hooks outside provider → throw
- Rendering provider during SSR without client mount → not supported
- Importing internals / contexts → unsupported

## Cleanup / dispose

- Vanilla: call `session.dispose()` on teardown (`pagehide` / route leave)
- React: unmount provider
- Dispose does not restore prior inline styles

## Package import / type errors

- Use package roots only: `@dndgem/react`, `@dndgem/dom`, `@dndgem/core`
- ESM-only — no `require`
- Deep imports unsupported
- Packages not on public npm yet — use workspace / pack validation

## DomAdapterError codes (representative)

| Code                    | Typical cause                 |
| ----------------------- | ----------------------------- |
| `MISSING_CONTAINER`     | No container element          |
| `INVALID_SESSION_INPUT` | Bad items array / input shape |
| `DUPLICATE_ITEM_ID`     | Repeated ids                  |
| `INVALID_ELEMENT`       | Missing item element          |

`DomainError` covers malformed Core construction. Validity `INVALID` is **not** thrown — it is evaluation state.
