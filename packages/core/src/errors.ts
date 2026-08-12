/**
 * Predictable, renderer-neutral domain construction / invocation failures.
 * Distinct from layout validity classification (`ValidityState` in DND-1.3).
 */
export class DomainError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}
