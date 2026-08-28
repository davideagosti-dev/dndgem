/**
 * Manual Node experiment harness for DND-4.4 Stage B.
 *
 * Usage:
 *   pnpm experiment:intelligence-openai
 *
 * Requires OPENAI_API_KEY in the local environment (BYOK).
 * Never prints the key. Not part of normal CI.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createDeterministicPlanningProposal,
  normalizePlanningProposal,
  type PlanningProposal,
} from '@dndgem/intelligence';
import {
  createOpenAILayoutPlanner,
  createOpenAISdkTransport,
  resolveExperimentModel,
  PROVIDER_PROMPT_VERSION,
  PROVIDER_OUTPUT_SCHEMA_VERSION,
  type ProviderTransportResult,
  type ProviderUsage,
} from '../src/index.js';
import { CORPUS_VERSION, LIVE_FIXTURES, type LiveFixtureId } from './corpus.js';
import {
  evaluateBaselineA,
  evaluateBaselineB,
  runCorePipeline,
  sourcePlacementsPreserved,
  toOutcomeLike,
  type PipelineResult,
} from './evaluate.js';
import { estimateCostUsd, EXPERIMENT_PRICING_VERSION } from './pricing.js';
import {
  isStrictlyBetter,
  isStrictlyWorse,
  LIVE_RUNS_PER_FIXTURE,
  RUBRIC_VERSION,
  SCHEMA_VALID_RATE_MIN,
  SUCCESS_RUBRIC_TEXT,
  type ExperimentClassification,
} from './rubric.js';

const root = dirname(fileURLToPath(import.meta.url));

interface RunRecord {
  readonly fixtureId: LiveFixtureId;
  readonly runIndex: number;
  readonly proposal: PlanningProposal;
  readonly normalizedProposal: PlanningProposal;
  readonly validity: string;
  readonly scoreTotal: number;
  readonly unplacedCount: number;
  readonly unplacedItemIds: readonly string[];
  readonly schemaValid: boolean;
  readonly fallbackUsed: boolean;
  readonly providerRequestMs: number;
  readonly plannerTotalMs: number;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly estimatedCost?: number;
  readonly sourcePreserved: boolean;
  readonly errorKind?: string;
}

function requireApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (typeof key !== 'string' || key.trim().length === 0) {
    console.error(
      'OPENAI_API_KEY is not set. Configure a consumer-owned key locally before running the live experiment.',
    );
    process.exit(2);
  }
  return key;
}

function summarizePipeline(label: string, result: PipelineResult): void {
  console.log(
    `  ${label}: unplaced=${result.unplacedCount} validity=${result.validity} score=${result.scoreTotal.toFixed(4)} order=[${result.normalizedProposal.automaticItemOrder.join(', ')}]`,
  );
}

function classify(input: {
  readonly schemaValidRate: number;
  readonly f2f5: ReadonlyMap<LiveFixtureId, { model: PipelineResult; baselineB: PipelineResult }>;
  readonly safety: ReadonlyMap<LiveFixtureId, { model: PipelineResult; baselineB: PipelineResult }>;
  readonly sourceOk: boolean;
}): ExperimentClassification {
  if (input.schemaValidRate < SCHEMA_VALID_RATE_MIN) {
    return 'CHANGE PROMPT/SCHEMA';
  }
  if (!input.sourceOk) {
    return 'DEFER MODEL ASSISTANCE';
  }

  let improved = false;
  let aggregateModelUnplaced = 0;
  let aggregateBaselineUnplaced = 0;
  let aggregateModelScore = 0;
  let aggregateBaselineScore = 0;
  let aggregateModelValidity = 0;
  let aggregateBaselineValidity = 0;

  for (const id of ['F2', 'F5'] as const) {
    const pair = input.f2f5.get(id);
    if (pair === undefined) continue;
    if (isStrictlyBetter(toOutcomeLike(pair.model), toOutcomeLike(pair.baselineB))) {
      improved = true;
    }
    aggregateModelUnplaced += pair.model.unplacedCount;
    aggregateBaselineUnplaced += pair.baselineB.unplacedCount;
    aggregateModelScore += pair.model.scoreTotal;
    aggregateBaselineScore += pair.baselineB.scoreTotal;
    aggregateModelValidity +=
      pair.model.validity === 'VALID' ? 2 : pair.model.validity === 'DEGRADED' ? 1 : 0;
    aggregateBaselineValidity +=
      pair.baselineB.validity === 'VALID' ? 2 : pair.baselineB.validity === 'DEGRADED' ? 1 : 0;
  }

  const aggregateStrictlyWorse =
    aggregateModelUnplaced > aggregateBaselineUnplaced ||
    (aggregateModelUnplaced === aggregateBaselineUnplaced &&
      (aggregateModelValidity < aggregateBaselineValidity ||
        (aggregateModelValidity === aggregateBaselineValidity &&
          aggregateModelScore < aggregateBaselineScore)));

  let safetyRegression = false;
  for (const id of ['F1', 'F3', 'F4'] as const) {
    const pair = input.safety.get(id);
    if (pair === undefined) continue;
    if (isStrictlyWorse(toOutcomeLike(pair.model), toOutcomeLike(pair.baselineB))) {
      safetyRegression = true;
    }
  }

  if (improved && !aggregateStrictlyWorse && !safetyRegression) {
    return 'KEEP';
  }
  if (!improved && !safetyRegression) {
    return 'DEFER MODEL ASSISTANCE';
  }
  if (safetyRegression) {
    return 'DEFER MODEL ASSISTANCE';
  }
  return 'MODEL VALUE INCONCLUSIVE';
}

async function main(): Promise<void> {
  const apiKey = requireApiKey();
  const model = resolveExperimentModel();
  console.log('DND-4.4 OpenAI model-assisted planning experiment');
  console.log(`model=${model} corpus=${CORPUS_VERSION} rubric=${RUBRIC_VERSION}`);
  console.log(SUCCESS_RUBRIC_TEXT);

  const capture = {
    result: undefined as ProviderTransportResult | undefined,
    usage: undefined as ProviderUsage | undefined,
  };

  const baseTransport = createOpenAISdkTransport({ apiKey, maxRetries: 0 });
  const capturingTransport = async (
    request: Parameters<typeof baseTransport>[0],
  ): Promise<ProviderTransportResult> => {
    const result = await baseTransport(request);
    capture.result = result;
    capture.usage = result.kind === 'ok' ? result.usage : undefined;
    return result;
  };

  const planner = createOpenAILayoutPlanner({
    transport: capturingTransport,
    model,
    timeoutMs: 3000,
    reasoningEffort: 'none',
    maxRetries: 0,
  });

  const baselines: Record<
    string,
    {
      A: ReturnType<typeof toOutcomeLike> & { order: readonly string[] };
      B: ReturnType<typeof toOutcomeLike> & { order: readonly string[] };
    }
  > = {};

  console.log('\nBaselines (computed before model evaluation):');
  for (const fixture of LIVE_FIXTURES) {
    const a = evaluateBaselineA(fixture.snapshot);
    const b = evaluateBaselineB(fixture.snapshot);
    baselines[fixture.id] = {
      A: { ...toOutcomeLike(a), order: a.normalizedProposal.automaticItemOrder },
      B: { ...toOutcomeLike(b), order: b.normalizedProposal.automaticItemOrder },
    };
    console.log(`\n${fixture.id} — ${fixture.purpose}`);
    summarizePipeline('Baseline A (declaration)', a);
    summarizePipeline('Baseline B (deterministic)', b);
  }

  const runs: RunRecord[] = [];
  let schemaValidCount = 0;
  let schemaAttemptCount = 0;

  console.log(`\nLive inference: ${LIVE_RUNS_PER_FIXTURE} runs × ${LIVE_FIXTURES.length} fixtures`);

  for (const fixture of LIVE_FIXTURES) {
    for (let runIndex = 1; runIndex <= LIVE_RUNS_PER_FIXTURE; runIndex += 1) {
      capture.result = undefined;
      capture.usage = undefined;
      const plannerStarted = performance.now();
      let proposal: PlanningProposal;
      let schemaValid = false;
      let fallbackUsed = false;
      let errorKind: string | undefined;
      let providerRequestMs = 0;

      const providerStarted = performance.now();
      try {
        proposal = await planner(fixture.snapshot, { requestId: runIndex });
        providerRequestMs = performance.now() - providerStarted;
        // Capture mutated asynchronously by transport; cast for CF analysis.
        const resultAfter = capture.result as ProviderTransportResult | undefined;
        schemaAttemptCount += 1;
        schemaValid = resultAfter !== undefined && resultAfter.kind === 'ok';
        if (schemaValid) {
          schemaValidCount += 1;
        } else {
          fallbackUsed = true;
          errorKind = resultAfter?.kind;
          proposal = normalizePlanningProposal(
            fixture.snapshot,
            createDeterministicPlanningProposal(fixture.snapshot),
          );
        }
      } catch (error) {
        providerRequestMs = performance.now() - providerStarted;
        fallbackUsed = true;
        const resultAfter = capture.result as ProviderTransportResult | undefined;
        errorKind =
          error !== null &&
          typeof error === 'object' &&
          'kind' in error &&
          typeof (error as { kind?: unknown }).kind === 'string'
            ? (error as { kind: string }).kind
            : 'provider_error';
        if (errorKind === 'schema_invalid' || resultAfter?.kind === 'schema_invalid') {
          schemaAttemptCount += 1;
          schemaValid = false;
        } else if (resultAfter?.kind === 'ok') {
          schemaAttemptCount += 1;
          schemaValid = true;
          schemaValidCount += 1;
        }
        // Auth/timeout/provider_error without a structured candidate: not a schema attempt.
        proposal = normalizePlanningProposal(
          fixture.snapshot,
          createDeterministicPlanningProposal(fixture.snapshot),
        );
      }

      const core = runCorePipeline(fixture.snapshot, proposal);
      const plannerTotalMs = performance.now() - plannerStarted;
      const usageAfter = capture.usage as ProviderUsage | undefined;
      const inputTokens = usageAfter?.inputTokens;
      const outputTokens = usageAfter?.outputTokens;
      const estimatedCost =
        inputTokens !== undefined && outputTokens !== undefined
          ? estimateCostUsd({ model, inputTokens, outputTokens })
          : undefined;

      const record: RunRecord = {
        fixtureId: fixture.id as LiveFixtureId,
        runIndex,
        proposal,
        normalizedProposal: core.normalizedProposal,
        validity: core.validity,
        scoreTotal: core.scoreTotal,
        unplacedCount: core.unplacedCount,
        unplacedItemIds: core.unplacedItemIds,
        schemaValid,
        fallbackUsed,
        providerRequestMs,
        plannerTotalMs,
        inputTokens,
        outputTokens,
        estimatedCost,
        sourcePreserved: sourcePlacementsPreserved(fixture.snapshot, core),
        errorKind,
      };
      runs.push(record);
      console.log(
        `  ${fixture.id} run ${runIndex}: schemaValid=${record.schemaValid} fallback=${record.fallbackUsed} unplaced=${record.unplacedCount} validity=${record.validity} ms=${record.providerRequestMs.toFixed(0)}`,
      );
    }
  }

  const f2f5 = new Map<LiveFixtureId, { model: PipelineResult; baselineB: PipelineResult }>();
  const safety = new Map<LiveFixtureId, { model: PipelineResult; baselineB: PipelineResult }>();
  let sourceOk = true;

  for (const fixture of LIVE_FIXTURES) {
    const fixtureRuns = runs.filter((run) => run.fixtureId === fixture.id);
    const chosen =
      fixtureRuns.find((run) => run.schemaValid && !run.fallbackUsed) ?? fixtureRuns[0]!;
    const modelResult = runCorePipeline(fixture.snapshot, chosen.proposal);
    const baselineB = evaluateBaselineB(fixture.snapshot);
    if (!sourcePlacementsPreserved(fixture.snapshot, modelResult)) {
      sourceOk = false;
    }
    const pair = { model: modelResult, baselineB };
    if (fixture.id === 'F2' || fixture.id === 'F5') {
      f2f5.set(fixture.id, pair);
    }
    if (fixture.id === 'F1' || fixture.id === 'F3' || fixture.id === 'F4') {
      safety.set(fixture.id, pair);
    }
  }

  const schemaValidRate = schemaAttemptCount === 0 ? 0 : schemaValidCount / schemaAttemptCount;
  const classification = classify({ schemaValidRate, f2f5, safety, sourceOk });

  const totalInput = runs.reduce((sum, run) => sum + (run.inputTokens ?? 0), 0);
  const totalOutput = runs.reduce((sum, run) => sum + (run.outputTokens ?? 0), 0);
  const totalCost = estimateCostUsd({
    model,
    inputTokens: totalInput,
    outputTokens: totalOutput,
  });

  const artifact = {
    experiment: 'dnd-4.4-model-assisted-planning',
    corpusVersion: CORPUS_VERSION,
    rubricVersion: RUBRIC_VERSION,
    promptVersion: PROVIDER_PROMPT_VERSION,
    schemaVersion: PROVIDER_OUTPUT_SCHEMA_VERSION,
    pricingVersion: EXPERIMENT_PRICING_VERSION,
    provider: 'openai',
    model,
    api: 'responses',
    structuredOutput: 'json_schema_strict',
    reasoningEffort: 'none',
    maxRetries: 0,
    runsPerFixture: LIVE_RUNS_PER_FIXTURE,
    baselines,
    runs,
    schemaValidRate,
    totals: {
      inputTokens: totalInput,
      outputTokens: totalOutput,
      estimatedCostUsd: totalCost,
    },
    classification,
    note: 'No API keys or auth headers are included in this artifact.',
  };

  const outDir = join(root, 'artifacts');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `live-results-${Date.now()}.json`);
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');

  console.log('\n=== Summary ===');
  console.log(`schemaValidRate=${(schemaValidRate * 100).toFixed(1)}%`);
  console.log(`classification=${classification}`);
  console.log(`tokens in/out=${totalInput}/${totalOutput} estimatedCostUsd=${totalCost ?? 'n/a'}`);
  console.log(`artifact=${outPath}`);
}

const isDirect =
  process.argv[1] !== undefined &&
  (process.argv[1].endsWith('run.ts') || process.argv[1].endsWith('run.js'));

if (isDirect) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Experiment failed: ${message}`);
    process.exit(1);
  });
}
