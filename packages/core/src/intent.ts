import { DomainError } from './errors.js';
import { createRect, type Rect, type RectInput } from './geometry.js';
import { itemIdToString, type ItemId } from './identity.js';
import { createLayoutItem, type LayoutItem, type LayoutItemInput } from './item.js';
import { LAYOUT_SCHEMA_VERSION } from './schema.js';
import { createLayoutSpace, type LayoutSpace, type LayoutSpaceInput } from './space.js';

/**
 * Author / desired layout structure (ADR-0006).
 *
 * This is input intent — not a solved layout. Desired placements are optional
 * author preferences; the future solver may adapt them.
 */
export interface LayoutIntent {
  readonly schemaVersion: typeof LAYOUT_SCHEMA_VERSION;
  readonly space: LayoutSpace;
  readonly items: readonly LayoutItem[];
  /**
   * Optional author-desired placements keyed by {@link ItemId} string form.
   * Keys must refer to items present in `items`.
   */
  readonly desiredPlacements?: Readonly<Record<string, Rect>>;
}

export interface LayoutIntentInput {
  readonly space: LayoutSpaceInput;
  readonly items: readonly LayoutItemInput[];
  readonly desiredPlacements?: Readonly<Record<string, RectInput>>;
}

function assertUniqueItemIds(items: readonly LayoutItem[]): void {
  const seen = new Set<string>();
  for (const item of items) {
    const key = itemIdToString(item.id);
    if (seen.has(key)) {
      throw new DomainError('DUPLICATE_ITEM_ID', `Duplicate LayoutItem id: "${key}"`);
    }
    seen.add(key);
  }
}

function normalizeDesiredPlacements(
  desiredPlacements: Readonly<Record<string, RectInput>> | undefined,
  itemIds: ReadonlySet<string>,
): Readonly<Record<string, Rect>> | undefined {
  if (desiredPlacements === undefined) {
    return undefined;
  }

  const entries = Object.entries(desiredPlacements);
  if (entries.length === 0) {
    return undefined;
  }

  const normalized: Record<string, Rect> = {};
  for (const [key, rectInput] of entries) {
    if (key.length === 0 || key.trim().length === 0) {
      throw new DomainError('INVALID_PLACEMENT_KEY', 'desiredPlacements keys must be non-empty');
    }
    if (!itemIds.has(key)) {
      throw new DomainError(
        'UNKNOWN_PLACEMENT_ITEM',
        `desiredPlacements key "${key}" does not match any LayoutItem id`,
      );
    }
    normalized[key] = createRect(rectInput);
  }

  return Object.freeze(normalized);
}

/**
 * Builds an immutable {@link LayoutIntent} stamped with {@link LAYOUT_SCHEMA_VERSION}.
 */
export function createLayoutIntent(input: LayoutIntentInput): LayoutIntent {
  const space = createLayoutSpace(input.space);
  const items = Object.freeze(input.items.map((item) => createLayoutItem(item)));
  assertUniqueItemIds(items);

  const itemIds = new Set(items.map((item) => itemIdToString(item.id)));
  const desiredPlacements = normalizeDesiredPlacements(input.desiredPlacements, itemIds);

  const intent: {
    -readonly [K in keyof LayoutIntent]?: LayoutIntent[K];
  } = {
    schemaVersion: LAYOUT_SCHEMA_VERSION,
    space,
    items,
  };

  if (desiredPlacements !== undefined) {
    intent.desiredPlacements = desiredPlacements;
  }

  return Object.freeze(intent) as LayoutIntent;
}

/** Convenience: collect item ids from an intent in declaration order. */
export function listLayoutIntentItemIds(intent: LayoutIntent): readonly ItemId[] {
  return intent.items.map((item) => item.id);
}
