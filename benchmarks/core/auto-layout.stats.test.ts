/**
 * Collect median / p95 Auto-Layout proposal+solve timings for DND-3.2 evidence.
 * Run via: pnpm bench:core:stats (alongside Technical MVP collector).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
import { AUTO_SCENARIOS, proposeAndSolve } from './auto-layout-fixtures.js';
import { median, percentile } from './stats.js';

const WARMUP = 25;
const ITERATIONS = 200;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('DND-3.2 Auto-Layout stats collector', () => {
  it('measures scenarios and writes benchmarks/results/auto-layout-dnd-3.2.json', () => {
    const rows = [];

    for (const scenario of AUTO_SCENARIOS) {
      const probe = proposeAndSolve(scenario.buildIntent());
      expect(probe.result.evaluation.state, scenario.id).toBe(scenario.expectedState);

      for (let i = 0; i < WARMUP; i += 1) {
        proposeAndSolve(scenario.buildIntent());
      }

      const samples: number[] = [];
      for (let i = 0; i < ITERATIONS; i += 1) {
        const intent = scenario.buildIntent();
        const t0 = performance.now();
        proposeAndSolve(intent);
        const t1 = performance.now();
        samples.push(t1 - t0);
      }
      samples.sort((a, b) => a - b);
      const sum = samples.reduce((acc, v) => acc + v, 0);

      rows.push({
        id: scenario.id,
        label: scenario.label,
        itemCount: scenario.itemCount,
        scenarioClass: scenario.scenarioClass,
        state: probe.result.evaluation.state,
        selectionCode: probe.result.selection.code,
        candidateCount: probe.result.candidates.length,
        generatedCount: Object.keys(probe.proposal.generatedPlacements).length,
        unplacedCount: probe.proposal.unplacedItemIds.length,
        iterations: ITERATIONS,
        medianMs: median(samples),
        p95Ms: percentile(samples, 95),
        meanMs: sum / samples.length,
        minMs: samples[0]!,
        maxMs: samples[samples.length - 1]!,
      });
    }

    const payload = {
      capturedAt: new Date().toISOString().slice(0, 10),
      sprint: 'DND-3.2',
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      warmup: WARMUP,
      iterations: ITERATIONS,
      buildMode: 'packages/core/dist (compiled; internal auto-layout module + public solveLayout)',
      methodology:
        'Warm-up discarded; each timed iteration rebuilds LayoutIntent then createAutoLayoutProposal + solveLayout. Median and p95 over wall-clock ms via performance.now(). Absolute timings are hardware-dependent local evidence, not SLA.',
      scenarios: rows,
    };

    const outDir = path.join(root, 'benchmarks', 'results');
    mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, 'auto-layout-dnd-3.2.json');
    writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    // eslint-disable-next-line no-console
    console.log('\nscenario\titems\tstate\tmedian_ms\tp95_ms\tgenerated\tunplaced');
    for (const row of rows) {
      // eslint-disable-next-line no-console
      console.log(
        `${row.id}\t${row.itemCount}\t${row.state}\t${row.medianMs.toFixed(4)}\t${row.p95Ms.toFixed(4)}\t${row.generatedCount}\t${row.unplacedCount}`,
      );
    }

    expect(rows.length).toBe(AUTO_SCENARIOS.length);
  });
});
