import { describe, expect, it } from 'vitest';
import {
  createContentConstraints,
  createItemId,
  createLayoutItem,
  createRect,
  evaluateItemPlacement,
} from '../src/index.js';

/**
 * Keeps the DND-2.3 Constraints guide examples executable.
 * Docs: docs/guides/constraints.md
 */
describe('docs validity examples', () => {
  it('DEGRADED when hard geometry OK but minUsefulWidth is missed', () => {
    const constraints = createContentConstraints({
      minWidth: 120,
      minUsefulWidth: 220,
      preferredWidth: 280,
    });
    const item = createLayoutItem({ id: createItemId('cashflow'), constraints });
    const placement = createRect({ x: 0, y: 0, width: 160, height: 120 });
    const evaluation = evaluateItemPlacement(item, placement);
    expect(evaluation.state).toBe('DEGRADED');
  });

  it('INVALID when hard minWidth is violated', () => {
    const constraints = createContentConstraints({
      minWidth: 200,
      minHeight: 100,
    });
    const item = createLayoutItem({ id: createItemId('transactions'), constraints });
    const placement = createRect({ x: 0, y: 0, width: 120, height: 100 });
    const evaluation = evaluateItemPlacement(item, placement);
    expect(evaluation.state).toBe('INVALID');
  });
});
