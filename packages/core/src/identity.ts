import { DomainError } from './errors.js';

/**
 * Stable, renderer-independent identity for a layout item.
 *
 * Intentionally a branded string so callers do not confuse it with DOM ids,
 * React keys, or object identity. Values must be non-empty and serializable.
 */
export type ItemId = string & { readonly __brand: 'ItemId' };

/**
 * Creates an {@link ItemId} from a stable string token.
 * Rejects empty / whitespace-only strings.
 */
export function createItemId(value: string): ItemId {
  if (typeof value !== 'string') {
    throw new DomainError('INVALID_ITEM_ID', 'ItemId must be a string');
  }
  if (value.length === 0 || value.trim().length === 0) {
    throw new DomainError('INVALID_ITEM_ID', 'ItemId must be a non-empty string');
  }
  return value as ItemId;
}

/** Deterministic string equality for item identifiers. */
export function itemIdsEqual(a: ItemId, b: ItemId): boolean {
  return a === b;
}

/** Serializes an ItemId to its plain string form. */
export function itemIdToString(id: ItemId): string {
  return id;
}
