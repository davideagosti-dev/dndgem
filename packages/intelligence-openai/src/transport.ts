import OpenAI from 'openai';
import { classifySdkError, isAbortError, ProviderError } from './errors.js';
import { isProviderProposalShape, PROVIDER_OUTPUT_SCHEMA_NAME } from './schema.js';
import type {
  OpenAIPlannerTransport,
  ProviderProposalDto,
  ProviderTransportRequest,
  ProviderTransportResult,
  ProviderUsage,
} from './types.js';

const DEFAULT_TIMEOUT_MS = 3000;
const MIN_TIMEOUT_MS = 1000;
const MAX_TIMEOUT_MS = 10_000;

export function clampTimeoutMs(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_TIMEOUT_MS;
  }
  return Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, Math.trunc(value)));
}

function mergeAbortSignals(
  external: AbortSignal | undefined,
  timeoutMs: number,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const onExternalAbort = () => {
    controller.abort(external?.reason ?? new DOMException('Aborted', 'AbortError'));
  };
  if (external?.aborted) {
    onExternalAbort();
  } else if (external !== undefined) {
    external.addEventListener('abort', onExternalAbort, { once: true });
  }

  const timer = setTimeout(() => {
    controller.abort(new DOMException('OpenAI request timed out', 'TimeoutError'));
  }, timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      if (external !== undefined) {
        external.removeEventListener('abort', onExternalAbort);
      }
    },
  };
}

function extractOutputText(response: {
  output_text?: string;
  output?: readonly {
    type?: string;
    content?: readonly { type?: string; text?: string }[];
  }[];
}): string | undefined {
  if (typeof response.output_text === 'string' && response.output_text.length > 0) {
    return response.output_text;
  }
  if (!Array.isArray(response.output)) {
    return undefined;
  }
  for (const item of response.output) {
    if (item.type !== 'message' || !Array.isArray(item.content)) {
      continue;
    }
    for (const part of item.content) {
      if (part.type === 'output_text' && typeof part.text === 'string') {
        return part.text;
      }
    }
  }
  return undefined;
}

function parseProposalText(text: string): ProviderProposalDto {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch (error) {
    throw new ProviderError('schema_invalid', 'Provider response was not valid JSON', {
      cause: error,
    });
  }
  if (!isProviderProposalShape(parsed)) {
    throw new ProviderError('schema_invalid', 'Provider response failed schema shape checks');
  }
  return Object.freeze({
    automaticItemOrder: Object.freeze([...parsed.automaticItemOrder]),
  });
}

function usageFromResponse(response: {
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
}): ProviderUsage | undefined {
  const usage = response.usage;
  if (usage === undefined) {
    return undefined;
  }
  const result: {
    -readonly [K in keyof ProviderUsage]?: number;
  } = {};
  if (typeof usage.input_tokens === 'number') result.inputTokens = usage.input_tokens;
  if (typeof usage.output_tokens === 'number') result.outputTokens = usage.output_tokens;
  if (typeof usage.total_tokens === 'number') result.totalTokens = usage.total_tokens;
  return Object.keys(result).length > 0 ? Object.freeze(result) : undefined;
}

/**
 * Production transport backed by the official OpenAI JavaScript SDK.
 *
 * - Responses API
 * - Structured Outputs via text.format json_schema (strict)
 * - maxRetries: 0 (no automatic retry for experiment measurements)
 * - Does not log apiKey or client config containing secrets
 */
export function createOpenAISdkTransport(options: {
  readonly apiKey: string;
  readonly maxRetries?: number;
}): OpenAIPlannerTransport {
  if (typeof options.apiKey !== 'string' || options.apiKey.trim().length === 0) {
    throw new ProviderError('auth', 'OPENAI_API_KEY is required for the live OpenAI transport');
  }

  const client = new OpenAI({
    apiKey: options.apiKey,
    maxRetries: options.maxRetries ?? 0,
  });

  return async (request: ProviderTransportRequest): Promise<ProviderTransportResult> => {
    const timeoutMs = clampTimeoutMs(request.timeoutMs);
    const { signal, cleanup } = mergeAbortSignals(request.signal, timeoutMs);

    try {
      if (signal.aborted) {
        throw new ProviderError('cancelled', 'OpenAI request aborted before start');
      }

      const response = await client.responses.create(
        {
          model: request.model,
          instructions: request.instructions,
          input: JSON.stringify(request.dto),
          reasoning: { effort: request.reasoningEffort },
          text: {
            format: {
              type: 'json_schema',
              name: request.schemaName || PROVIDER_OUTPUT_SCHEMA_NAME,
              strict: true,
              schema: request.schema as Record<string, unknown>,
            },
          },
        },
        { signal },
      );

      const text = extractOutputText(response);
      if (text === undefined) {
        return {
          kind: 'schema_invalid',
          message: 'Provider response contained no output text',
        };
      }

      try {
        const proposal = parseProposalText(text);
        return {
          kind: 'ok',
          proposal,
          usage: usageFromResponse(response),
          rawText: text,
        };
      } catch (error) {
        if (error instanceof ProviderError) {
          return { kind: error.kind, message: error.message };
        }
        return { kind: 'schema_invalid', message: 'Failed to parse provider proposal' };
      }
    } catch (error) {
      if (signal.aborted) {
        const reason = signal.reason;
        const reasonName =
          reason !== undefined && typeof reason === 'object' && reason !== null && 'name' in reason
            ? (reason as { name?: unknown }).name
            : undefined;
        if (reasonName === 'TimeoutError' || /timed out/i.test(String(reason ?? ''))) {
          return { kind: 'timeout', message: 'OpenAI request timed out' };
        }
        return { kind: 'cancelled', message: 'OpenAI request cancelled' };
      }
      const classified = classifySdkError(error);
      return { kind: classified.kind, message: classified.message };
    } finally {
      cleanup();
    }
  };
}

/** Test helper: build a transport that returns a fixed result (no network). */
export function createFakeOpenAITransport(
  handler: (
    request: ProviderTransportRequest,
  ) => Promise<ProviderTransportResult> | ProviderTransportResult,
): OpenAIPlannerTransport {
  return async (request) => {
    if (request.signal?.aborted) {
      return { kind: 'cancelled', message: 'Fake transport aborted before start' };
    }
    try {
      return await Promise.resolve(handler(request));
    } catch (error) {
      if (isAbortError(error) || request.signal?.aborted) {
        return { kind: 'cancelled', message: 'Fake transport cancelled' };
      }
      const classified = classifySdkError(error);
      return { kind: classified.kind, message: classified.message };
    }
  };
}
