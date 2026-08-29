import type { ProviderOutcomeKind } from './types.js';

/** Provider-private error. Never include secrets or raw auth headers. */
export class ProviderError extends Error {
  readonly kind: Exclude<ProviderOutcomeKind, 'ok' | 'stale' | 'fallback'>;

  constructor(
    kind: Exclude<ProviderOutcomeKind, 'ok' | 'stale' | 'fallback'>,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'ProviderError';
    this.kind = kind;
  }
}

export function isAbortError(error: unknown): boolean {
  if (error === undefined || error === null || typeof error !== 'object') {
    return false;
  }
  const name = (error as { name?: unknown }).name;
  return name === 'AbortError';
}

export function classifySdkError(error: unknown): ProviderError {
  if (error instanceof ProviderError) {
    return error;
  }
  if (isAbortError(error)) {
    return new ProviderError('cancelled', 'OpenAI request aborted', { cause: error });
  }

  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? (error as { status?: unknown }).status
      : undefined;
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? (error as { code?: unknown }).code
      : undefined;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'OpenAI provider error';

  if (status === 401 || status === 403 || code === 'invalid_api_key') {
    return new ProviderError('auth', 'OpenAI authentication failed', { cause: error });
  }
  if (status === 429 || code === 'rate_limit_exceeded') {
    return new ProviderError('rate_limit', 'OpenAI rate limit exceeded', { cause: error });
  }
  if (code === 'ETIMEDOUT' || /timeout/i.test(message)) {
    return new ProviderError('timeout', 'OpenAI request timed out', { cause: error });
  }

  return new ProviderError('provider_error', message.slice(0, 200), { cause: error });
}
