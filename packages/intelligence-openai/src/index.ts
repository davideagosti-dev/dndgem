/**
 * @dndgem/intelligence-openai — private OpenAI reference LayoutPlanner (DND-4.4).
 *
 * Experimental workspace package. Not published. Server-oriented BYOK.
 * Do not import from browser playgrounds or framework adapters.
 *
 * Compose with createOrchestratedLayoutPlanner from @dndgem/intelligence:
 * OpenAI → deterministic local → declaration order → Core Auto-Layout → Core solver.
 */

export {
  createOpenAILayoutPlanner,
  resolveExperimentModel,
  DEFAULT_OPENAI_MODEL,
  SECONDARY_OPENAI_MODEL,
  PROVIDER_INSTRUCTIONS,
  PROVIDER_PROMPT_VERSION,
  PROVIDER_OUTPUT_JSON_SCHEMA,
  PROVIDER_OUTPUT_SCHEMA_NAME,
  PROVIDER_OUTPUT_SCHEMA_VERSION,
} from './planner.js';

export { createAliasMaps, remapAliasedOrder } from './alias.js';

export { buildProviderPlanningDto, assertProviderDtoPrivacy } from './dto.js';

export { ProviderError, classifySdkError, isAbortError } from './errors.js';

export {
  createOpenAISdkTransport,
  createFakeOpenAITransport,
  clampTimeoutMs,
} from './transport.js';

export type {
  AliasMaps,
  OpenAILayoutPlannerOptions,
  OpenAIPlannerTransport,
  ProviderAutomaticItemDto,
  ProviderItemConstraintsDto,
  ProviderOutcomeKind,
  ProviderPlanningDto,
  ProviderPreviousPlacementDto,
  ProviderProposalDto,
  ProviderSourceItemDto,
  ProviderTransportFailure,
  ProviderTransportRequest,
  ProviderTransportResult,
  ProviderTransportSuccess,
  ProviderUsage,
} from './types.js';
