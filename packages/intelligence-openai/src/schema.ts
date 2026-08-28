/**
 * Strict JSON Schema for Responses API Structured Outputs.
 * Provider output is order-only — no geometry, score, or prose.
 */
export const PROVIDER_OUTPUT_SCHEMA_NAME = 'dndgem_automatic_item_order' as const;

export const PROVIDER_OUTPUT_SCHEMA_VERSION = '1.0.0' as const;

export const PROVIDER_OUTPUT_JSON_SCHEMA = Object.freeze({
  type: 'object',
  properties: Object.freeze({
    automaticItemOrder: Object.freeze({
      type: 'array',
      items: Object.freeze({ type: 'string' }),
    }),
  }),
  required: Object.freeze(['automaticItemOrder']),
  additionalProperties: false,
}) as Readonly<Record<string, unknown>>;

export function isProviderProposalShape(value: unknown): value is {
  automaticItemOrder: readonly string[];
} {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const record = value as { automaticItemOrder?: unknown };
  if (!Array.isArray(record.automaticItemOrder)) {
    return false;
  }
  return record.automaticItemOrder.every((entry) => typeof entry === 'string');
}
