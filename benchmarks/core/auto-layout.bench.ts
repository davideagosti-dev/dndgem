/**
 * DND-3.2 / DND-3.3 Auto-Layout proposal + solve benchmarks — Vitest bench mode.
 *
 * Absolute wall-clock numbers are hardware-dependent evidence, not CI gates.
 */
import { bench, describe } from 'vitest';
import {
  ALL_AUTO_SCENARIOS,
  REFLOW_SEQUENCE_SCENARIOS,
  proposeAndSolve,
} from './auto-layout-fixtures.js';

describe('DND-3.2/3.3 Auto-Layout benchmarks — timing', () => {
  for (const scenario of ALL_AUTO_SCENARIOS) {
    describe(`${scenario.id} (${scenario.itemCount} items)`, () => {
      bench(
        scenario.label,
        () => {
          const intent = scenario.buildIntent();
          const previous = scenario.buildPrevious?.();
          proposeAndSolve(intent, previous);
        },
        {
          warmupIterations: 20,
          iterations: 100,
          time: 0,
        },
      );
    });
  }

  for (const scenario of REFLOW_SEQUENCE_SCENARIOS) {
    describe(`${scenario.id} (${scenario.itemCount} items)`, () => {
      bench(
        scenario.label,
        () => {
          scenario.run();
        },
        {
          warmupIterations: 10,
          iterations: 50,
          time: 0,
        },
      );
    });
  }
});
