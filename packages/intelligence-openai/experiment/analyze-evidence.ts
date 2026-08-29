/**
 * Analyze live-results into safe committed luna-live-evidence.json.
 * Never prints secrets.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVE_FIXTURES } from './corpus.js';
import { runCorePipeline, sourcePlacementsPreserved } from './evaluate.js';
import { compareCoreOutcomes, type CoreOutcomeLike } from './rubric.js';

const artDir = join(dirname(fileURLToPath(import.meta.url)), 'artifacts');
const liveName = readdirSync(artDir).find(
  (n) => n.startsWith('live-results-') && n.endsWith('.json'),
);
if (liveName === undefined) {
  console.error('No live-results artifact found');
  process.exit(1);
}

const live = JSON.parse(readFileSync(join(artDir, liveName), 'utf8')) as {
  provider: string;
  model: string;
  api: string;
  structuredOutput: string;
  reasoningEffort: string;
  maxRetries: number;
  promptVersion: string;
  schemaVersion: string;
  rubricVersion: string;
  corpusVersion: string;
  pricingVersion: string;
  runsPerFixture: number;
  classification: string;
  totals: {
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
  };
  baselines: Record<
    string,
    {
      A: CoreOutcomeLike & { order: string[] };
      B: CoreOutcomeLike & { order: string[] };
    }
  >;
  runs: Array<{
    fixtureId: string;
    runIndex: number;
    proposal: { automaticItemOrder: string[] };
    normalizedProposal: { automaticItemOrder: string[] };
    validity: 'VALID' | 'DEGRADED' | 'INVALID';
    scoreTotal: number;
    unplacedCount: number;
    unplacedItemIds: string[];
    schemaValid: boolean;
    fallbackUsed: boolean;
    providerRequestMs: number;
    plannerTotalMs: number;
    inputTokens?: number;
    outputTokens?: number;
    estimatedCost?: number;
    sourcePreserved: boolean;
    errorKind?: string;
  }>;
};

function stats(values: number[]) {
  if (values.length === 0) {
    return { min: null, mean: null, median: null, p95: null, max: null };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
  const p95Index = Math.min(sorted.length - 1, Math.ceil(0.95 * sorted.length) - 1);
  return {
    min: sorted[0]!,
    mean,
    median,
    p95: sorted[p95Index]!,
    max: sorted[sorted.length - 1]!,
  };
}

function relLabel(model: CoreOutcomeLike, baseline: CoreOutcomeLike): 'BETTER' | 'EQUAL' | 'WORSE' {
  const c = compareCoreOutcomes(model, baseline);
  if (c > 0) return 'BETTER';
  if (c < 0) return 'WORSE';
  return 'EQUAL';
}

function layoutFingerprint(result: ReturnType<typeof runCorePipeline>): string {
  const placements: Record<string, unknown> = {};
  for (const [id, rect] of Object.entries(result.resolved.placements)) {
    placements[id] = {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
  }
  return JSON.stringify({
    validity: result.validity,
    scoreTotal: result.scoreTotal,
    unplacedCount: result.unplacedCount,
    unplacedItemIds: result.unplacedItemIds,
    order: result.normalizedProposal.automaticItemOrder,
    origins: result.placementOrigins,
    placements,
  });
}

const runs = live.runs;
const schemaValid = runs.filter((r) => r.schemaValid).length;
const fallbacks = runs.filter((r) => r.fallbackUsed);
const fallbackByKind: Record<string, number> = {};
for (const r of fallbacks) {
  const k = r.errorKind ?? 'other';
  fallbackByKind[k] = (fallbackByKind[k] ?? 0) + 1;
}

let sourceOk = true;
let replayOk = true;
let provenanceOk = true;
const replayFailures: string[] = [];
const provenanceFailures: string[] = [];
const fixtureReports: Record<string, unknown> = {};

for (const fixture of LIVE_FIXTURES) {
  const fixtureRuns = runs.filter((r) => r.fixtureId === fixture.id);
  const baselineA = live.baselines[fixture.id]!.A;
  const baselineB = live.baselines[fixture.id]!.B;

  const rawOrders = new Set<string>();
  const normOrders = new Set<string>();
  const layoutKeys = new Set<string>();
  const perRun: unknown[] = [];

  for (const run of fixtureRuns) {
    rawOrders.add(JSON.stringify(run.proposal.automaticItemOrder));
    normOrders.add(JSON.stringify(run.normalizedProposal.automaticItemOrder));

    const core = runCorePipeline(fixture.snapshot, run.proposal);
    layoutKeys.add(layoutFingerprint(core));

    if (!sourcePlacementsPreserved(fixture.snapshot, core)) {
      sourceOk = false;
    }

    // Provenance vocabulary check
    for (const origin of Object.values(core.placementOrigins)) {
      if (origin !== 'source' && origin !== 'generated') {
        provenanceOk = false;
        provenanceFailures.push(`${fixture.id}/${run.runIndex}:${origin}`);
      }
    }

    // For F3: every source desired placement must remain source origin
    if (fixture.id === 'F3') {
      const desired = fixture.snapshot.intent.desiredPlacements ?? {};
      for (const id of Object.keys(desired)) {
        if (core.placementOrigins[id] !== 'source') {
          provenanceOk = false;
          provenanceFailures.push(`${fixture.id}/${run.runIndex}:source-lost:${id}`);
        }
      }
    }

    const replayKeys: string[] = [];
    for (let i = 0; i < 5; i += 1) {
      const again = runCorePipeline(fixture.snapshot, run.normalizedProposal);
      replayKeys.push(layoutFingerprint(again));
    }
    if (new Set(replayKeys).size !== 1) {
      replayOk = false;
      replayFailures.push(`${fixture.id}/${run.runIndex}`);
    }

    const outcome: CoreOutcomeLike = {
      unplacedCount: run.unplacedCount,
      validity: run.validity,
      scoreTotal: run.scoreTotal,
    };

    perRun.push({
      runIndex: run.runIndex,
      schemaValid: run.schemaValid,
      fallbackUsed: run.fallbackUsed,
      errorKind: run.errorKind ?? null,
      unplacedCount: run.unplacedCount,
      unplacedItemIds: run.unplacedItemIds,
      validity: run.validity,
      scoreTotal: run.scoreTotal,
      order: run.normalizedProposal.automaticItemOrder,
      placementOrigins: core.placementOrigins,
      providerRequestMs: run.providerRequestMs,
      plannerTotalMs: run.plannerTotalMs,
      inputTokens: run.inputTokens ?? null,
      outputTokens: run.outputTokens ?? null,
      estimatedCostUsd: run.estimatedCost ?? null,
      sourcePreserved: sourcePlacementsPreserved(fixture.snapshot, core),
      vsBaselineA: relLabel(outcome, baselineA),
      vsBaselineB: relLabel(outcome, baselineB),
    });
  }

  const typedRuns = perRun as Array<{
    vsBaselineA: string;
    vsBaselineB: string;
  }>;

  // Equality rate = share of runs matching the most common fingerprint
  const countBy = (setKeys: string[]) => {
    const counts = new Map<string, number>();
    for (const k of setKeys) counts.set(k, (counts.get(k) ?? 0) + 1);
    let mode = 0;
    for (const c of counts.values()) mode = Math.max(mode, c);
    return fixtureRuns.length === 0 ? 1 : mode / fixtureRuns.length;
  };

  const normList = fixtureRuns.map((r) => JSON.stringify(r.normalizedProposal.automaticItemOrder));
  const layoutList = fixtureRuns.map((r) =>
    layoutFingerprint(runCorePipeline(fixture.snapshot, r.proposal)),
  );

  fixtureReports[fixture.id] = {
    purpose: fixture.purpose,
    baselineA: {
      unplacedCount: baselineA.unplacedCount,
      validity: baselineA.validity,
      scoreTotal: baselineA.scoreTotal,
      order: baselineA.order,
    },
    baselineB: {
      unplacedCount: baselineB.unplacedCount,
      validity: baselineB.validity,
      scoreTotal: baselineB.scoreTotal,
      order: baselineB.order,
    },
    runs: perRun,
    variance: {
      distinctRawProposals: rawOrders.size,
      distinctNormalizedProposals: normOrders.size,
      proposalEqualityRate: countBy(normList),
      distinctResolvedLayouts: layoutKeys.size,
      resolvedLayoutEqualityRate: countBy(layoutList),
    },
    summaryVsA: {
      better: typedRuns.filter((r) => r.vsBaselineA === 'BETTER').length,
      equal: typedRuns.filter((r) => r.vsBaselineA === 'EQUAL').length,
      worse: typedRuns.filter((r) => r.vsBaselineA === 'WORSE').length,
    },
    summaryVsB: {
      better: typedRuns.filter((r) => r.vsBaselineB === 'BETTER').length,
      equal: typedRuns.filter((r) => r.vsBaselineB === 'EQUAL').length,
      worse: typedRuns.filter((r) => r.vsBaselineB === 'WORSE').length,
    },
  };
}

const tsMatch = liveName.match(/(\d+)/);
const experimentDateTimeUtc = new Date(Number(tsMatch?.[1] ?? Date.now())).toISOString();

const evidence = {
  experiment: 'dnd-4.4-model-assisted-planning',
  status: 'DND-4.4 EVIDENCE COMPLETE — FINAL AUDIT PENDING',
  featureCommit: '9a5002ec167cd529603fbe4e7ca31fc979a64221',
  experimentDateTimeUtc,
  provider: live.provider,
  model: live.model,
  api: live.api,
  structuredOutput: live.structuredOutput,
  reasoningEffort: live.reasoningEffort,
  maxRetries: live.maxRetries,
  promptVersion: live.promptVersion,
  schemaVersion: live.schemaVersion,
  rubricVersion: live.rubricVersion,
  corpusVersion: live.corpusVersion,
  pricingVersion: live.pricingVersion,
  runsPerFixture: live.runsPerFixture,
  requestCounts: {
    intended: 25,
    executed: runs.length,
    schemaValidResponses: schemaValid,
    providerResponses: runs.length,
    fallbacks: fallbacks.length,
    timeouts: runs.filter((r) => r.errorKind === 'timeout').length,
  },
  schemaReliability: {
    numerator: schemaValid,
    denominator: runs.length,
    rate: schemaValid / runs.length,
    threshold: 0.9,
    pass: schemaValid / runs.length >= 0.9,
  },
  fallback: {
    count: fallbacks.length,
    rate: fallbacks.length / runs.length,
    byKind: fallbackByKind,
  },
  tokens: {
    inputTokens: live.totals.inputTokens,
    outputTokens: live.totals.outputTokens,
  },
  costEstimate: {
    estimatedTotalUsd: live.totals.estimatedCostUsd,
    estimatedAverageUsdPerRequest: live.totals.estimatedCostUsd / runs.length,
    label: 'estimate based on experiment-time pricing metadata',
    pricingVersion: live.pricingVersion,
  },
  latency: {
    providerRequestMs: stats(runs.map((r) => r.providerRequestMs)),
    plannerTotalMs: stats(runs.map((r) => r.plannerTotalMs)),
    timeouts: runs.filter((r) => r.errorKind === 'timeout').length,
  },
  replayDeterminism: {
    ok: replayOk,
    failures: replayFailures,
  },
  architecture: {
    sourcePreservationAllRuns: sourceOk,
    provenanceVocabularyOk: provenanceOk,
    provenanceFailures,
    allowedProvenance: ['source', 'generated'] as const,
    f3SourcePreserved: runs.filter((r) => r.fixtureId === 'F3').every((r) => r.sourcePreserved),
  },
  robustnessOffline: {
    F6: 'PASS (package tests: malformed → deterministic fallback)',
    F7: 'PASS (package tests: cancelled/stale → cannot apply)',
    F8: 'PASS (package tests: provider unavailable → deterministic fallback)',
  },
  fixtures: fixtureReports,
  classification: live.classification,
  note: 'No API keys, auth headers, or .env contents are included.',
  sourceLiveArtifact: liveName,
};

writeFileSync(join(artDir, 'luna-live-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);

console.log(`classification=${evidence.classification}`);
console.log(
  `schema=${evidence.schemaReliability.numerator}/${evidence.schemaReliability.denominator}`,
);
console.log(`replayOk=${replayOk}`);
console.log(`sourceOk=${sourceOk}`);
console.log(`provenanceOk=${provenanceOk}`);
console.log(`fallbacks=${fallbacks.length}`);
for (const id of ['F1', 'F2', 'F3', 'F4', 'F5'] as const) {
  const f = fixtureReports[id] as {
    summaryVsB: { better: number; equal: number; worse: number };
    variance: { distinctRawProposals: number; distinctResolvedLayouts: number };
  };
  console.log(
    `${id} vsB B/E/W=${f.summaryVsB.better}/${f.summaryVsB.equal}/${f.summaryVsB.worse} rawDistinct=${f.variance.distinctRawProposals} layoutDistinct=${f.variance.distinctResolvedLayouts}`,
  );
}
console.log('wrote luna-live-evidence.json');
