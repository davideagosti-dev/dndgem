/**
 * Offline baseline freeze for F1–F5 (no OpenAI).
 * Run: pnpm --filter @dndgem/intelligence-openai exec tsx experiment/compute-baselines.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CORPUS_VERSION, LIVE_FIXTURES } from './corpus.js';
import { evaluateBaselineA, evaluateBaselineB, toOutcomeLike } from './evaluate.js';
import { RUBRIC_VERSION, SUCCESS_RUBRIC_TEXT } from './rubric.js';

const root = dirname(fileURLToPath(import.meta.url));

const fixtures = LIVE_FIXTURES.map((fixture) => {
  const a = evaluateBaselineA(fixture.snapshot);
  const b = evaluateBaselineB(fixture.snapshot);
  return {
    id: fixture.id,
    purpose: fixture.purpose,
    baselineA: {
      ...toOutcomeLike(a),
      unplacedItemIds: a.unplacedItemIds,
      order: a.normalizedProposal.automaticItemOrder,
      resolvedPlacements: a.resolved.placements,
    },
    baselineB: {
      ...toOutcomeLike(b),
      unplacedItemIds: b.unplacedItemIds,
      order: b.normalizedProposal.automaticItemOrder,
      resolvedPlacements: b.resolved.placements,
    },
  };
});

const artifact = {
  corpusVersion: CORPUS_VERSION,
  rubricVersion: RUBRIC_VERSION,
  frozenAt: 'pre-live-inference',
  successRubric: SUCCESS_RUBRIC_TEXT,
  fixtures,
};

const outDir = join(root, 'artifacts');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'baselines-frozen.json');
writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
console.log(`Frozen baselines written to ${outPath}`);
