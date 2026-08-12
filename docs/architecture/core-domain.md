# Core Domain Model (DND-1.2)

Authoritative semantics for `@dndgem/core` domain types introduced in **DND-1.2**.

Related decisions: [ADR-0001](../adr/ADR-0001-renderer-agnostic-core.md), [ADR-0002](../adr/ADR-0002-content-constraint-validity-model.md), [ADR-0006](../adr/ADR-0006-layout-intent-vs-resolved-layout.md), [ADR-0008](../adr/ADR-0008-flutter-compatibility-principle.md).

## Purpose

Core defines the **renderer-independent language** later engines consume:

| Consumer (later)    | Uses Core for                                    |
| ------------------- | ------------------------------------------------ |
| DND-1.3 validity    | Constraints + geometry inputs                    |
| DND-1.4 solver      | Intent, space, items, placements                 |
| DND-1.5 DOM adapter | Normalized sizes / measurements into Core shapes |
| Future Flutter      | Same Core shapes without HTML/CSS semantics      |

Core does **not** decide which layout is best, classify VALID/DEGRADED/INVALID, measure the DOM, or drag items.

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
- Construction validates **input invariants** only — not layout validity scoring

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

### Validity vocabulary — `ValidityState`

Type-only union: `'VALID' | 'DEGRADED' | 'INVALID'` (ADR-0002).

**No** evaluation, scoring, penalties, or reason generation in DND-1.2.

## Numeric invariants (summary)

| Question                        | Decision                                      |
| ------------------------------- | --------------------------------------------- |
| Negative width/height?          | No                                            |
| Zero width/height?              | Yes                                           |
| NaN / Infinity?                 | No                                            |
| Negative x/y?                   | Yes (finite)                                  |
| min > max?                      | Rejected at construction                      |
| preferred outside geometric?    | Rejected when bounds present                  |
| minUseful vs geometric min/max? | Must lie within geometric bounds when present |
| Partial constraints?            | Yes                                           |
| Missing max representation?     | `undefined`                                   |
| Mutability?                     | Frozen plain objects from factories           |

Invalid construction throws `DomainError` with a stable `code` string.

## Public API

Import from the package root only:

```ts
import {
  createContentConstraints,
  createLayoutIntent,
  createLayoutItem,
  createResolvedLayout,
  LAYOUT_SCHEMA_VERSION,
} from '@dndgem/core';
```

Internal modules under `src/` are not a supported public surface.

## Explicit non-goals (DND-1.2)

- Validity engine / scoring (DND-1.3)
- Solver / reflow (DND-1.4)
- DOM measurement (DND-1.5)
- Drag/drop / dnd-kit (DND-1.6)
- React bindings (DND-1.7)
- Flutter / AI / cloud
