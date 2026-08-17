# Core Concepts

DnDGem is a **content-aware adaptive layout engine**. It is not merely a grid, a drag wrapper, or a React-only library.

Fundamental distinction:

```text
GEOMETRICALLY FITS  ≠  CONTENT REMAINS USEFUL
```

A chart can still “fit” in a narrow slot while becoming useless. DnDGem encodes that difference in constraints and validity.

## Pipeline

```text
content requirements
        ↓
constraints
        ↓
LayoutIntent
        ↓
candidate evaluation
        ↓
VALID / DEGRADED / INVALID
        ↓
scoring
        ↓
deterministic solver (solveLayout)
        ↓
ResolvedLayout
```

Today **you** supply items, constraints, and optional desired placements. With Auto-Layout **off** (default), desired rectangles are the explicit path. With Auto-Layout **on**, remaining items can be proposed automatically (`createAutoLayoutProposal` / session `autoLayout`). DnDGem still validates, scores, and solves through the same `solveLayout` authority.

## Vocabulary

| Concept            | Meaning                                                              |
| ------------------ | -------------------------------------------------------------------- |
| **Container**      | Layout space (measured width × height in the DOM adapter)            |
| **Item**           | A layout participant with an id and constraints                      |
| **Constraint**     | Geometric bounds, usefulness thresholds, and preferences             |
| **LayoutIntent**   | What you want: space + items + optional desired placements           |
| **Placement**      | A rectangle `{ x, y, width, height }` for one item                   |
| **Candidate**      | A possible resolved layout the solver considers (internal machinery) |
| **Evaluation**     | Per-item / aggregate `VALID` \| `DEGRADED` \| `INVALID` + score      |
| **ResolvedLayout** | Chosen space + placements after solve                                |
| **previous**       | Last committed layout used for _stability_ on passive continuation   |
| **desired**        | Explicit author/user placement intent                                |
| **Solver**         | Deterministic `solveLayout` selection among bounded candidates       |

Ordinary apps do not assemble candidate generation by hand. Prefer `createLayoutSession` (Vanilla) or `DnDGemProvider` (React).

## LayoutIntent vs ResolvedLayout

| Type             | Role                                       |
| ---------------- | ------------------------------------------ |
| `LayoutIntent`   | Input desire (author / drag / resize path) |
| `ResolvedLayout` | Output geometry the UI should apply        |

Drag and resize both end in a Core solve; they differ in whether **explicit new intent** or **environmental change** drives the solve (see [Drag, Resize & Reflow](./drag-resize-reflow.md)).

## Validity in one sentence each

| State      | Meaning                                                          |
| ---------- | ---------------------------------------------------------------- |
| `VALID`    | Hard geometry OK **and** usefulness thresholds satisfied         |
| `DEGRADED` | Hard geometry OK, but one or more `minUseful*` thresholds missed |
| `INVALID`  | One or more hard geometric bounds violated                       |

Preference misses (`preferredWidth` / `preferredHeight`) affect **score**, not validity alone.

Details and authoring guidance: [Constraints & Validity](./constraints.md).

## Determinism

For identical Core inputs, `solveLayout` produces identical outputs (candidates, ranking, winner, metadata). Do not assume bit-identical floating behavior across every JS engine beyond that contract; Alpha browser validation covers Chromium, Firefox, and WebKit desktop engines.

## Explainability (what you get today)

Public results expose:

- `solver.evaluation.state` — aggregate validity
- `solver.evaluation` score / reasons (see Core types)
- `solver.selection` metadata (why a candidate won)
- Session `phase` / drag proposal fields on the DOM session state

There is no separate visual debugger product in Alpha.

## What DnDGem is not (yet)

- Not AI layout (Phase 4)
- Not Flutter / Svelte (Vue and Angular: in-repo unpublished Framework Expansion adapters)
- Not a claim of full WCAG conformance or keyboard-drag productization (see [Accessibility](./accessibility.md))

See [Limitations](./limitations.md).
