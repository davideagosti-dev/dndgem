/**
 * Collect median / p95 solve timings for the Technical MVP baseline report.
 * Run via: pnpm bench:core:stats
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
import { solveLayout } from '@dndgem/core';
import { SCENARIOS } from './fixtures.js';
import { median, percentile } from './stats.js';

const WARMUP = 25;
const ITERATIONS = 200;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('DND-1.8 core solver stats collector', () => {
  it('measures scenarios and writes benchmarks/results/technical-mvp.json', () => {
    const rows = [];

    for (const scenario of SCENARIOS) {
      const probe = solveLayout(scenario.build());
      expect(probe.evaluation.state, scenario.id).toBe(scenario.expectedState);
      if (scenario.expectedReflowed !== undefined) {
        expect(probe.reflowed, scenario.id).toBe(scenario.expectedReflowed);
      }
      if (scenario.expectedSelectionCode !== undefined) {
        expect(probe.selection.code, scenario.id).toBe(scenario.expectedSelectionCode);
      }

      for (let i = 0; i < WARMUP; i += 1) {
        solveLayout(scenario.build());
      }

      const samples: number[] = [];
      for (let i = 0; i < ITERATIONS; i += 1) {
        const input = scenario.build();
        const t0 = performance.now();
        solveLayout(input);
        const t1 = performance.now();
        samples.push(t1 - t0);
      }
      samples.sort((a, b) => a - b);
      const sum = samples.reduce((acc, v) => acc + v, 0);

      rows.push({
        id: scenario.id,
        label: scenario.label,
        itemCount: scenario.itemCount,
        density: scenario.density,
        operation: scenario.operation,
        scenarioClass: scenario.scenarioClass,
        state: probe.evaluation.state,
        reflowed: probe.reflowed,
        selectionCode: probe.selection.code,
        candidateCount: probe.candidates.length,
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
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      warmup: WARMUP,
      iterations: ITERATIONS,
      buildMode: 'packages/core/dist (compiled package output)',
      methodology:
        'Warm-up discarded; each timed iteration rebuilds SolverInput then calls solveLayout. Median and p95 over wall-clock ms via performance.now(). Absolute timings are hardware-dependent.',
      scenarios: rows,
    };

    const outDir = path.join(root, 'benchmarks', 'results');
    mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, 'technical-mvp.json');
    writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    // Human-readable CI / console table
    // eslint-disable-next-line no-console
    console.log('\nscenario\titems\tstate\tmedian_ms\tp95_ms\tcandidates');
    for (const row of rows) {
      // eslint-disable-next-line no-console
      console.log(
        `${row.id}\t${row.itemCount}\t${row.state}\t${row.medianMs.toFixed(4)}\t${row.p95Ms.toFixed(4)}\t${row.candidateCount}`,
      );
    }

    expect(rows.length).toBe(SCENARIOS.length);
  });
});
