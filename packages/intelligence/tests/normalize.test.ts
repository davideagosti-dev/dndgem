import { describe, expect, it } from 'vitest';
import { createContentConstraints, createLayoutIntent, createLayoutItem } from '@dndgem/core';
import { normalizeAutomaticItemOrder } from '../src/normalize.js';
import { normalizePlanningProposal } from '../src/planner.js';
import type { PlanningSnapshot } from '../src/types.js';

function intentWith(
  space: { width: number; height: number },
  items: Array<{ id: string }>,
  desiredPlacements?: Record<string, { x: number; y: number; width: number; height: number }>,
) {
  return createLayoutIntent({
    space,
    items: items.map((item) =>
      createLayoutItem({
        id: item.id,
        constraints: createContentConstraints({ preferredWidth: 80, preferredHeight: 40 }),
      }),
    ),
    desiredPlacements,
  });
}

describe('normalizeAutomaticItemOrder', () => {
  const intent = intentWith({ width: 400, height: 300 }, [{ id: 'a' }, { id: 'b' }, { id: 'c' }]);

  it('preserves a valid full permutation', () => {
    expect(normalizeAutomaticItemOrder(intent, ['c', 'a', 'b'])).toEqual(['c', 'a', 'b']);
  });

  it('removes unknown ids and appends omitted automatic ids in declaration order', () => {
    expect(normalizeAutomaticItemOrder(intent, ['c', 'ghost', 'a'])).toEqual(['c', 'a', 'b']);
  });

  it('removes source intent ids', () => {
    const hybrid = intentWith(
      { width: 400, height: 300 },
      [{ id: 'source' }, { id: 'a' }, { id: 'b' }],
      { source: { x: 0, y: 0, width: 50, height: 50 } },
    );
    expect(normalizeAutomaticItemOrder(hybrid, ['source', 'b', 'a'])).toEqual(['b', 'a']);
  });

  it('removes duplicates deterministically (first occurrence wins)', () => {
    expect(normalizeAutomaticItemOrder(intent, ['b', 'b', 'a', 'c'])).toEqual(['b', 'a', 'c']);
  });

  it('falls back to declaration order for empty proposals', () => {
    expect(normalizeAutomaticItemOrder(intent, [])).toEqual(['a', 'b', 'c']);
  });

  it('falls back to declaration order when proposal has no valid automatic ids', () => {
    expect(normalizeAutomaticItemOrder(intent, ['ghost', 'source'])).toEqual(['a', 'b', 'c']);
  });

  it('returns declaration order when proposal is omitted', () => {
    expect(normalizeAutomaticItemOrder(intent)).toEqual(['a', 'b', 'c']);
  });
});

describe('normalizePlanningProposal', () => {
  it('wraps normalized order in a PlanningProposal', () => {
    const intent = intentWith({ width: 400, height: 300 }, [{ id: 'a' }, { id: 'b' }]);
    const snapshot: PlanningSnapshot = { intent };
    const normalized = normalizePlanningProposal(snapshot, {
      automaticItemOrder: ['b', 'a'],
    });
    expect(normalized.automaticItemOrder).toEqual(['b', 'a']);
  });
});
