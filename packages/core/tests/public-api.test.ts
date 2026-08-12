import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  CORE_PACKAGE_NAME,
  LAYOUT_SCHEMA_VERSION,
  VALIDITY_REASON_CODES,
  VALIDITY_STATES,
  createContentConstraints,
  createLayoutItem,
  createPoint,
  createSize,
  evaluateItemPlacement,
  evaluateLayout,
  getCorePackageInfo,
  type ContentConstraints,
  type ItemId,
  type ItemPlacementEvaluation,
  type LayoutEvaluation,
  type LayoutIntent,
  type LayoutItem,
  type ResolvedLayout,
  type ScoreBreakdown,
  type ValidityReason,
  type ValidityState,
} from '../src/index.js';

describe('@dndgem/core public API', () => {
  it('exposes package identity and schema version', () => {
    expect(getCorePackageInfo()).toEqual({
      name: CORE_PACKAGE_NAME,
      version: '0.0.0',
    });
    expect(LAYOUT_SCHEMA_VERSION).toBe(1);
    expect(VALIDITY_STATES).toEqual(['VALID', 'DEGRADED', 'INVALID']);
    expect(VALIDITY_REASON_CODES.length).toBeGreaterThan(0);
  });

  it('exports domain factories and evaluation used by later sprints', () => {
    const item = createLayoutItem({
      id: 'api',
      constraints: createContentConstraints({ minWidth: 1 }),
    });
    expect(item.constraints.minWidth).toBe(1);
    expect(createPoint(0, 0)).toEqual({ x: 0, y: 0 });
    expect(evaluateItemPlacement(item, createSize(10, 10)).state).toBe('VALID');
    expect(typeof evaluateLayout).toBe('function');
  });
});

describe('compile-time contracts', () => {
  it('keeps public domain values readonly-shaped', () => {
    expectTypeOf<ContentConstraints>().toMatchTypeOf<{
      readonly minWidth?: number;
      readonly minUsefulWidth?: number;
      readonly preferredWidth?: number;
    }>();

    expectTypeOf<LayoutItem>().toMatchTypeOf<{
      readonly id: ItemId;
      readonly constraints: ContentConstraints;
      readonly measuredSize?: { readonly width: number; readonly height: number };
    }>();

    expectTypeOf<LayoutIntent>().toHaveProperty('schemaVersion');
    expectTypeOf<ResolvedLayout>().toHaveProperty('placements');
    expectTypeOf<ValidityState>().toEqualTypeOf<'VALID' | 'DEGRADED' | 'INVALID'>();
    expectTypeOf<ItemPlacementEvaluation>().toMatchTypeOf<{
      readonly state: ValidityState;
      readonly score: ScoreBreakdown;
      readonly reasons: readonly ValidityReason[];
    }>();
    expectTypeOf<LayoutEvaluation>().toHaveProperty('items');
    expectTypeOf<ScoreBreakdown>().toMatchTypeOf<{
      readonly total: number;
      readonly usefulness: number;
      readonly preference: number;
    }>();
  });

  it('does not require renderer-specific fields on LayoutItem', () => {
    type ForbiddenKeys = 'element' | 'node' | 'ref' | 'className' | 'style' | 'jsx';
    type ItemKeys = keyof LayoutItem;
    expectTypeOf<Extract<ItemKeys, ForbiddenKeys>>().toEqualTypeOf<never>();
  });
});
