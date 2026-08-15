# DX Findings Register (DND-2.3)

Findings from the Developer Experience & Documentation sprint. Severities:

- **BLOCKER** — normal developer cannot integrate from public docs/API alone
- **HIGH / MEDIUM / LOW** — friction, gaps, or polish

## Summary

```text
UNRESOLVED DX BLOCKERS: 0
```

## Findings

| ID     | Area             | Observed behavior                                                       | Developer impact                            | Severity | Resolution / Deferred                                                  |
| ------ | ---------------- | ----------------------------------------------------------------------- | ------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| DX-001 | Intent authoring | Developers must supply explicit `desiredPlacements` rectangles          | Slower first layout; easy to miss keys      | MEDIUM   | Documented; Auto-Layout deferred to Phase 3                            |
| DX-002 | Constraints      | Three constraint families with ordering rules                           | Learning curve before useful boards         | MEDIUM   | Constraints guide + examples                                           |
| DX-003 | Errors           | Validity is state, not thrown errors; few structured app-level messages | Debugging requires reading evaluation/state | LOW      | Troubleshooting guide; richer DX errors later                          |
| DX-004 | Publication      | Bare `npm i @dndgem/*` resolves `latest` (aliases Alpha)                | Docs must always show `@alpha`              | MEDIUM   | Documented; future stable owns `latest`                                |
| DX-005 | SSR              | Provider requires client mount; no Next/Remix guide                     | Framework SSR users may assume support      | MEDIUM   | Explicit non-claims in docs                                            |
| DX-006 | A11y / keyboard  | Pointer-only validated drag                                             | Keyboard users lack a product path          | MEDIUM   | DND-2.4 classified keyboard drag **DEFERRED**; see accessibility guide |
| DX-007 | Advanced DOM     | Many public primitives below `createLayoutSession`                      | Risk of over-assembling runtime             | LOW      | Marked ADVANCED in Vanilla guide                                       |
| DX-008 | Style apply      | Absolute positioning + merge-order sensitivity                          | Easy to override layout styles accidentally | LOW      | Documented merge rule in React/Quick Start                             |

## Authoring burden matrix

| Area                   | Burden     | Notes                                            |
| ---------------------- | ---------- | ------------------------------------------------ |
| Constraint authoring   | MEDIUM     | Clear once families are understood               |
| LayoutIntent authoring | HIGH       | Explicit placements; no Auto-Layout              |
| React integration      | LOW–MEDIUM | Thin hooks; provider registration discipline     |
| Vanilla integration    | LOW–MEDIUM | Session API is clear; cleanup must be remembered |
| Debugging              | MEDIUM     | State/reasons exist; no debugger UI              |

## DX verdicts

| Surface | Verdict                         |
| ------- | ------------------------------- |
| React   | **ACCEPTABLE WITH ROUGH EDGES** |
| Vanilla | **CLEAR HIGH-LEVEL PATH**       |

## Time-to-first-layout (estimate)

Once packages are installable in an app: approximately **10–15 minutes** for a competent React developer following Quick Start + example (package choice → provider → first `VALID` layout → resize). Intent rectangle authoring is the main non-trivial step.
