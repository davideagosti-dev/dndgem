# Model-Assisted Planning Experiment (DND-4.4)

**Status:** EXPERIMENTAL — Stage B implementation in progress. Not COMPLETE until Final Audit.  
**Package:** `@dndgem/intelligence-openai` — **private**, `0.0.0`, **unpublished**  
**Reference provider:** OpenAI (not an architecture dependency)  
**Primary experiment model:** `gpt-5.6-luna` (configurable; not hardwired into generic planner contracts)

A valid outcome of this experiment is **DEFER MODEL ASSISTANCE** if the deterministic DND-4.2 planner performs as well or better.

---

## Purpose

Determine, with a frozen corpus and predefined rubric, whether a model-assisted planner provides enough measurable value beyond the deterministic local planner to justify further investment.

This is **not** a claim that AI is better. It is an evidence gate.

---

## Architecture

```text
LayoutPlanner
├── DeterministicLocalPlanner   (@dndgem/intelligence)
├── OpenAIPlanner               (@dndgem/intelligence-openai)  ← reference only
├── ConsumerPlanner
└── future provider planners
```

Dependency direction:

```text
@dndgem/core
      ↑
@dndgem/intelligence
      ↑
@dndgem/intelligence-openai   (openai SDK isolated here)
```

OpenAI types must not enter Core, DOM, React/Vue/Angular/Svelte, or generic intelligence contracts.

Compose the reference experiment through:

```ts
createOrchestratedLayoutPlanner(createOpenAILayoutPlanner({ ... }))
```

Failure chain:

```text
OpenAI planner
→ deterministic local planner
→ declaration-order Auto-Layout
→ Core solver (solveLayout / evaluateLayout)
```

---

## Core authority (unchanged)

Only:

```text
createAutoLayoutProposal → solveLayout → evaluateLayout
```

may determine authoritative geometry, validity, scoring, and final resolution.

The model proposes **`automaticItemOrder` only**. It must not author x/y, width/height, validity, score, placement origin, or Source Intent.

`PlacementOrigin` remains exactly `'source' | 'generated'`.

---

## BYOK / secret ownership

| Party                          | Owns                                                      |
| ------------------------------ | --------------------------------------------------------- |
| DnDGem library                 | **No API secret**                                         |
| Consumer / experiment operator | OpenAI account, project, `OPENAI_API_KEY`, billing, quota |
| OpenAI                         | Inference provider                                        |

Do **not** implement seller-owned keys, DnDGem inference proxies, token subsidies, browser-bundled secrets, or CI paid inference.

Local convention: `OPENAI_API_KEY` (see `.env.example` placeholders only). Optional model override: `DNDGEM_OPENAI_MODEL`.

---

## Server-only reference topology

Primary live harness:

```text
Node process → official OpenAI SDK → PlanningProposal → DnDGem deterministic pipeline
```

Web consumer topology (documented, not shipped as a DnDGem proxy):

```text
browser DnDGem app
→ consumer-owned backend
→ OpenAI
→ PlanningProposal
→ DnDGem deterministic pipeline
```

Do not place the live OpenAI planner inside the browser playground. Do not call OpenAI with a browser-held API key.

---

## Provider payload

`PlanningSnapshot` (generic DND-4.3) is unchanged. The OpenAI adapter derives a separate sanitized provider DTO:

- space dimensions
- automatic items: transient alias, constraints, optional prominence
- source items: aliased occupancy rects
- previous automatic placements: minimal stability geometry when present

**Not sent:** raw application ids (by default), DOM, HTML, CSS, textContent, ARIA, form values, URLs, credentials, Core scores, validity results.

**Semantic hint allowed:** `prominence` only (already exists). No natural-language content roles in this experiment.

**Identifier anonymization:** declaration-order aliases `item-0`, `item-1`, … → remap after response → normalize.

**Output:** `{ automaticItemOrder: string[] }` (aliased) — no geometry, score, prose, or chain-of-thought.

---

## OpenAI configuration (Stage B)

| Setting                     | Value                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------ |
| API                         | Responses API                                                                        |
| Structured output           | `text.format` JSON Schema, `strict: true`                                            |
| SDK                         | official `openai` JS/TS package                                                      |
| Default model               | `gpt-5.6-luna`                                                                       |
| Secondary (controlled only) | `gpt-5.6-terra`                                                                      |
| Reasoning                   | `reasoning.effort = none` (cheapest justified)                                       |
| Timeout                     | 3000 ms default (approx 1000–10000 configurable)                                     |
| Retries                     | **none** (`maxRetries: 0`)                                                           |
| Cancellation                | pass `PlannerContext.signal`; stale `requestId` guard remains final apply protection |

Do not automatically escalate Luna → Terra. Do not use `gpt-5.6-sol` by default.

---

## Hot-path exclusion

No provider call on pointermove, drag preview, rAF, ResizeObserver, passive resize, measurement, every solve, or accepted drop. Remote planning remains deliberate via DND-4.3 `replan()` / planner invocation.

---

## Experiment methodology

1. Freeze fixture corpus F1–F8 **before** any live OpenAI request.
2. Compute Baseline A (declaration-order Auto-Layout) and Baseline B (deterministic prominence planner).
3. Freeze success rubric (metric precedence: fewer unplaced → better validity → higher Core score).
4. Run live Luna inference: **5 runs × F1–F5** (25 primary calls) when `OPENAI_API_KEY` is available.
5. Capture proposals, usage, latency, Core outcomes — never keys.
6. Classify exactly one outcome: `KEEP` | `CHANGE MODEL` | `CHANGE PROMPT/SCHEMA` | `MODEL VALUE INCONCLUSIVE` | `DEFER MODEL ASSISTANCE`.

Manual command (not CI):

```bash
pnpm experiment:intelligence-openai
```

Ordinary gates (`pnpm test`, `pnpm build`, CI, …) must remain **network-free** and must not require an OpenAI account.

---

## Success rubric (frozen)

See `packages/intelligence-openai/experiment/rubric.ts` (`RUBRIC_VERSION`).

KEEP candidate only if order-sensitive fixtures F2/F5 show incremental Core value vs Baseline B without aggregate regression; safety fixtures F1/F3/F4 do not regress; schema-valid rate ≥ 90%; F6–F8 always fall back; architecture + replay hold.

---

## CI separation

- Unit tests use **fake transport** only.
- No `OPENAI_API_KEY` in GitHub Actions.
- No paid inference in CI.
- Semantic benchmarks remain network-free.

---

## Public API / Changesets

Stage B prefers **zero** public Core/DOM/adapter API changes and **no new public Changeset**. Existing unreleased DND-4.2 / DND-4.3 Changesets remain unapplied.

Do not publish `@dndgem/intelligence` or `@dndgem/intelligence-openai`. Do not mark DND-4.4 COMPLETE until Final Audit after live evidence review.
