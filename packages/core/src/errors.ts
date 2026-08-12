/**
 * Predictable, renderer-neutral domain construction failures.
 * Not a layout validity classification (that belongs to DND-1.3).
 */
export class DomainError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}
