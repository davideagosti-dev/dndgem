import { DomainError } from './errors.js';
import { createRect, type Rect, type RectInput } from './geometry.js';
import { LAYOUT_SCHEMA_VERSION } from './schema.js';
import { createLayoutSpace, type LayoutSpace, type LayoutSpaceInput } from './space.js';

/**
 * Resolved layout output shape (ADR-0006).
 *
 * Distinct from {@link import('./intent.js').LayoutIntent}: this represents
 * placements after validation/solving/reflow. DND-1.2 defines the data shape
 * only — no solver, scoring, or reflow behaviour.
 */
export interface ResolvedLayout {
  readonly schemaVersion: typeof LAYOUT_SCHEMA_VERSION;
  readonly space: LayoutSpace;
  /** Final placements keyed by item id string form. */
  readonly placements: Readonly<Record<string, Rect>>;
}

export interface ResolvedLayoutInput {
  readonly space: LayoutSpaceInput;
  readonly placements: Readonly<Record<string, RectInput>>;
}

/**
 * Builds an immutable {@link ResolvedLayout} stamped with {@link LAYOUT_SCHEMA_VERSION}.
 * Does not verify placements against constraints (that is DND-1.3+).
 */
export function createResolvedLayout(input: ResolvedLayoutInput): ResolvedLayout {
  const space = createLayoutSpace(input.space);
  const entries = Object.entries(input.placements);
  const placements: Record<string, Rect> = {};

  for (const [key, rectInput] of entries) {
    if (key.length === 0 || key.trim().length === 0) {
      throw new DomainError('INVALID_PLACEMENT_KEY', 'placements keys must be non-empty');
    }
    placements[key] = createRect(rectInput);
  }

  return Object.freeze({
    schemaVersion: LAYOUT_SCHEMA_VERSION,
    space,
    placements: Object.freeze(placements),
  });
}
