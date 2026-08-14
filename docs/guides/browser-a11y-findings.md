# Browser & Accessibility Findings (DND-2.4)

Evidence register for the Public Alpha browser matrix and accessibility baseline.

Severities: **BLOCKER** / **HIGH** / **MEDIUM** / **LOW**.

## Summary

```text
UNRESOLVED BROWSER BLOCKERS FOR SUPPORTED ENGINES: 0
UNRESOLVED ACCESSIBILITY BLOCKERS: 0
```

## Browser findings

| ID     | Browser | Finding                                                     | Severity | Root cause                       | Resolution / deferred                               | Alpha impact                        |
| ------ | ------- | ----------------------------------------------------------- | -------- | -------------------------------- | --------------------------------------------------- | ----------------------------------- |
| BR-001 | All     | Historical evidence was Chromium-only                       | HIGH     | Phase 1 / early Phase 2 scope    | Expanded Playwright projects + promotion CI install | Closed — matrix supported for Alpha |
| BR-002 | Mobile  | Touch / mobile browsers not in automated matrix             | MEDIUM   | Explicit Alpha boundary          | Documented **NOT VALIDATED**                        | Honest non-claim                    |
| BR-003 | Engines | Playwright desktop engines ≠ every shipping browser version | LOW      | Engine-level automation boundary | Documented in browser-support guide                 | No false universal claim            |

## Accessibility findings

| ID       | Area          | Finding                                                               | Severity | Resolution / deferred                                                    | Alpha impact                    |
| -------- | ------------- | --------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------ | ------------------------------- |
| A11Y-001 | Keyboard drag | No DnDGem-productized keyboard drag path                              | MEDIUM   | Classified **DEFERRED**; Escape cancel remains supported                 | Explicit Alpha limitation       |
| A11Y-002 | Screen reader | No DnDGem drag live-region / announcement product                     | MEDIUM   | Classified **DEFERRED**; consumer content remains in DOM                 | Explicit Alpha limitation       |
| A11Y-003 | DOM order     | Absolute positioning can diverge from DOM/tab order                   | MEDIUM   | Documented; no automatic DOM reorder                                     | Consumer guidance               |
| A11Y-004 | Provider a11y | `@dnd-kit` KeyboardSensor / Accessibility plugin remain provider-side | LOW      | Do not claim as DnDGem product features                                  | Honest ownership split          |
| A11Y-005 | Focus         | Need evidence DnDGem mechanics do not destroy ordinary focus          | HIGH     | E2E focus probe across resize; React unit preserves aria/tabIndex        | Closed for Alpha baseline scope |
| A11Y-006 | Consumer ARIA | Risk of library overwriting consumer semantics                        | HIGH     | Apply path style-only; React binding style-only; e2e + unit preservation | Closed — preserved              |

## Decisions carried to DND-2.5

Release-notes inputs:

```text
SUPPORTED FOR PUBLIC ALPHA
- Chromium / Firefox / WebKit desktop engines (Playwright-validated)
- Pointer drag, drop commit, Escape cancel, resize/reflow
- Baseline focus preservation and consumer ARIA preservation

SUPPORTED WITH LIMITATIONS
- DOM order may differ from visual placement
- Provider keyboard/ARIA plugins are not DnDGem product claims

DEFERRED / NOT VALIDATED
- Keyboard drag product
- Screen-reader drag announcements
- Mobile / touch certification
- Full WCAG conformance program
```
