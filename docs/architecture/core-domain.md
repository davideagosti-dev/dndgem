# Core Domain Model

Authoritative semantics for `@dndgem/core` domain types (DND-1.2) and validity/scoring (DND-1.3).

Related decisions: [ADR-0001](../adr/ADR-0001-renderer-agnostic-core.md), [ADR-0002](../adr/ADR-0002-content-constraint-validity-model.md), [ADR-0003](../adr/ADR-0003-deterministic-solver.md), [ADR-0006](../adr/ADR-0006-layout-intent-vs-resolved-layout.md), [ADR-0008](../adr/ADR-0008-flutter-compatibility-principle.md), [ADR-0009](../adr/ADR-0009-validity-scoring-convention.md), [ADR-0010](../adr/ADR-0010-adaptive-solver-selection-policy.md), [ADR-0012](../adr/ADR-0012-vendor-isolated-drag-interaction.md).

## Purpose

Core defines the **renderer-independent language** later engines consume:

| Consumer            | Uses Core for                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------- |
| DND-1.3 validity    | Constraints + geometry → state + score                                                    |
| DND-1.4 solver      | Intent + optional previous → resolved + metadata                                          |
| DND-1.5 DOM measure | Normalized sizes / measurements into Core shapes ([dom-adapter.md](./dom-adapter.md))     |
| DND-1.6 DOM drag    | `LayoutIntent` proposals composed with `solveLayout` ([dom-adapter.md](./dom-adapter.md)) |
| Future Flutter      | Same Core shapes without HTML/CSS semantics                                               |

Core evaluates supplied placements and (from DND-1.4) selects among bounded candidates. It does **not** measure the DOM or drag items. `@dndgem/dom` acquires browser geometry (DND-1.5) and drag proposals (DND-1.6) and maps them onto these Core shapes.

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

## Adaptive solver (DND-1.4)

Public entry: `solveLayout({ intent, previous? })` → `SolverResult`.

Pipeline:

```text
LayoutIntent (+ optional previous ResolvedLayout)
  → bounded candidate generation
  → evaluateLayout (DND-1.3) per candidate
  → rank (validity → score → stability → ordinal)
  → ResolvedLayout + selection metadata
```

### Candidate generation

Deterministic named strategies (internal generation policy), in fixed order:

- `preserve-previous` / `preserve-desired` when sources cover all items (sizes shrunk to current space/max when needed)
- `row-*` / `column-*` packs under `preferred`, `useful`, and `minimal` sizing modes

No randomness, wall-clock, DOM, or unbounded search.

### Ranking (ADR-0010)

```text
1. VALID > DEGRADED > INVALID
2. higher score.total
3. lower stability distance vs previous
4. lower generation ordinal
```

Stability never protects `INVALID` over a better validity tier.

### Reflow & unsatisfiable

- `reflowed` is true when `previous` was provided and the winner differs from it
- All-`INVALID` → best deterministic `INVALID` result (`UNSATISFIABLE`), not `DomainError`
- Malformed solver input → `DomainError`
- Empty intent → `VALID` / score `1` (same policy as evaluation)

### Explainability

`SolverResult` includes `winnerId`, `selection` (code + detail), `reflowed`, `evaluation`, and compact `candidates` summaries. Internal generators/comparators are not public.

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
  solveLayout,
  LAYOUT_SCHEMA_VERSION,
} from '@dndgem/core';
```

Internal modules under `src/` are not a supported public surface.

## Explicit non-goals

- DOM measurement lives in `@dndgem/dom` (DND-1.5); Core still has no DOM types
- Drag/drop lives in `@dndgem/dom` (DND-1.6) as intent proposals; Core still has no provider types
- React bindings (DND-1.7)
- Generic CSP/SAT solvers, random/AI search
- Flutter / AI / cloud

## Phase 3 Auto-Layout (contract)

Deterministic Adaptive Auto-Layout (Phase 3) is defined as intent enrichment composed with existing `solveLayout` — not a second solver. Provenance (Source Intent vs Generated Placement vs Effective Solver Input) is mandatory. See [auto-layout-contract.md](./auto-layout-contract.md), [auto-layout-engine.md](./auto-layout-engine.md), and [ADR-0014](../adr/ADR-0014-auto-layout-enrichment-provenance.md). DND-3.2 implements the Core proposal engine as **INTERNAL** (not publicly frozen).
