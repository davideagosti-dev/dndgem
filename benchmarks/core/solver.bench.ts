/**
 * Core solver benchmarks (DND-1.8) — Vitest bench mode.
 *
 * Absolute wall-clock numbers are hardware-dependent evidence, not CI gates.
 * Semantic correctness is enforced by `core/*.test.ts` (pnpm bench:core:check).
 */
import { bench, describe } from 'vitest';
import { solveLayout } from '@dndgem/core';
import { SCENARIOS } from './fixtures.js';

describe('DND-1.8 core solver benchmarks — timing', () => {
  for (const scenario of SCENARIOS) {
    describe(`${scenario.id} (${scenario.itemCount} items, ${scenario.density})`, () => {
      bench(
        scenario.label,
        () => {
          // Rebuild each iteration so timings never depend on accidental mutation.
          solveLayout(scenario.build());
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
