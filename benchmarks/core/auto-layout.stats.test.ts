/**
 * Collect median / p95 Auto-Layout proposal+solve timings for DND-3.2 / DND-3.3 evidence.
 * Run via: pnpm bench:core:stats (alongside Technical MVP collector).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
import {
  ALL_AUTO_SCENARIOS,
  REFLOW_SEQUENCE_SCENARIOS,
  proposeAndSolve,
} from './auto-layout-fixtures.js';
import { median, percentile } from './stats.js';

const WARMUP = 25;
const ITERATIONS = 200;
const SEQ_WARMUP = 10;
const SEQ_ITERATIONS = 80;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('DND-3.2/3.3 Auto-Layout stats collector', () => {
  it('measures scenarios and writes benchmarks/results/auto-layout-dnd-3.3.json', () => {
    const rows = [];

    for (const scenario of ALL_AUTO_SCENARIOS) {
      const intent0 = scenario.buildIntent();
      const previous0 = scenario.buildPrevious?.();
      const probe = proposeAndSolve(intent0, previous0);
      expect(probe.result.evaluation.state, scenario.id).toBe(scenario.expectedState);

      for (let i = 0; i < WARMUP; i += 1) {
        proposeAndSolve(scenario.buildIntent(), scenario.buildPrevious?.());
      }

      const samples: number[] = [];
      for (let i = 0; i < ITERATIONS; i += 1) {
        const intent = scenario.buildIntent();
        const previous = scenario.buildPrevious?.();
        const t0 = performance.now();
        proposeAndSolve(intent, previous);
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
        hasPrevious: scenario.buildPrevious !== undefined,
        iterations: ITERATIONS,
        medianMs: median(samples),
        p95Ms: percentile(samples, 95),
        meanMs: sum / samples.length,
        minMs: samples[0]!,
        maxMs: samples[samples.length - 1]!,
      });
    }

    const sequenceRows = [];
    for (const scenario of REFLOW_SEQUENCE_SCENARIOS) {
      const probe = scenario.run();
      for (let i = 0; i < SEQ_WARMUP; i += 1) {
        scenario.run();
      }
      const samples: number[] = [];
      for (let i = 0; i < SEQ_ITERATIONS; i += 1) {
        const t0 = performance.now();
        scenario.run();
        const t1 = performance.now();
        samples.push(t1 - t0);
      }
      samples.sort((a, b) => a - b);
      const sum = samples.reduce((acc, v) => acc + v, 0);
      sequenceRows.push({
        id: scenario.id,
        label: scenario.label,
        itemCount: scenario.itemCount,
        scenarioClass: scenario.scenarioClass,
        cycleCount: probe.results.length,
        finalState: probe.results[probe.results.length - 1]!.evaluation.state,
        iterations: SEQ_ITERATIONS,
        medianMs: median(samples),
        p95Ms: percentile(samples, 95),
        meanMs: sum / samples.length,
        minMs: samples[0]!,
        maxMs: samples[samples.length - 1]!,
      });
    }

    const payload = {
      capturedAt: new Date().toISOString().slice(0, 10),
      sprint: 'DND-3.3',
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      warmup: WARMUP,
      iterations: ITERATIONS,
      sequenceWarmup: SEQ_WARMUP,
      sequenceIterations: SEQ_ITERATIONS,
      buildMode: 'packages/core/dist (compiled; internal auto-layout module + public solveLayout)',
      methodology:
        'Warm-up discarded; each timed iteration rebuilds LayoutIntent (+ optional previous) then createAutoLayoutProposal + solveLayout. Sequence scenarios time multi-cycle propose→solve chains. Median and p95 over wall-clock ms via performance.now(). Absolute timings are hardware-dependent local evidence, not SLA.',
      scenarios: rows,
      sequences: sequenceRows,
    };

    const outDir = path.join(root, 'benchmarks', 'results');
    mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, 'auto-layout-dnd-3.3.json');
    writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    // eslint-disable-next-line no-console
    console.log('\nscenario\titems\tstate\tprev\tmedian_ms\tp95_ms\tgenerated\tunplaced');
    for (const row of rows) {
      // eslint-disable-next-line no-console
      console.log(
        `${row.id}\t${row.itemCount}\t${row.state}\t${row.hasPrevious}\t${row.medianMs.toFixed(4)}\t${row.p95Ms.toFixed(4)}\t${row.generatedCount}\t${row.unplacedCount}`,
      );
    }
    // eslint-disable-next-line no-console
    console.log('\nsequence\tcycles\titems\tfinal\tmedian_ms\tp95_ms');
    for (const row of sequenceRows) {
      // eslint-disable-next-line no-console
      console.log(
        `${row.id}\t${row.cycleCount}\t${row.itemCount}\t${row.finalState}\t${row.medianMs.toFixed(4)}\t${row.p95Ms.toFixed(4)}`,
      );
    }

    expect(rows.length).toBe(ALL_AUTO_SCENARIOS.length);
    expect(sequenceRows.length).toBe(REFLOW_SEQUENCE_SCENARIOS.length);
  });
});
