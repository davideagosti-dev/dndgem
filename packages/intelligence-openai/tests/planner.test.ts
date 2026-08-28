import { createContentConstraints, createLayoutIntent, createLayoutItem } from '@dndgem/core';
import { createOrchestratedLayoutPlanner } from '@dndgem/intelligence';
import { describe, expect, it } from 'vitest';
import {
  createFakeOpenAITransport,
  createOpenAILayoutPlanner,
  ProviderError,
} from '../src/index.js';

function snapshot() {
  const intent = createLayoutIntent({
    space: { width: 200, height: 100 },
    items: [
      createLayoutItem({
        id: 'alpha',
        constraints: createContentConstraints({ preferredWidth: 90, preferredHeight: 90 }),
      }),
      createLayoutItem({
        id: 'beta',
        constraints: createContentConstraints({ preferredWidth: 90, preferredHeight: 90 }),
      }),
    ],
  });
  return { intent, prominence: { beta: 10, alpha: 1 } };
}

describe('OpenAI planner + fake transport', () => {
  it('success: remaps aliases to PlanningProposal', async () => {
    const planner = createOpenAILayoutPlanner({
      transport: createFakeOpenAITransport(async () => ({
        kind: 'ok',
        proposal: { automaticItemOrder: ['item-1', 'item-0'] },
      })),
    });
    const proposal = await planner(snapshot(), { requestId: 1 });
    expect(proposal.automaticItemOrder).toEqual(['beta', 'alpha']);
  });

  it('schema_invalid / unknown alias / empty fall through orchestrator to deterministic', async () => {
    const openai = createOpenAILayoutPlanner({
      transport: createFakeOpenAITransport(async () => ({
        kind: 'schema_invalid',
        message: 'bad schema',
      })),
    });
    const orchestrated = createOrchestratedLayoutPlanner(openai);
    const proposal = await orchestrated(snapshot(), { requestId: 2 });
    expect(proposal.automaticItemOrder).toEqual(['beta', 'alpha']);
  });

  it('auth / rate_limit / provider_error / timeout fall back via orchestrator', async () => {
    for (const kind of ['auth', 'rate_limit', 'provider_error', 'timeout'] as const) {
      const openai = createOpenAILayoutPlanner({
        transport: createFakeOpenAITransport(async () => ({
          kind,
          message: kind,
        })),
      });
      const orchestrated = createOrchestratedLayoutPlanner(openai);
      const proposal = await orchestrated(snapshot(), { requestId: 3 });
      expect(proposal.automaticItemOrder).toEqual(['beta', 'alpha']);
    }
  });

  it('cancellation via AbortSignal', async () => {
    const controller = new AbortController();
    controller.abort();
    const openai = createOpenAILayoutPlanner({
      transport: createFakeOpenAITransport(async () => ({
        kind: 'ok',
        proposal: { automaticItemOrder: ['item-0'] },
      })),
    });
    await expect(
      openai(snapshot(), { requestId: 4, signal: controller.signal }),
    ).rejects.toBeInstanceOf(ProviderError);
    const orchestrated = createOrchestratedLayoutPlanner(openai);
    const result = await orchestrated(snapshot(), { requestId: 4, signal: controller.signal });
    // cancelled → declaration order
    expect(result.automaticItemOrder).toEqual(['alpha', 'beta']);
  });

  it('delayed response observes abort', async () => {
    const controller = new AbortController();
    const openai = createOpenAILayoutPlanner({
      transport: createFakeOpenAITransport(async (request) => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        if (request.signal?.aborted) {
          return { kind: 'cancelled', message: 'aborted' };
        }
        return { kind: 'ok', proposal: { automaticItemOrder: ['item-0', 'item-1'] } };
      }),
    });
    const pending = openai(snapshot(), { requestId: 5, signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toBeInstanceOf(ProviderError);
  });
});
