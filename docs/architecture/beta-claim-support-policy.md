# Beta Claim & Support Policy

**Canonical** repository-level definition of what DnDGem **will** and **will not** claim for Beta readiness.

Sprint: **BETA-0.1** — Beta Claim & Support Policy.

This document is **policy only**. It does **not** authorize a Beta release, change package versions, create `@beta`, or publish `0.1.0-beta.0`.

```text
CURRENT RELEASE:     0.1.0-alpha.4 / @alpha
PRODUCT MATURITY:    BETA-CANDIDATE
BETA READINESS:      AUTHORIZED (program)
BETA RELEASE:        NOT AUTHORIZED
ALPHA.5:             NOT AUTHORIZED
PHASE 5:             NOT AUTHORIZED
```

Related living docs (detail, not competing claim matrices):

- [Limitations](../guides/limitations.md) — current Alpha honest boundaries
- [Browser Support](../guides/browser-support.md) — Alpha engine matrix
- [Accessibility](../guides/accessibility.md) — Alpha a11y baseline
- [Performance](../guides/performance.md) — contextual Core evidence
- [Alpha API Contract](./alpha-api-contract.md) — current public Alpha surface
- [Release Strategy](./release-strategy.md) — channels and publish mechanics
- [Roadmap](../roadmap.md)

---

## 1. Claim vocabulary

Every Beta claim in this policy uses one of:

| Term                        | Meaning                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| **SUPPORTED / CLAIMED**     | Part of the intended Beta product surface; consumers may rely on the documented behavior       |
| **VALIDATED**               | Covered by the project’s defined Beta validation evidence (e.g. desktop Playwright engines)    |
| **NOT CLAIMED**             | Explicitly outside Beta product claims; do not market or document as supported                 |
| **DEFERRED**                | Intentionally postponed; not a silent defect and not a Beta readiness blocker unless stated    |
| **CONSUMER RESPONSIBILITY** | Application / integrator owns the concern; DnDGem does not provide or rewrite it automatically |

Do **not** use vague language (“probably supported”, “should work on mobile”, “mostly accessible”).

---

## 2. Beta definition (intent)

Early Beta means:

```text
stabilized public surface + feedback acquisition
```

It does **not** mean:

- widespread external adoption
- SemVer 1.0 stability
- WCAG certification
- numeric performance SLAs
- every browser / device class

Lack of external Issues is **not** a Beta release blocker.

Current public channel remains **`@alpha`** / **`0.1.0-alpha.4`** until an authorized Beta release gate.

---

## 3. Core solver

| Concern                          | Beta status                                |
| -------------------------------- | ------------------------------------------ |
| `solveLayout`                    | **SUPPORTED / CLAIMED** — deterministic    |
| `evaluateLayout`                 | **SUPPORTED / CLAIMED** — deterministic    |
| `VALID` / `DEGRADED` / `INVALID` | **SUPPORTED / CLAIMED** — public semantics |
| Content constraints              | **SUPPORTED / CLAIMED**                    |
| Deterministic validation         | **AUTHORITATIVE** for final acceptance     |

Preserved distinction:

```text
GEOMETRICALLY FITS  ≠  CONTENT REMAINS USEFUL
```

DnDGem does **not** claim semantic usefulness beyond its documented constraints and scoring model.

---

## 4. Auto-Layout

| Concern     | Beta status                          |
| ----------- | ------------------------------------ |
| Auto-Layout | **SUPPORTED / CLAIMED** — opt-in     |
| Default     | **OFF** unless explicitly configured |

**NOT CLAIMED:**

- perfect packing
- universal optimal layout
- Pin / Lock / fixed / manual placement APIs
- automatic semantic DOM reorder to match visual layout

---

## 5. Planner

| Concern                 | Beta status                               |
| ----------------------- | ----------------------------------------- |
| Planner surface         | **SUPPORTED BETA TARGET**                 |
| Planner role            | **OPTIONAL / ADVISORY**                   |
| `replan()`              | **EXPLICIT** — consumer/session-initiated |
| Initial layout          | Does **not** wait for the planner         |
| Validation of proposals | **DETERMINISTIC** (Core)                  |
| Final layout resolution | **DETERMINISTIC** (Core)                  |

```text
Intelligence proposes.
Deterministic DnDGem validates and resolves.
```

**NOT CLAIMED:**

- that planner proposals must originate from a deterministic implementation
- that the planner runs automatically in drag / resize / pointermove / rAF / ResizeObserver / every-solve hot paths
- guaranteed layout improvement from any planner

Before a Beta release gate: **one canonical planner demonstration example** is required (product readiness input for later BETA-0.x / BETA-0.7 — not implemented in BETA-0.1).

---

## 6. Model / LLM boundary

| Concern                       | Beta status                        |
| ----------------------------- | ---------------------------------- |
| Model assistance              | **DEFERRED** / **NOT CLAIMED**     |
| LLM required for product use  | **NO**                             |
| OpenAI as public Beta feature | **NOT CLAIMED**                    |
| Hosted AI by DnDGem           | **NOT PROVIDED** / **NOT CLAIMED** |
| Public intelligence packages  | **NOT AUTHORIZED**                 |

Private workspace intelligence packages remain **outside** the public product. Do not advertise private package names as npm install targets.

---

## 7. Frameworks

### Beta validation targets

```text
Vanilla / DOM   (@dndgem/dom)
React           (@dndgem/react)
Vue             (@dndgem/vue)
Angular         (@dndgem/angular)
Svelte          (@dndgem/svelte)
```

### Compatibility environments (not packages)

```text
Next.js     → through @dndgem/react
Nuxt        → through @dndgem/vue
SvelteKit   → through @dndgem/svelte
```

There is no `@dndgem/next`, `@dndgem/nuxt`, or `@dndgem/sveltekit`.

### Angular Universal

```text
Angular Universal:  NOT VALIDATED · NOT CLAIMED · DEFERRED
```

Not a Beta readiness blocker.

---

## 8. Browsers

Proposed Beta support claim:

| Surface          | Classification        |
| ---------------- | --------------------- |
| Desktop Chromium | **VALIDATION TARGET** |
| Desktop Firefox  | **VALIDATION TARGET** |
| Desktop WebKit   | **VALIDATION TARGET** |

**Validation** means the project’s defined tested desktop browser-engine scope (Playwright desktop engine profiles), not certification of every shipping browser build.

**NOT CLAIMED:**

- every Chromium / Firefox / Safari version
- every Safari version on every OS
- every embedded WebView
- mobile browsers (see §9)

---

## 9. Mobile / touch

```text
MOBILE / TOUCH:  NOT VALIDATED · NOT CLAIMED · DEFERRED
```

Pointer Events on desktop engines do **not** constitute validated mobile support.

BETA-0.1 does not add mobile implementation or mobile tests.

---

## 10. Accessibility

| Capability                                  | Beta status             |
| ------------------------------------------- | ----------------------- |
| Pointer interaction (within Beta scope)     | **SUPPORTED / CLAIMED** |
| Escape cancellation                         | **SUPPORTED / CLAIMED** |
| Consumer-provided focus / ARIA preservation | **SUPPORTED BASELINE**  |

**NOT CLAIMED / DEFERRED:**

| Capability                               | Status                         |
| ---------------------------------------- | ------------------------------ |
| Keyboard drag                            | **NOT CLAIMED** / **DEFERRED** |
| Screen-reader drag announcements/product | **NOT CLAIMED** / **DEFERRED** |
| Automatic DOM reorder                    | **NOT PROVIDED**               |
| Automatic focus-order reorder            | **NOT PROVIDED**               |
| Automatic tab-order rewrite              | **NOT PROVIDED**               |
| Automatic ARIA rewrite                   | **NOT PROVIDED**               |
| Full WCAG certification                  | **NOT CLAIMED**                |

BETA-0.1 does not implement accessibility features.

---

## 11. DOM vs visual order

```text
visual layout order  ≠  automatic semantic DOM order
```

- Solved coordinates may diverge from DOM / tab / reading order.
- DnDGem does **not** reorder DOM nodes to match visual placement.
- Planner ordering concerns **layout / planning intent only**, not semantic document order.
- **CONSUMER RESPONSIBILITY:** semantic DOM, focus, and read order where the application requires them.

---

## 12. Performance

```text
PERFORMANCE:         QUALITATIVE / EVIDENCE-BASED
NUMERIC SLA:         NONE
FPS GUARANTEE:       NONE
LARGE-N GUARANTEE:   NONE
```

Allowed statements:

- deterministic Core has **benchmark evidence** under documented contexts
- planner stays **outside** interaction hot paths
- Beta validation may check **regression / evidence**, not contractual wall-clock numbers

Do **not** convert internal benchmark observations into product guarantees.

---

## 13. Large-N

```text
LARGE-N:  NOT VALIDATED AS A PRODUCT GUARANTEE · NOT CLAIMED · DEFERRED
```

No arbitrary item-count support ceiling is defined by this policy.

---

## 14. SSR

Distinguish:

```text
MODULE / IMPORT SSR SAFETY
  ≠
SERVER-SIDE LAYOUT SESSION EXECUTION
```

| Concern                                  | Beta status                                             |
| ---------------------------------------- | ------------------------------------------------------- |
| Module import without touching `window`  | Preserve current import / render compatibility evidence |
| Layout session against real DOM elements | Client / browser runtime                                |
| Server-side layout session execution     | **NOT CLAIMED** (no session against nonexistent DOM)    |

---

## 15. Meta-frameworks

| Environment | Classification                | Through adapter  |
| ----------- | ----------------------------- | ---------------- |
| Next.js     | **COMPATIBILITY ENVIRONMENT** | `@dndgem/react`  |
| Nuxt        | **COMPATIBILITY ENVIRONMENT** | `@dndgem/vue`    |
| SvelteKit   | **COMPATIBILITY ENVIRONMENT** | `@dndgem/svelte` |

No dedicated meta-framework packages.

---

## 16. Channel & version policy (planning intent only)

| Item                      | Status                                                                         |
| ------------------------- | ------------------------------------------------------------------------------ |
| Current supported channel | **`@alpha`**                                                                   |
| Current release           | **`0.1.0-alpha.4`**                                                            |
| Future Beta channel       | **`@beta`** — planning intent only; **not authorized** yet                     |
| `latest`                  | **NOT** the Alpha or Beta channel; **DO NOT MUTATE** for Beta                  |
| `0.1.0-beta.0`            | Target **only if** Beta readiness passes                                       |
| `0.1.0-alpha.5`           | Fallback **only if** readiness work reveals meaningful public contract changes |
| Version decision          | **NOT YET FINAL**                                                              |

```text
@beta DOES NOT EXIST as an authorized release channel yet.
Do not change install docs from @alpha to @beta in this readiness phase.
Do not publish, bump versions, or mutate dist-tags without an authorized release gate.
```

---

## 17. External adoption

Early Beta intent: **stabilized public surface + feedback acquisition**.

Do **not** claim existing widespread adoption. Do **not** treat absence of external Issues as a release blocker.

---

## 18. Deferred capability register

Explicitly **outside** current Beta readiness claims (not a Phase 5 roadmap):

```text
keyboard drag
screen-reader drag announcements
mobile / touch validation
Angular Universal
large-N guarantees
model assistance
OpenAI public integration
hosted AI
new framework adapters
Pin / Lock
Flutter
automatic accessibility reorder (DOM / focus / tab / ARIA)
major solver rewrite
public intelligence packages
```

---

## 19. Relationship to Alpha documentation

- Historical Alpha release notes and audits remain **historical**.
- Living Alpha guides remain the **current public product** documentation until Beta ships.
- This policy governs **Beta readiness claims** for subsequent BETA-0.x sprints.
- Do not duplicate this full matrix into every guide; prefer a pointer here.

Governing input for:

```text
BETA-0.2 — Public API Freeze Audit
BETA-0.3 — Planner Contract & DX Hardening
BETA-0.4 — Runtime Lifecycle / Race Hardening
BETA-0.5 — Documentation & Example Synchronization
BETA-0.6 — Browser / Accessibility / Performance Evidence Alignment
BETA-0.7 — Beta Release Readiness Audit
```

---

## 20. Explicit non-authorization

```text
BETA RELEASE:     NOT AUTHORIZED by this document
npm publish:      NOT AUTHORIZED
@beta channel:    NOT AUTHORIZED
0.1.0-beta.0:     NOT AUTHORIZED
0.1.0-alpha.5:    NOT AUTHORIZED
PHASE 5:          NOT AUTHORIZED
latest mutation:  NOT AUTHORIZED
```
