import type { LayoutPlanner, PlanningProposal, PlannerContext } from '@dndgem/intelligence';
import { remapAliasedOrder } from './alias.js';
import { buildProviderPlanningDto } from './dto.js';
import { ProviderError } from './errors.js';
import { PROVIDER_INSTRUCTIONS, PROVIDER_PROMPT_VERSION } from './prompt.js';
import {
  PROVIDER_OUTPUT_JSON_SCHEMA,
  PROVIDER_OUTPUT_SCHEMA_NAME,
  PROVIDER_OUTPUT_SCHEMA_VERSION,
} from './schema.js';
import { clampTimeoutMs, createOpenAISdkTransport } from './transport.js';
import type { OpenAILayoutPlannerOptions, OpenAIPlannerTransport } from './types.js';

export const DEFAULT_OPENAI_MODEL = 'gpt-5.6-luna' as const;
export const SECONDARY_OPENAI_MODEL = 'gpt-5.6-terra' as const;

export {
  PROVIDER_INSTRUCTIONS,
  PROVIDER_PROMPT_VERSION,
  PROVIDER_OUTPUT_JSON_SCHEMA,
  PROVIDER_OUTPUT_SCHEMA_NAME,
  PROVIDER_OUTPUT_SCHEMA_VERSION,
};

/**
 * Create an OpenAI reference LayoutPlanner (DND-4.4 experiment).
 *
 * Responsibilities:
 * PlanningSnapshot → sanitize → aliases → provider DTO → strict OpenAI request
 * → parse → alias remap → PlanningProposal
 *
 * Does NOT call Core solvers or evaluators, or author geometry.
 * Compose with createOrchestratedLayoutPlanner for deterministic fallback.
 */
export function createOpenAILayoutPlanner(options: OpenAILayoutPlannerOptions = {}): LayoutPlanner {
  const model = options.model ?? DEFAULT_OPENAI_MODEL;
  const timeoutMs = clampTimeoutMs(options.timeoutMs);
  const reasoningEffort = options.reasoningEffort ?? 'none';

  let transport: OpenAIPlannerTransport;
  if (options.transport !== undefined) {
    transport = options.transport;
  } else {
    const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
    if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw new ProviderError(
        'auth',
        'OPENAI_API_KEY is required to construct the live OpenAI layout planner',
      );
    }
    transport = createOpenAISdkTransport({
      apiKey,
      maxRetries: options.maxRetries ?? 0,
    });
  }

  return async (snapshot, context?: PlannerContext): Promise<PlanningProposal> => {
    if (context?.signal?.aborted) {
      throw new ProviderError('cancelled', 'Planner invocation cancelled before provider call');
    }

    const { dto, maps } = buildProviderPlanningDto(snapshot);
    const result = await transport({
      model,
      instructions: PROVIDER_INSTRUCTIONS,
      dto,
      schema: PROVIDER_OUTPUT_JSON_SCHEMA,
      schemaName: PROVIDER_OUTPUT_SCHEMA_NAME,
      reasoningEffort,
      signal: context?.signal,
      timeoutMs,
    });

    if (context?.signal?.aborted) {
      throw new ProviderError('cancelled', 'Planner invocation cancelled after provider call');
    }

    if (result.kind !== 'ok') {
      throw new ProviderError(result.kind, result.message);
    }

    const remapped = remapAliasedOrder(result.proposal.automaticItemOrder, maps);
    return Object.freeze({
      automaticItemOrder: Object.freeze([...remapped]),
    });
  };
}

/**
 * Resolve model id for experiments.
 * Env override: DNDGEM_OPENAI_MODEL (experiment configuration only).
 */
export function resolveExperimentModel(explicit?: string): string {
  if (typeof explicit === 'string' && explicit.trim().length > 0) {
    return explicit.trim();
  }
  const fromEnv = process.env.DNDGEM_OPENAI_MODEL;
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }
  return DEFAULT_OPENAI_MODEL;
}
