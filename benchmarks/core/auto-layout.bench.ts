/**
 * DND-3.2 Auto-Layout proposal + solve benchmarks — Vitest bench mode.
 *
 * Absolute wall-clock numbers are hardware-dependent evidence, not CI gates.
 */
import { bench, describe } from 'vitest';
import { AUTO_SCENARIOS, proposeAndSolve } from './auto-layout-fixtures.js';

describe('DND-3.2 Auto-Layout benchmarks — timing', () => {
  for (const scenario of AUTO_SCENARIOS) {
    describe(`${scenario.id} (${scenario.itemCount} items)`, () => {
      bench(
        scenario.label,
        () => {
          proposeAndSolve(scenario.buildIntent());
        },
        {
          warmupIterations: 20,
          iterations: 100,
          time: 0,
        },
      );
    });
  }
});
