import { describe, expect, it } from 'vitest';
import { DomainError, createItemId, itemIdToString, itemIdsEqual } from '../src/index.js';

describe('ItemId', () => {
  it('creates stable comparable identifiers', () => {
    const a = createItemId('panel-a');
    const b = createItemId('panel-a');
    const c = createItemId('panel-b');

    expect(itemIdsEqual(a, b)).toBe(true);
    expect(itemIdsEqual(a, c)).toBe(false);
    expect(itemIdToString(a)).toBe('panel-a');
  });

  it('rejects empty or whitespace-only ids', () => {
    expect(() => createItemId('')).toThrow(DomainError);
    expect(() => createItemId('   ')).toThrow(DomainError);
  });
});
