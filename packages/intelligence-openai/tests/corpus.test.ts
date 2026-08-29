import {
  createAutoLayoutProposal,
  createContentConstraints,
  createLayoutIntent,
  createLayoutItem,
  solveLayout,
} from '@dndgem/core';
import { createOrchestratedLayoutPlanner, normalizePlanningProposal } from '@dndgem/intelligence';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createFakeOpenAITransport, createOpenAILayoutPlanner } from '../src/index.js';
import { EXPERIMENT_CORPUS, getFixture } from '../experiment/corpus.js';
import {
  evaluateBaselineA,
  evaluateBaselineB,
  runCorePipeline,
  sourcePlacementsPreserved,
} from '../experiment/evaluate.js';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('corpus freeze F1–F8', () => {
  it('defines all fixtures with purposes', () => {
    expect(EXPERIMENT_CORPUS.map((f) => f.id)).toEqual([
      'F1',
      'F2',
      'F3',
      'F4',
      'F5',
      'F6',
      'F7',
      'F8',
    ]);
    for (const fixture of EXPERIMENT_CORPUS) {
      expect(fixture.purpose.length).toBeGreaterThan(10);
    }
  });

  it('computes Baseline A and Baseline B offline for F1–F5', () => {
    for (const id of ['F1', 'F2', 'F3', 'F4', 'F5'] as const) {
      const fixture = getFixture(id);
      const a = evaluateBaselineA(fixture.snapshot);
      const b = evaluateBaselineB(fixture.snapshot);
      expect(a.validity).toMatch(/VALID|DEGRADED|INVALID/);
      expect(b.validity).toMatch(/VALID|DEGRADED|INVALID/);
      expect(Array.isArray(a.unplacedItemIds)).toBe(true);
      expect(Array.isArray(b.unplacedItemIds)).toBe(true);
    }
  });

  it('F3 preserves source placements under Baseline B', () => {
    const fixture = getFixture('F3');
    const b = evaluateBaselineB(fixture.snapshot);
    expect(sourcePlacementsPreserved(fixture.snapshot, b)).toBe(true);
    expect(b.placementOrigins['pinned-nav']).toBe('source');
  });
});

describe('F6–F8 robustness via fake transport + orchestrator', () => {
  it('F6 malformed → deterministic layout', async () => {
    const fixture = getFixture('F6');
    const openai = createOpenAILayoutPlanner({
      transport: createFakeOpenAITransport(async () => ({
        kind: 'schema_invalid',
        message: 'malformed',
      })),
    });
    const proposal = await createOrchestratedLayoutPlanner(openai)(fixture.snapshot, {
      requestId: 1,
    });
    const core = runCorePipeline(fixture.snapshot, proposal);
    expect(core.normalizedProposal.automaticItemOrder.length).toBeGreaterThan(0);
  });

  it('F8 provider unavailable → deterministic layout', async () => {
    const fixture = getFixture('F8');
    const openai = createOpenAILayoutPlanner({
      transport: createFakeOpenAITransport(async () => ({
        kind: 'provider_error',
        message: 'unavailable',
      })),
    });
    const proposal = await createOrchestratedLayoutPlanner(openai)(fixture.snapshot, {
      requestId: 1,
    });
    const core = runCorePipeline(fixture.snapshot, proposal);
    expect(core.validity).toMatch(/VALID|DEGRADED|INVALID/);
  });

  it('F7 delayed stale — AbortSignal prevents apply; requestId guard remains caller duty', async () => {
    const fixture = getFixture('F7');
    const controller = new AbortController();
    const openai = createOpenAILayoutPlanner({
      transport: createFakeOpenAITransport(async (request) => {
        await new Promise((resolve) => setTimeout(resolve, 40));
        if (request.signal?.aborted) {
          return { kind: 'cancelled', message: 'stale' };
        }
        return { kind: 'ok', proposal: { automaticItemOrder: ['item-0'] } };
      }),
    });
    const pending = createOrchestratedLayoutPlanner(openai)(fixture.snapshot, {
      requestId: 1,
      signal: controller.signal,
    });
    controller.abort();
    const proposal = await pending;
    // cancelled → declaration order usable layout
    const core = runCorePipeline(fixture.snapshot, proposal);
    expect(core.normalizedProposal.automaticItemOrder.length).toBeGreaterThan(0);
  });
});

describe('deterministic replay of captured proposals', () => {
  it('replay captured orders through Core pipeline is stable', () => {
    const fixture = getFixture('F1');
    const captured = {
      automaticItemOrder: ['sidebar-widget', 'footer-strip', 'hero-primary-card'],
    };
    const first = runCorePipeline(fixture.snapshot, captured);
    for (let i = 0; i < 20; i += 1) {
      expect(runCorePipeline(fixture.snapshot, captured)).toEqual(first);
    }
  });
});

describe('core authority / provenance', () => {
  it('OpenAI proposal affects order only; origins remain source|generated', async () => {
    const intent = createLayoutIntent({
      space: { width: 200, height: 100 },
      items: [
        createLayoutItem({
          id: 'pinned',
          constraints: createContentConstraints({ preferredWidth: 100, preferredHeight: 100 }),
        }),
        createLayoutItem({
          id: 'auto-a',
          constraints: createContentConstraints({ preferredWidth: 90, preferredHeight: 90 }),
        }),
        createLayoutItem({
          id: 'auto-b',
          constraints: createContentConstraints({ preferredWidth: 90, preferredHeight: 90 }),
        }),
      ],
      desiredPlacements: { pinned: { x: 0, y: 0, width: 100, height: 100 } },
    });
    const snapshot = { intent, prominence: { 'auto-b': 5 } };
    const openai = createOpenAILayoutPlanner({
      transport: createFakeOpenAITransport(async () => ({
        kind: 'ok',
        proposal: { automaticItemOrder: ['item-1', 'item-0'] },
      })),
    });
    const raw = await openai(snapshot, { requestId: 1 });
    const normalized = normalizePlanningProposal(snapshot, raw);
    const auto = createAutoLayoutProposal({
      intent,
      automaticItemOrder: normalized.automaticItemOrder,
    });
    const solved = solveLayout({ intent: auto.effectiveIntent });
    expect(auto.placementOrigins.pinned).toBe('source');
    for (const origin of Object.values(auto.placementOrigins)) {
      expect(origin === 'source' || origin === 'generated').toBe(true);
    }
    expect(Object.values(auto.placementOrigins)).not.toContain('ai');
    expect(Object.values(auto.placementOrigins)).not.toContain('openai');
    expect(solved.evaluation.state).toMatch(/VALID|DEGRADED|INVALID/);
  });

  it('production sources do not call Core solvers or evaluators', () => {
    const srcDir = join(pkgRoot, 'src');
    const files = readdirSync(srcDir).filter((name) => name.endsWith('.ts'));
    const forbiddenCall = /\b(?:solveLayout|evaluateLayout)\s*\(/;
    for (const file of files) {
      const source = readFileSync(join(srcDir, file), 'utf8');
      expect(forbiddenCall.test(source), `${file} must not invoke Core solver/evaluator`).toBe(
        false,
      );
    }
  });
});
