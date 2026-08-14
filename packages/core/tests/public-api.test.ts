import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  CORE_PACKAGE_NAME,
  CORE_PACKAGE_VERSION,
  LAYOUT_SCHEMA_VERSION,
  VALIDITY_REASON_CODES,
  VALIDITY_STATES,
  createContentConstraints,
  createLayoutIntent,
  createLayoutItem,
  createPoint,
  createSize,
  evaluateItemPlacement,
  evaluateLayout,
  getCorePackageInfo,
  solveLayout,
  type ContentConstraints,
  type ItemId,
  type ItemPlacementEvaluation,
  type LayoutEvaluation,
  type LayoutIntent,
  type LayoutItem,
  type ResolvedLayout,
  type ScoreBreakdown,
  type SolverResult,
  type ValidityReason,
  type ValidityState,
} from '../src/index.js';

const pkg = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8'),
) as { version: string };

const ALPHA_RUNTIME_EXPORTS = [
  'CORE_PACKAGE_NAME',
  'CORE_PACKAGE_VERSION',
  'getCorePackageInfo',
  'DomainError',
  'LAYOUT_SCHEMA_VERSION',
  'VALIDITY_STATES',
  'createPoint',
  'createRect',
  'createSize',
  'createItemId',
  'itemIdToString',
  'itemIdsEqual',
  'createContentConstraints',
  'createLayoutItem',
  'createLayoutSpace',
  'createLayoutIntent',
  'listLayoutIntentItemIds',
  'createResolvedLayout',
  'SCORE_PREFERENCE_WEIGHT',
  'SCORE_USEFULNESS_WEIGHT',
  'VALIDITY_REASON_CODES',
  'evaluateConstraintsPlacement',
  'evaluateItemPlacement',
  'evaluateLayout',
  'solveLayout',
] as const;

describe('@dndgem/core public API', () => {
  it('exposes package identity and schema version', () => {
    expect(CORE_PACKAGE_VERSION).toBe(pkg.version);
    expect(getCorePackageInfo()).toEqual({
      name: CORE_PACKAGE_NAME,
      version: pkg.version,
    });
    expect(LAYOUT_SCHEMA_VERSION).toBe(1);
    expect(VALIDITY_STATES).toEqual(['VALID', 'DEGRADED', 'INVALID']);
    expect(VALIDITY_REASON_CODES.length).toBeGreaterThan(0);
  });

  it('exports domain factories, evaluation, and solver used by later sprints', () => {
    const item = createLayoutItem({
      id: 'api',
      constraints: createContentConstraints({ minWidth: 1 }),
    });
    expect(item.constraints.minWidth).toBe(1);
    expect(createPoint(0, 0)).toEqual({ x: 0, y: 0 });
    expect(evaluateItemPlacement(item, createSize(10, 10)).state).toBe('VALID');
    expect(typeof evaluateLayout).toBe('function');
    expect(typeof solveLayout).toBe('function');

    const intent = createLayoutIntent({
      space: { width: 100, height: 80 },
      items: [item],
    });
    const solved = solveLayout({ intent });
    expect(solved.resolved.placements.api).toBeDefined();
    expect(solved.evaluation.state).toBe('VALID');
  });

  it('locks the Alpha runtime export surface', async () => {
    const api = await import('../src/index.js');
    expect(Object.keys(api).sort()).toEqual([...ALPHA_RUNTIME_EXPORTS].sort());
  });

  it('does not leak solver generation helpers as required public symbols', async () => {
    const api = await import('../src/index.js');
    expect('generateCandidates' in api).toBe(false);
    expect('compareCandidates' in api).toBe(false);
    expect('packPlacements' in api).toBe(false);
    expect('SOLVER_STRATEGIES' in api).toBe(false);
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
    expectTypeOf<SolverResult>().toHaveProperty('reflowed');
  });

  it('does not require renderer-specific fields on LayoutItem', () => {
    type ForbiddenKeys = 'element' | 'node' | 'ref' | 'className' | 'style' | 'jsx';
    type ItemKeys = keyof LayoutItem;
    expectTypeOf<Extract<ItemKeys, ForbiddenKeys>>().toEqualTypeOf<never>();
  });
});
