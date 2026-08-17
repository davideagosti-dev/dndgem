# Constraints & Validity

Constraints tell DnDGem what “fit” and “useful” mean for each item. They are the product’s differentiation from pure geometric layout.

## Three families (do not collapse them)

| Family     | Fields                                           | Role                                            |
| ---------- | ------------------------------------------------ | ----------------------------------------------- |
| Geometric  | `minWidth`, `maxWidth`, `minHeight`, `maxHeight` | **Hard** permissible dimensions                 |
| Usability  | `minUsefulWidth`, `minUsefulHeight`              | Below this → content fits but is less useful    |
| Preference | `preferredWidth`, `preferredHeight`              | Desirable sizes — score only, not hard validity |

All fields are optional. Partial constraints are normal.

Construction (`createContentConstraints`) validates ordering invariants (e.g. geometric min ≤ minUseful ≤ preferred ≤ geometric max when present). Malformed construction throws `DomainError`. Well-formed hard failures at evaluation time are `INVALID`, not exceptions.

## Hard requirement vs usability preference

| Kind                 | Fields          | Missed result                        |
| -------------------- | --------------- | ------------------------------------ |
| Hard geometric bound | `min*` / `max*` | `INVALID`                            |
| Usability threshold  | `minUseful*`    | `DEGRADED` (if hard bounds still OK) |
| Preference           | `preferred*`    | Score / preference reasons only      |

**Rule of thumb:** use `min*` for “must not be smaller/larger than this or the layout is unacceptable.” Use `minUseful*` for “technically ok, but content quality drops.” Use `preferred*` for “aim here when scoring.”

## VALID / DEGRADED / INVALID

| State      | Definition (actual Core semantics)                                  |
| ---------- | ------------------------------------------------------------------- |
| `VALID`    | Hard geometry satisfied **and** usefulness thresholds satisfied     |
| `DEGRADED` | Hard geometry satisfied; one or more `minUseful*` thresholds missed |
| `INVALID`  | One or more hard geometric bounds violated                          |

Severity when aggregating items: `INVALID` > `DEGRADED` > `VALID`.

### Why DEGRADED exists

Example: a cash-flow chart still meets `minWidth`, so it **fits**, but allocated width falls below `minUsefulWidth`, so the chart is less **useful**. That is `DEGRADED`, not `INVALID`.

```text
FIT ≠ USEFUL
```

### Why INVALID exists

Example: a transactions panel has `minHeight: 120` but the candidate only allocates `80` → hard violation → `INVALID`.

## How much should you constrain?

| Approach               | Guidance                                             |
| ---------------------- | ---------------------------------------------------- |
| Under-constrain        | Solver has freedom; may look “loose”                 |
| Balanced (recommended) | Hard mins for true floors; minUseful for quality     |
| Over-constrain         | Many candidates become INVALID; may yield poor/unsat |

Over-constrained layouts are not a special error type: the solver reports the best remaining candidate (possibly `INVALID` / unsatisfiable metadata). Opt-in Auto-Layout can propose placements for items without Source Intent; it does not invent a second validity language or override hard constraints. Published `@alpha` (`0.1.0-alpha.1`) includes this path (`autoLayout: true`).

## Authoring `LayoutIntent`

Via React/Vanilla you usually pass:

- `items[]` with `id` + `constraints`
- `desiredPlacements` map of id → `{ x, y, width, height }`

Core builds a `LayoutIntent` (space comes from measurement in the DOM session). Desired placement keys must refer to present items.

## Validated Core examples

### DEGRADED (usefulness miss, hard OK)

```ts
import {
  createContentConstraints,
  createItemId,
  createLayoutItem,
  createRect,
  evaluateItemPlacement,
} from '@dndgem/core';

const constraints = createContentConstraints({
  minWidth: 120,
  minUsefulWidth: 220,
  preferredWidth: 280,
});

const item = createLayoutItem({ id: createItemId('cashflow'), constraints });
const placement = createRect({ x: 0, y: 0, width: 160, height: 120 });
const evaluation = evaluateItemPlacement(item, placement);

// evaluation.state === 'DEGRADED'  (160 < minUsefulWidth 220, but >= minWidth 120)
```

### INVALID (hard min violated)

```ts
import {
  createContentConstraints,
  createItemId,
  createLayoutItem,
  createRect,
  evaluateItemPlacement,
} from '@dndgem/core';

const constraints = createContentConstraints({
  minWidth: 200,
  minHeight: 100,
});

const item = createLayoutItem({ id: createItemId('transactions'), constraints });
const placement = createRect({ x: 0, y: 0, width: 120, height: 100 });
const evaluation = evaluateItemPlacement(item, placement);

// evaluation.state === 'INVALID'  (width 120 < minWidth 200)
```

These snippets use public Core exports only. The React/Vanilla examples show the same states live when you resize the board (`examples/react`, `examples/vanilla`).

## Authoring burden (DND-2.3 assessment)

| Area                              | Burden | Evidence                                                                      |
| --------------------------------- | ------ | ----------------------------------------------------------------------------- |
| Constraint authoring              | MEDIUM | Multiple optional fields; ordering rules to learn                             |
| LayoutIntent / desired placements | MEDIUM | Explicit path still default; opt-in Auto-Layout on `@alpha` (`0.1.0-alpha.1`) |
| Debugging validity                | MEDIUM | State + reasons available; no dedicated UI debugger                           |

Phase 3 Auto-Layout (opt-in; published `0.1.0-alpha.1`) is the product answer to intent authoring burden — see [Vanilla](./vanilla.md) / [React](./react.md).
