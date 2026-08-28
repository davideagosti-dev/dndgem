import { describe, expect, it } from 'vitest';
import { createAliasMaps, remapAliasedOrder } from '../src/alias.js';

describe('identifier aliasing', () => {
  it('maps declaration order to item-N aliases deterministically', () => {
    const maps = createAliasMaps(['hero-primary-card', 'sidebar-widget'], ['pinned-nav']);
    expect(maps.toAlias.get('hero-primary-card')).toBe('item-0');
    expect(maps.toAlias.get('sidebar-widget')).toBe('item-1');
    expect(maps.toAlias.get('pinned-nav')).toBe('item-2');
    expect(maps.automaticAliases).toEqual(['item-0', 'item-1']);
    expect(maps.sourceAliases).toEqual(['item-2']);
  });

  it('remaps aliases back and drops unknown/source/duplicates safely', () => {
    const maps = createAliasMaps(['a', 'b', 'c'], ['pinned']);
    const remapped = remapAliasedOrder(
      ['item-2', 'item-0', 'item-99', 'item-0', 'item-3', 'item-1'],
      maps,
    );
    expect(remapped).toEqual(['c', 'a', 'b']);
  });

  it('does not mutate caller arrays', () => {
    const automatic = ['x', 'y'];
    const source = ['z'];
    const maps = createAliasMaps(automatic, source);
    automatic.push('mutated');
    source.push('mutated');
    expect(maps.automaticAliases).toEqual(['item-0', 'item-1']);
    expect(maps.sourceAliases).toEqual(['item-2']);
  });
});
