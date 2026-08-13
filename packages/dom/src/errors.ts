/**
 * Adapter-level failures in `@dndgem/dom`.
 *
 * Distinct from Core `DomainError` (malformed domain values) and from
 * Core `ValidityState` (evaluated layout quality). Missing or disconnected
 * DOM nodes are not Core `INVALID`.
 */
export class DomAdapterError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'DomAdapterError';
    this.code = code;
  }
}
