/**
 * Provider-private types for the OpenAI reference LayoutPlanner (DND-4.4).
 * These types MUST NOT leak into Core, DOM, framework adapters,
 * or generic intelligence contracts.
 */

/** Experiment / provider outcome classification (internal). */
export type ProviderOutcomeKind =
  | 'ok'
  | 'timeout'
  | 'cancelled'
  | 'auth'
  | 'rate_limit'
  | 'provider_error'
  | 'schema_invalid'
  | 'stale'
  | 'fallback';

export interface ProviderItemConstraintsDto {
  readonly preferredWidth?: number;
  readonly preferredHeight?: number;
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly minHeight?: number;
  readonly maxHeight?: number;
  readonly minUsefulWidth?: number;
  readonly minUsefulHeight?: number;
}

export interface ProviderAutomaticItemDto {
  readonly alias: string;
  readonly constraints: ProviderItemConstraintsDto;
  readonly prominence?: number;
}

export interface ProviderSourceItemDto {
  readonly alias: string;
  readonly rect: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}

export interface ProviderPreviousPlacementDto {
  readonly alias: string;
  readonly rect: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}

/**
 * Sanitized structural DTO sent to the provider.
 * Contains only aliased ids and structural geometry/constraints/prominence.
 */
export interface ProviderPlanningDto {
  readonly space: {
    readonly width: number;
    readonly height: number;
  };
  readonly automaticItems: readonly ProviderAutomaticItemDto[];
  readonly sourceItems: readonly ProviderSourceItemDto[];
  readonly previousAutomatic?: readonly ProviderPreviousPlacementDto[];
}

export interface ProviderProposalDto {
  readonly automaticItemOrder: readonly string[];
}

export interface ProviderUsage {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly totalTokens?: number;
}

export interface ProviderTransportSuccess {
  readonly kind: 'ok';
  readonly proposal: ProviderProposalDto;
  readonly usage?: ProviderUsage;
  readonly rawText?: string;
}

export interface ProviderTransportFailure {
  readonly kind: Exclude<ProviderOutcomeKind, 'ok' | 'stale' | 'fallback'>;
  readonly message: string;
}

export type ProviderTransportResult = ProviderTransportSuccess | ProviderTransportFailure;

export interface ProviderTransportRequest {
  readonly model: string;
  readonly instructions: string;
  readonly dto: ProviderPlanningDto;
  readonly schema: Readonly<Record<string, unknown>>;
  readonly schemaName: string;
  readonly reasoningEffort: 'none' | 'low' | 'medium' | 'high';
  readonly signal?: AbortSignal;
  readonly timeoutMs: number;
}

/**
 * Minimal transport seam: production uses the official OpenAI SDK;
 * unit tests inject a fake transport (no network).
 */
export type OpenAIPlannerTransport = (
  request: ProviderTransportRequest,
) => Promise<ProviderTransportResult>;

export interface OpenAILayoutPlannerOptions {
  /**
   * Consumer-owned OpenAI API key (BYOK).
   * Required only when constructing the live SDK transport.
   * Never log or serialize this value.
   */
  readonly apiKey?: string;
  /** Model id. Default experiment candidate: gpt-5.6-luna */
  readonly model?: string;
  /** Provider-local timeout in ms. Default 3000. Clamp approx 1000–10000. */
  readonly timeoutMs?: number;
  /** Reasoning effort for capable models. Default `none`. */
  readonly reasoningEffort?: 'none' | 'low' | 'medium' | 'high';
  /** Injected transport for tests. Overrides SDK construction. */
  readonly transport?: OpenAIPlannerTransport;
  /**
   * Optional maxRetries for the official SDK client.
   * Experiment default is 0 (no automatic retry).
   */
  readonly maxRetries?: number;
}

export interface AliasMaps {
  readonly toAlias: ReadonlyMap<string, string>;
  readonly toOriginal: ReadonlyMap<string, string>;
  readonly automaticAliases: readonly string[];
  readonly sourceAliases: readonly string[];
}
