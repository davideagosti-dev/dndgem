import { describe, expect, it } from 'vitest';
import { DomainError, createItemId, createLayoutItem, itemIdToString } from '../src/index.js';

describe('LayoutItem', () => {
  it('associates stable identity with constraints', () => {
    const item = createLayoutItem({
      id: 'card-1',
      constraints: { minWidth: 120, minUsefulWidth: 160, preferredWidth: 240 },
      measuredSize: { width: 200, height: 100 },
    });

    expect(itemIdToString(item.id)).toBe('card-1');
    expect(item.constraints.minUsefulWidth).toBe(160);
    expect(item.measuredSize).toEqual({ width: 200, height: 100 });
    expect(Object.isFrozen(item)).toBe(true);
  });

  it('accepts an existing ItemId and defaults constraints to empty', () => {
    const id = createItemId('existing');
    const item = createLayoutItem({ id });
    expect(item.id).toBe(id);
    expect(item.constraints).toEqual({});
    expect(item.measuredSize).toBeUndefined();
  });

  it('rejects invalid ids and measured sizes', () => {
    expect(() => createLayoutItem({ id: '' })).toThrow(DomainError);
    expect(() => createLayoutItem({ id: 'x', measuredSize: { width: -1, height: 1 } })).toThrow(
      DomainError,
    );
  });

  it('does not require renderer-specific fields', () => {
    const item = createLayoutItem({ id: 'plain' });
    expect('element' in item).toBe(false);
    expect('className' in item).toBe(false);
    expect('style' in item).toBe(false);
  });
});
