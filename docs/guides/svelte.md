# Svelte Guide

`@dndgem/svelte` is a **thin lifecycle adapter** over `@dndgem/dom` `createLayoutSession`. Solver semantics stay in `@dndgem/core`. Svelte adds no layout, Auto-Layout, provenance, or drag policy of its own.

## Publication status

Public Alpha **`0.1.0-alpha.3`** on npm dist-tag **`alpha`**.

```bash
npm install @dndgem/svelte@alpha
```

## Public API

| Export            | Role                                                        |
| ----------------- | ----------------------------------------------------------- |
| `DnDGemProvider`  | Renderless board owner; one `createLayoutSession`           |
| `dndgemContainer` | Action for the positioned container (`use:dndgemContainer`) |
| `dndgemItem`      | Action for one item id (`use:dndgemItem={'revenue'}`)       |
| `getDnDGem`       | `{ state, ready }` session stores for descendant components |

`getDnDGem` and the imported actions throw if used outside `DnDGemProvider`.

Snippet arguments from `DnDGemProvider` bind container/item actions and pass `state` / `ready` as plain reactive values (not stores). Descendant components that call `getDnDGem()` receive readable stores — rename `state` if you auto-subscribe (`const { state: layoutState } = getDnDGem()`) so `$layoutState` does not collide with the Svelte 5 `$state` rune.

Internal context keys are **not** public API.

`DnDGemProvider` is a renderless component: it provides board scope and renders the children snippet with **no wrapper DOM**. Multiple independent boards on one page are supported (one provider per board).

## Svelte version

Peer: **`svelte@^5.0.0`**. Svelte 5 only. Svelte 4 is not supported.

The adapter uses Svelte 5 runes inside `DnDGemProvider` (`$props`, `$effect`) and readable stores for session state. Host registration uses **actions**, not attachments.

## Setup

```svelte
<script lang="ts">
  import { DnDGemProvider, type DnDGemItemConfig } from '@dndgem/svelte';

  const items: readonly DnDGemItemConfig[] = [
    { id: 'revenue', constraints: { minWidth: 96, preferredWidth: 180 } },
  ];
  const desiredPlacements = { revenue: { x: 12, y: 12, width: 180, height: 88 } };
</script>

<DnDGemProvider {items} {desiredPlacements}>
  {#snippet children({ dndgemContainer, dndgemItem, state: layoutState, ready })}
    <div style="position: relative; width: 640px; height: 360px" use:dndgemContainer>
      <article use:dndgemItem={'revenue'}>
        Revenue · {ready ? layoutState?.solver.evaluation.state : '…'}
      </article>
    </div>
  {/snippet}
</DnDGemProvider>
```

`state` / `ready` on the children snippet are plain reactive values (`LayoutSessionState | undefined` and `boolean`). `getDnDGem()` returns readable stores of the same data for descendant components. Do not deep-mutate session snapshots. Validity remains `VALID` / `DEGRADED` / `INVALID` from Core — Svelte does not translate those enums.

Descendant components may call `getDnDGem()` and the imported actions. That path uses board-local context.

### Provider props

| Prop                  | Required | Notes                                                              |
| --------------------- | -------- | ------------------------------------------------------------------ |
| `items`               | yes      | `{ id, constraints? }[]`                                           |
| `desiredPlacements`   | no       | Explicit author placements; omit `previous` semantics when changed |
| `autoLayout`          | no       | Opt-in (`true`); default / omitted = explicit-only (mirrors DOM)   |
| children snippet      | yes      | Must register container + items via actions                        |
| `onChange`            | no       | `LayoutSessionState` updates                                       |
| `onDrop` / `onCancel` | no       | Drag outcomes                                                      |
| `mechanics`           | no       | **Advanced / tests** — replace drag mechanics                      |
| `ResizeObserver`      | no       | **Advanced / tests** — inject observer constructor                 |

## Container and item registration

Bind the consumer’s existing nodes. DnDGem does not wrap or replace them.

- Exactly one container per board
- Item ids must match declared `items`
- Registration may happen in any order
- The session starts only when the container **and every declared item** exist
- Unregister on teardown (action `destroy`)
- No `querySelector` / `MutationObserver` auto-discovery

## Opt-in Auto-Layout

Default is **off**. Pass `autoLayout={true}` for the automatic / hybrid path.

When Auto-Layout is on:

- `desiredPlacements` may be **partial or absent** (Source Intent)
- Svelte must not fabricate missing placements
- Accepted drag promotes **only** the active item to Source Intent (strong persistent intent — not a pin)
- Read `state.autoLayout?.proposalUnplacedItemIds` for Auto-Layout **proposal** completeness

```text
proposalUnplacedItemIds  ≠  solver INVALID
proposal completeness    ≠  “absent from ResolvedLayout”
```

## Optional advisory planner

Pass `planner` / `onPlannerEvent`; call store / context `replan()`. Shared contract: [Advisory Planner](./advisory-planner.md).

## Session recreation

There is no `session.update()`. Meaningful config changes dispose and recreate the DOM session (same policy as React/Vue/Angular):

| Change                                                 | Recreate? |
| ------------------------------------------------------ | --------- |
| Declared item set / item constraints                   | yes       |
| `desiredPlacements`                                    | yes       |
| `autoLayout` enablement                                | yes       |
| `mechanics` / `ResizeObserver` identity                | yes       |
| Callback identity (`onChange` / `onDrop` / `onCancel`) | **no**    |

If Svelte re-runs the session effect with the same config and the same host elements, the existing session is kept. Ordinary reactive updates and drag `onChange` emissions do not recreate the session.

With Auto-Layout **off**, a `desiredPlacements` change omits Core `previous` so ADR-0010 cannot suppress new author intent. With Auto-Layout **on**, `previous` is kept as a stability signal only.

## Cleanup

Destroying the provider calls `session.dispose()`. Observers and drag bindings are released. Layout inline styles are **not** restored. Returning to the page creates one new session after nodes re-register.

## SSR / client mount

- `import '@dndgem/svelte'` is safe without `window` / `document` (package test). Import does not create a session.
- Do **not** call `createLayoutSession` during server render. The provider creates the session only after real HTMLElements exist on the client. Svelte actions do not run during SSR.
- The component may render before DnDGem is `ready` (empty layout styles are allowed). This is **not** server-side resolved-layout hydration.
- Provider session creation is gated on client `onMount` (`$effect.root`). Svelte actions also do not run during SSR. SvelteKit production SSR of the compiled provider is validated (DND-FX.5).
- **SvelteKit is a validated compatibility environment** for `@dndgem/svelte` (no `@dndgem/sveltekit`, no SvelteKit plugin). Provider markup may SSR; the session starts after client mount. Do not claim server-side layout solving. See [Meta-frameworks](./meta-frameworks.md).

## Accessibility

Preserved Alpha baseline: pointer drag, Escape cancel, consumer `aria-*` / `tabindex` / descendants, no required wrapper, no DOM reorder. Deferred: keyboard drag product, screen-reader drag announcements, mobile/touch, full WCAG.

## Validated example

`examples/svelte` — dashboard-scale board with constraints, status (`VALID` / `DEGRADED` / `INVALID`), resize, pointer drag, partial Source Intent, and `proposalUnplacedItemIds`.

```bash
pnpm --filter @dndgem/example-svelte dev
```
