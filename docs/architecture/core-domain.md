# Core Domain Model

Authoritative semantics for `@dndgem/core` domain types (DND-1.2) and validity/scoring (DND-1.3).

Related decisions: [ADR-0001](../adr/ADR-0001-renderer-agnostic-core.md), [ADR-0002](../adr/ADR-0002-content-constraint-validity-model.md), [ADR-0006](../adr/ADR-0006-layout-intent-vs-resolved-layout.md), [ADR-0008](../adr/ADR-0008-flutter-compatibility-principle.md), [ADR-0009](../adr/ADR-0009-validity-scoring-convention.md).

## Purpose

Core defines the **renderer-independent language** later engines consume:

| Consumer (later)    | Uses Core for                                    |
| ------------------- | ------------------------------------------------ |
| DND-1.3 validity    | Constraints + geometry → state + score           |
| DND-1.4 solver      | Intent, space, items, placements + evaluation    |
| DND-1.5 DOM adapter | Normalized sizes / measurements into Core shapes |
| Future Flutter      | Same Core shapes without HTML/CSS semantics      |

Core evaluates supplied placements. It does **not** generate candidates, reflow, measure the DOM, or drag items.

## Public concepts

### Identifiers — `ItemId`

- Stable, serializable string brand (`createItemId`)
- Not a DOM id, React key, or object identity
- Comparable with `itemIdsEqual`

### Geometry — `Point`, `Size`, `Rect`

- Abstract layout-space numbers (no `px` / `rem` / `vw`)
- `Size` / `Rect` widths and heights: finite, `>= 0` (zero allowed)
- Coordinates `x` / `y`: finite (may be negative)
- `NaN` and `±Infinity` rejected at construction
- Factories return frozen plain objects

### Layout space — `LayoutSpace`

- Available container area (`width` × `height`)
- Same numeric rules as `Size`; named separately for clarity

### Content constraints — `ContentConstraints`

Three **distinct** families (never collapse into one min/max model):

| Family     | Fields                                           | Meaning                                       |
| ---------- | ------------------------------------------------ | --------------------------------------------- |
| Geometric  | `minWidth`, `maxWidth`, `minHeight`, `maxHeight` | Permissible geometric dimensions              |
| Usability  | `minUsefulWidth`, `minUsefulHeight`              | Below this, content may fit but not be useful |
| Preference | `preferredWidth`, `preferredHeight`              | Desirable sizes (not hard validity bounds)    |

Rules:

- All fields optional (partial constraints allowed)
- Missing maxima use `undefined` (not `Infinity`)
- Present values: finite and `>= 0`
- When both sides exist:
  - geometric min ≤ geometric max
  - geometric min ≤ minUseful ≤ geometric max (per axis)
  - geometric min ≤ preferred ≤ geometric max (per axis)
  - minUseful ≤ preferred (per axis)
- Construction validates **input invariants** only

### Layout item — `LayoutItem`

```text
id + constraints + optional measuredSize
```

- No `HTMLElement`, React nodes, CSS, or renderer handles
- `measuredSize` is optional normalized size from an adapter (source opaque to Core)

### Layout intent vs resolved layout (ADR-0006)

| Type             | Role                                                                |
| ---------------- | ------------------------------------------------------------------- |
| `LayoutIntent`   | Author/desired structure: space, items, optional desired placements |
| `ResolvedLayout` | Output shape: space + placements                                    |

Both carry `schemaVersion` (`LAYOUT_SCHEMA_VERSION`, currently `1`). Persistence I/O is deferred; the version principle is established now.

Intent item ids must be unique. Desired placement keys must refer to present items.

## Validity evaluation (DND-1.3)

Product thesis encoded as executable Core behavior:

```text
GEOMETRICALLY FITS  ≠  CONTENT REMAINS USEFUL
```

### States

| State      | Meaning                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `VALID`    | Hard geometry satisfied and usefulness thresholds satisfied             |
| `DEGRADED` | Hard geometry satisfied, but one or more `minUseful*` thresholds missed |
| `INVALID`  | One or more hard geometric bounds violated                              |

Severity for aggregation (explicit map, not string/enum order):

```text
INVALID > DEGRADED > VALID
```

### Hard vs usability vs preference

| Constraint family | Affects validity?                        | Affects score? |
| ----------------- | ---------------------------------------- | -------------- |
| `min*` / `max*`   | Yes → `INVALID` when violated            | Yes (forced 0) |
| `minUseful*`      | Yes → `DEGRADED` when hard OK but missed | Yes            |
| `preferred*`      | No (never alone)                         | Yes            |

Aggregate item state:

```text
if any hard violation:     INVALID
else if any useful miss:   DEGRADED
else:                      VALID
```

Width and height are evaluated independently, then aggregated by worst severity. Preference misses emit reasons with `kind: 'preference'` but do not change state.

### Public evaluation API

- `evaluateItemPlacement(item, size)` — item + allocated size
- `evaluateConstraintsPlacement(constraints, size)` — constraints + size
- `evaluateLayout(intent, resolved)` — every intent item against resolved placements

Results are frozen plain objects: `{ state, score, reasons }` (layout also has `items`).

### Reason codes

Structured codes (`ValidityReasonCode`) are authoritative:

| Code                   | Kind       |
| ---------------------- | ---------- |
| `WIDTH_BELOW_MIN`      | hard       |
| `WIDTH_ABOVE_MAX`      | hard       |
| `HEIGHT_BELOW_MIN`     | hard       |
| `HEIGHT_ABOVE_MAX`     | hard       |
| `WIDTH_BELOW_USEFUL`   | usefulness |
| `HEIGHT_BELOW_USEFUL`  | usefulness |
| `WIDTH_OFF_PREFERRED`  | preference |
| `HEIGHT_OFF_PREFERRED` | preference |

### Domain errors vs layout invalidity

| Situation                         | Outcome                                  |
| --------------------------------- | ---------------------------------------- |
| Non-finite / negative size input  | `DomainError`                            |
| Missing placement for an item     | `DomainError` (`MISSING_PLACEMENT`)      |
| Placement for unknown item id     | `DomainError` (`UNKNOWN_PLACEMENT_ITEM`) |
| Well-formed size below `minWidth` | `ValidityState` `INVALID`                |

Empty intent item sets with empty placements evaluate to `VALID` with perfect score `1`.

### Scoring (ADR-0009)

- **Direction:** higher is better
- **Range:** each of `total`, `usefulness`, `preference` is finite and in `[0, 1]`
- **INVALID:** all three components are `0`
- **Non-invalid total:**  
  `total = SCORE_USEFULNESS_WEIGHT * usefulness + SCORE_PREFERENCE_WEIGHT * preference`  
  (`0.7` and `0.3`)

#### Per-axis usefulness

Let `floor = min ?? 0` for the axis.

- No `minUseful` → `1`
- `allocated >= minUseful` → `1`
- `allocated <= floor` → `0`
- else → `(allocated - floor) / (minUseful - floor)` clamped to `[0, 1]`

Item usefulness = mean of width and height axis scores.

#### Per-axis preference (target distance)

- No `preferred` → `1`
- Exact match → `1`
- Else → `1 - |allocated - preferred| / denom` clamped to `[0, 1]`

`denom` (normalization span):

- both min and max → `max(preferred - min, max - preferred)`
- only min → `max(preferred - min, preferred)` when `preferred > 0`, else `preferred - min`
- only max → `max(max - preferred, preferred)` when `preferred > 0`, else `max - preferred`
- neither → `preferred` when `preferred > 0`; otherwise only exact `0` scores `1`

Item preference = mean of width and height axis scores.

#### Layout aggregation

- `state` = most severe item state
- score components = arithmetic mean of per-item components
- Does not move, generate, or optimize placements

## Numeric invariants (summary)

| Question                        | Decision                                      |
| ------------------------------- | --------------------------------------------- |
| Negative width/height?          | No                                            |
| Zero width/height?              | Yes                                           |
| NaN / Infinity?                 | No (construction and scores)                  |
| Negative x/y?                   | Yes (finite)                                  |
| min > max?                      | Rejected at construction                      |
| preferred outside geometric?    | Rejected when bounds present                  |
| minUseful vs geometric min/max? | Must lie within geometric bounds when present |
| Partial constraints?            | Yes                                           |
| Missing max representation?     | `undefined`                                   |
| Mutability?                     | Frozen plain objects from factories/evaluate  |

Invalid construction / malformed evaluation input throws `DomainError` with a stable `code` string.

## Public API

Import from the package root only:

```ts
import {
  createContentConstraints,
  createLayoutIntent,
  createLayoutItem,
  createResolvedLayout,
  createSize,
  evaluateItemPlacement,
  evaluateLayout,
  LAYOUT_SCHEMA_VERSION,
} from '@dndgem/core';
```

Internal modules under `src/` are not a supported public surface.

## Explicit non-goals

- Solver / candidate generation / reflow (DND-1.4)
- Collision resolution / packing (DND-1.4)
- Layout stability / movement-cost scoring (DND-1.4)
- DOM measurement (DND-1.5)
- Drag/drop / dnd-kit (DND-1.6)
- React bindings (DND-1.7)
- Flutter / AI / cloud
