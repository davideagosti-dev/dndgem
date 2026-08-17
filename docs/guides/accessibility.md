# Accessibility Baseline (Public Alpha)

Authoritative Public Alpha accessibility baseline for **DnDGem by DA62**.

Sprint evidence: **DND-2.4**. This is an honest **baseline**, not WCAG certification and not a complete keyboard or screen-reader drag product.

## Public Alpha accessibility baseline

```text
POINTER INTERACTION           — SUPPORTED
ESCAPE CANCELLATION           — SUPPORTED
FOCUS PRESERVATION (BASELINE) — SUPPORTED
CONSUMER ARIA SEMANTICS       — PRESERVED (DnDGem does not own content roles)
KEYBOARD DRAG                 — DEFERRED
SCREEN-READER DRAG UX         — DEFERRED
```

## Capability matrix

| Capability                       | Status                | Public Alpha claim                     | Notes                                                                     |
| -------------------------------- | --------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| Pointer drag                     | Supported             | Supported                              | Chromium / Firefox / WebKit e2e                                           |
| Escape cancellation              | Supported             | Supported                              | Cancels active drag; restores committed layout                            |
| Focus preservation               | Baseline supported    | Supported for ordinary usage           | Resize / cancel must not destroy external focus                           |
| Consumer ARIA semantics          | Preserved             | Consumer-owned; DnDGem must not strip  | React/Vue/Angular bindings attach to consumer hosts; layout is style-only |
| Keyboard drag                    | Deferred              | **Not claimed**                        | Provider may expose sensors; DnDGem has no productized keyboard path      |
| Screen-reader drag announcements | Deferred              | **Not claimed**                        | No DnDGem live-region product; provider plugins are not Alpha claims      |
| DOM / reading order              | Documented limitation | Visual order may differ from DOM order | Absolute positioning; DnDGem does not reorder DOM nodes                   |
| Mobile / touch                   | Not validated         | **Not claimed**                        | See [Browser Support](./browser-support.md)                               |

## Ownership model

### DnDGem responsibilities

- Pointer drag → Core `LayoutIntent` proposals and solver-driven commit/reject/cancel
- Escape cancel restore of the last committed layout
- Non-destructive layout apply (`position` / `left` / `top` / `width` / `height` / `boxSizing` only)
- Preserve consumer attributes and focusable descendants under ordinary resolve / resize / cancel
- Document honest Alpha limits

### Consumer responsibilities

- Semantic HTML for content (headings, buttons, forms, labels)
- Accessible names and roles for interactive controls
- Color contrast and forced-colors styling of consumer UI
- Meaningful **DOM order** for reading/tabbing when visual placement differs
- Non-drag alternatives (move up/down/reorder controls) when the product requires keyboard reordering
- Screen-reader workflow design for the application as a whole

Principle:

```text
DnDGem owns layout mechanics
consumer owns content semantics
```

## Keyboard drag decision

```text
DEFERRED
```

Rationale: `@dnd-kit/dom` may include `KeyboardSensor` and Accessibility plugins as **provider defaults**, but DnDGem does not expose, document, or validate a coherent keyboard-drag product path. Escape cancel during pointer drag is supported and is **not** the same as keyboard drag navigation.

Guidance if your product needs keyboard reordering before a future DnDGem keyboard path: provide consumer-owned controls that update `desiredPlacements` (or equivalent intent) without relying on drag sensors.

## Screen-reader decision

```text
DEFERRED
```

Scope: DnDGem does not productize drag-state announcements or live regions. Ordinary consumer content remains in the DOM and is not hidden by the apply path. Drag announcements are a post-Alpha enhancement unless a later sprint productizes them.

## Absolute positioning implications

Resolved items use absolute positioning inside a positioned container. Therefore:

- Visual placement can differ from DOM source order
- Tab / reading order follows DOM order, not solved coordinates
- DnDGem intentionally does **not** mutate DOM order to match visual layout

## Reduced motion / forced colors

DnDGem has no committed-layout animation framework. Reduced-motion policies primarily belong to consumer UI. Contrast of card chrome is consumer-owned; DnDGem does not supply decorative interaction skins that would be Alpha contrast blockers.

## Automated coverage

- Unit: React, Vue, and Angular adapters preserve consumer `aria-*` / `tabIndex` across resolve + cancel
- E2E (all Alpha engines): consumer `aria-label` retention, focus probe across resize, Escape cancel, post-drag content visibility

Automated checks prove non-destructive mechanics. They do **not** prove full accessibility.

Related:

- [Browser Support](./browser-support.md)
- [Limitations](./limitations.md)
- [Drag, Resize & Reflow](./drag-resize-reflow.md)
- [Alpha API Contract](../architecture/alpha-api-contract.md)
