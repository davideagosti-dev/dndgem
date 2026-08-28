/**
 * Experiment-era pricing metadata only.
 * Update freely when OpenAI publishes new prices — not part of DnDGem architecture.
 *
 * Values are USD per 1M tokens for gpt-5.6-luna (experiment configuration).
 * Verify against current OpenAI pricing before citing externally.
 */
export const EXPERIMENT_PRICING_VERSION = '2026-08-28-estimate' as const;

export interface ModelPricing {
  readonly model: string;
  readonly inputUsdPer1M: number;
  readonly outputUsdPer1M: number;
}

/** Conservative experiment-era estimates; not long-term guarantees. */
export const EXPERIMENT_MODEL_PRICING: readonly ModelPricing[] = Object.freeze([
  Object.freeze({
    model: 'gpt-5.6-luna',
    inputUsdPer1M: 0.25,
    outputUsdPer1M: 2.0,
  }),
  Object.freeze({
    model: 'gpt-5.6-terra',
    inputUsdPer1M: 1.25,
    outputUsdPer1M: 10.0,
  }),
]);

export function estimateCostUsd(input: {
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
}): number | undefined {
  const pricing = EXPERIMENT_MODEL_PRICING.find((entry) => entry.model === input.model);
  if (pricing === undefined) {
    return undefined;
  }
  return (
    (input.inputTokens / 1_000_000) * pricing.inputUsdPer1M +
    (input.outputTokens / 1_000_000) * pricing.outputUsdPer1M
  );
}
