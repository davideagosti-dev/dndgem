import { describe, expect, it } from 'vitest';
import {
  DomainError,
  LAYOUT_SCHEMA_VERSION,
  createLayoutIntent,
  createResolvedLayout,
  listLayoutIntentItemIds,
  itemIdToString,
} from '../src/index.js';

describe('LayoutSpace / LayoutIntent / ResolvedLayout', () => {
  it('creates layout intent with schemaVersion and unique items', () => {
    const intent = createLayoutIntent({
      space: { width: 800, height: 600 },
      items: [
        { id: 'a', constraints: { minWidth: 10 } },
        { id: 'b', constraints: { minUsefulHeight: 20 } },
      ],
      desiredPlacements: {
        a: { x: 0, y: 0, width: 100, height: 50 },
      },
    });

    expect(intent.schemaVersion).toBe(LAYOUT_SCHEMA_VERSION);
    expect(intent.space).toEqual({ width: 800, height: 600 });
    expect(listLayoutIntentItemIds(intent).map(itemIdToString)).toEqual(['a', 'b']);
    expect(intent.desiredPlacements?.a).toEqual({ x: 0, y: 0, width: 100, height: 50 });
    expect(Object.isFrozen(intent)).toBe(true);
  });

  it('rejects duplicate item ids and unknown desired placement keys', () => {
    expect(() =>
      createLayoutIntent({
        space: { width: 1, height: 1 },
        items: [{ id: 'a' }, { id: 'a' }],
      }),
    ).toThrow(/Duplicate/);

    expect(() =>
      createLayoutIntent({
        space: { width: 1, height: 1 },
        items: [{ id: 'a' }],
        desiredPlacements: {
          missing: { x: 0, y: 0, width: 1, height: 1 },
        },
      }),
    ).toThrow(/does not match/);
  });

  it('rejects non-finite layout space', () => {
    expect(() =>
      createLayoutIntent({
        space: { width: -1, height: 10 },
        items: [],
      }),
    ).toThrow(DomainError);
  });

  it('creates resolved layout as a distinct output shape', () => {
    const resolved = createResolvedLayout({
      space: { width: 400, height: 300 },
      placements: {
        a: { x: 10, y: 20, width: 30, height: 40 },
      },
    });

    expect(resolved.schemaVersion).toBe(LAYOUT_SCHEMA_VERSION);
    expect(resolved.placements.a).toEqual({ x: 10, y: 20, width: 30, height: 40 });
    expect(Object.isFrozen(resolved)).toBe(true);
    expect(Object.isFrozen(resolved.placements)).toBe(true);
  });

  it('rejects empty placement keys on resolved layouts', () => {
    expect(() =>
      createResolvedLayout({
        space: { width: 1, height: 1 },
        placements: {
          ' ': { x: 0, y: 0, width: 1, height: 1 },
        },
      }),
    ).toThrow(DomainError);
  });
});
