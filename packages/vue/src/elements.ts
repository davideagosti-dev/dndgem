function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Normalize Vue function-ref values to a host HTMLElement.
 * Component instances expose `$el`; non-element nodes are ignored.
 */
export function unwrapElement(value: unknown): HTMLElement | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof HTMLElement) {
    return value;
  }
  if (isRecord(value) && '$el' in value) {
    const node = value.$el;
    return node instanceof HTMLElement ? node : null;
  }
  return null;
}
