# Model-Assisted Planning Experiment (DND-4.4)

**Status:** `DND-4.4 COMPLETE`  
**Decision:** `DEFER MODEL ASSISTANCE`  
**Phase 4 disposition (DND-4.5):** Phase 4 **COMPLETE AND SHIPPED** in `0.1.0-alpha.4` — model assistance remains deferred; provider package stays private  
**Package:** `@dndgem/intelligence-openai` — **private experimental reference**, `0.0.0`, **unpublished**  
**Reference provider:** OpenAI (not an architecture dependency; not a supported public install)  
**Primary experiment model:** `gpt-5.6-luna` (configurable; not hardwired into generic planner contracts)  
**Live classification (Luna, frozen corpus):** `DEFER MODEL ASSISTANCE`

A valid outcome of this experiment is **DEFER MODEL ASSISTANCE** if the deterministic DND-4.2 planner performs as well or better. That outcome was observed on the frozen Luna run. DND-4.5 closed the Phase 4 decision gate without promoting model assistance or publishing the provider package.

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

Local convention: `OPENAI_API_KEY` (see `.env.example` placeholders only). Optional model override: `DNDGEM_OPENAI_MODEL`. The manual harness loads repository-root `.env.local` when present (gitignored; never commit secrets).

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

## Stage C — Luna live evidence (factual)

Safe committed summary: `packages/intelligence-openai/experiment/artifacts/luna-live-evidence.json`.

| Field                             | Value                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| Feature commit (frozen harness)   | `9a5002ec167cd529603fbe4e7ca31fc979a64221`                                                  |
| Experiment time (UTC)             | `2026-08-29T14:30:02.578Z`                                                                  |
| Model                             | `gpt-5.6-luna`                                                                              |
| Prompt / schema / rubric / corpus | `1.0.0` / `1.0.0` / `1.0.0` / `1.0.0`                                                       |
| Configuration                     | Responses API; strict JSON Schema; `reasoning.effort=none`; `maxRetries=0`; timeout 3000 ms |
| Methodology                       | 5 runs × F1–F5 = **25** live requests (no Terra/Sol; no post-hoc retune)                    |
| Schema reliability                | **25 / 25 (100%)** (threshold ≥ 90%)                                                        |
| Fallback (live)                   | **0 / 25**                                                                                  |
| Tokens                            | input **8120**, output **775**                                                              |
| Cost estimate                     | **~$0.00358** total (~$0.000143 / request) — experiment-time pricing `2026-08-28-estimate`  |
| providerRequestMs                 | min 884 · mean 1230 · median 1140 · p95 1591 · max 2637                                     |
| Replay determinism                | **PASS** (identical proposal + snapshot → identical Core result)                            |
| F3 source / provenance            | **PASS** (origins remain `source` \| `generated`; source placements preserved)              |
| F6–F8 robustness                  | **PASS** offline via fake transport package tests                                           |
| vs Baseline B (primary)           | F1–F5: all runs **EQUAL** (no BETTER on F2/F5)                                              |
| Classification                    | **`DEFER MODEL ASSISTANCE`**                                                                |

Interpretation: Luna produced reliable structured proposals and never regressed safety fixtures, but did not beat the DND-4.2 deterministic planner on Core metrics for the frozen order-sensitive fixtures. Deterministic-planner win is a valid experiment result. Luna proved the provider path technically viable and safe, but produced **zero** strict Core-layout improvements over Baseline B — therefore remote model inference is **not** justified as a default DnDGem capability.

---

## Meaning of `DEFER MODEL ASSISTANCE`

On the frozen corpus and rubric, this classification means:

- the OpenAI experiment **technically succeeded** (25/25 schema-valid; 0 live fallbacks; BYOK; no DnDGem-owned key)
- provider architecture was **safe** (advisory order only; Core remains authority; no second solver)
- Structured Outputs were **reliable**
- deterministic fallback / F6–F8 robustness **worked** (offline tests)
- downstream Core replay remained **deterministic**
- Luna added **no measurable Core-layout benefit** over the DND-4.2 deterministic planner (0 strict improvements vs Baseline B on F2/F5)
- therefore remote model inference is **not justified as a default DnDGem product capability** at this stage

It does **not** mean:

- AI can never help DnDGem
- the provider architecture is rejected
- `LayoutPlanner` / DND-4.3 should be removed or reverted
- the deterministic planner is theoretically globally optimal
- future model/provider experiments are forbidden

Conclusions stay bounded to collected evidence. Reopening model assistance requires a new evidence/decision gate. **Trying a larger model solely because Luna tied Baseline B is not sufficient evidence to reopen the experiment.** See [roadmap.md](../roadmap.md) reopen criteria (DND-4.5).

DND-4.5 closed Phase 4 as **COMPLETE AND SHIPPED** (`0.1.0-alpha.4`): accepted public surfaces are DND-4.2 / DND-4.3 only; `@dndgem/intelligence-openai` remains **PRIVATE EXPERIMENTAL REFERENCE**.

---

## CI separation

- Unit tests use **fake transport** only.
- No `OPENAI_API_KEY` in GitHub Actions.
- No paid inference in CI.
- Semantic benchmarks remain network-free.

---

## Public API / Changesets

DND-4.4 introduced **zero** public Core/DOM/adapter API changes and **no new public Changeset**. DND-4.2 / DND-4.3 Changesets were applied and published as `0.1.0-alpha.4`.

Do not publish `@dndgem/intelligence` or `@dndgem/intelligence-openai`. Keep `@dndgem/intelligence-openai` private in-tree for reproducibility and provider-reference evidence. DND-4.4 experiment is **COMPLETE** with classification **`DEFER MODEL ASSISTANCE`**. DND-4.5 decision gate is **COMPLETE** — Phase 4 **COMPLETE AND SHIPPED** in `0.1.0-alpha.4`.
