import { DomainError } from './errors.js';
import { createRect, type Rect, type Size } from './geometry.js';
import { itemIdToString } from './identity.js';
import { createLayoutIntent, type LayoutIntent } from './intent.js';
import type { LayoutItem } from './item.js';
import type { ResolvedLayout } from './resolved.js';
import { resolveItemSize, type SizingMode } from './sizing.js';

/**
 * MVP placement provenance (ADR-0014 / DND-3.1).
 * Only `source` | `generated`. Previous layout and effective intent are not origins.
 * Unplaced automatic items are listed separately — they are not an origin value.
 *
 * INTERNAL — not part of the public Alpha API.
 */
export type PlacementOrigin = 'source' | 'generated';

/**
 * Input to the deterministic Auto-Layout proposal engine (Option B direction).
 *
 * `intent.desiredPlacements` is treated as **Source Intent** (partial or complete).
 * Items without a desired placement are automatic and may receive generated geometry.
 *
 * `previous` (optional) is a **stability signal only** (DND-3.3 / ADR-0010).
 * It is never Source Intent, never an origin, and never a pin/lock.
 *
 * INTERNAL — not part of the public Alpha API.
 */
export interface AutoLayoutProposalInput {
  readonly intent: LayoutIntent;
  /**
   * Size target mode reused from existing Core packing semantics.
   * Defaults to `preferred`.
   */
  readonly sizingMode?: SizingMode;
  /**
   * Optional prior {@link ResolvedLayout} used only to retain feasible previous
   * geometry for automatic items (retain-first / reflow-second).
   * Callers must not treat this as provenance promotion.
   */
  readonly previous?: ResolvedLayout;
}

/**
 * Proposal result: effective solver input + provenance + incomplete-placement signal.
 *
 * Callers compose with existing `solveLayout({ intent: effectiveIntent, previous? })`.
 * This result alone is not an authoritative resolved layout.
 *
 * `unplacedItemIds` records automatic items for which the bounded search found no
 * non-overlapping feasible placement. Those items receive **no** fabricated rectangle.
 * Proposal completeness is distinct from solver VALID / DEGRADED / INVALID.
 *
 * INTERNAL — not part of the public Alpha API.
 */
export interface AutoLayoutProposal {
  readonly effectiveIntent: LayoutIntent;
  /**
   * Per-item origin for items that received a placement in this proposal.
   * Unplaced automatic items are omitted (see {@link unplacedItemIds}).
   */
  readonly placementOrigins: Readonly<Record<string, PlacementOrigin>>;
  /** Generated rectangles only (excludes source-authored and unplaced items). */
  readonly generatedPlacements: Readonly<Record<string, Rect>>;
  /**
   * Automatic item ids (declaration order) that could not be placed without overlap
   * within the bounded probe set. Empty when the proposal placed every automatic item.
   */
  readonly unplacedItemIds: readonly string[];
}

type OccupiedEntry = {
  readonly key: string;
  readonly rect: Rect;
};

/**
 * Axis-aligned intersection. Edge-touching rectangles do not count as overlap
 * (adjacent packing is allowed).
 */
function rectsOverlap(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

/** Source rect is usable as occupancy when it lies fully inside the container. */
function isFeasibleSourceOccupancy(rect: Rect, space: Size): boolean {
  return (
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.width >= 0 &&
    rect.height >= 0 &&
    rect.x + rect.width <= space.width &&
    rect.y + rect.height <= space.height
  );
}

function fitsInContainer(rect: Rect, space: Size): boolean {
  return (
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.x + rect.width <= space.width &&
    rect.y + rect.height <= space.height
  );
}

function overlapsAny(candidate: Rect, occupied: readonly OccupiedEntry[]): boolean {
  for (const entry of occupied) {
    if (rectsOverlap(candidate, entry.rect)) {
      return true;
    }
  }
  return false;
}

/**
 * Bounded deterministic probe set.
 *
 * Order (stable):
 * 1. container origin (0, 0)
 * 2. for each occupied rect in occupancy-add order:
 *    - right edge:  (x + width, y)
 *    - bottom edge: (x, y + height)
 *
 * Bound: at most `1 + 2·k` probes where `k` is the current occupied count.
 * No pixel scanning, no unbounded grid traversal.
 */
function enumerateProbeOrigins(occupied: readonly OccupiedEntry[]): readonly {
  readonly x: number;
  readonly y: number;
}[] {
  const probes: { readonly x: number; readonly y: number }[] = [{ x: 0, y: 0 }];
  for (const entry of occupied) {
    const { rect } = entry;
    probes.push({ x: rect.x + rect.width, y: rect.y });
    probes.push({ x: rect.x, y: rect.y + rect.height });
  }
  return probes;
}

/**
 * Maximum probe count for a given occupied set size (documented bound).
 * Exported for tests only — still INTERNAL.
 */
export function maxProbeCountForOccupancy(occupiedCount: number): number {
  return 1 + 2 * occupiedCount;
}

function assertProposalInput(input: AutoLayoutProposalInput): void {
  if (input === null || typeof input !== 'object') {
    throw new DomainError('INVALID_AUTO_LAYOUT_INPUT', 'AutoLayoutProposalInput must be an object');
  }
  if (input.intent === null || typeof input.intent !== 'object') {
    throw new DomainError(
      'INVALID_AUTO_LAYOUT_INPUT',
      'AutoLayoutProposalInput.intent is required',
    );
  }
  if (!Array.isArray(input.intent.items)) {
    throw new DomainError(
      'INVALID_AUTO_LAYOUT_INPUT',
      'AutoLayoutProposalInput.intent.items must be an array',
    );
  }
  if (
    input.previous !== undefined &&
    (input.previous === null || typeof input.previous !== 'object')
  ) {
    throw new DomainError(
      'INVALID_AUTO_LAYOUT_INPUT',
      'AutoLayoutProposalInput.previous must be a ResolvedLayout when provided',
    );
  }
}

function freezeOrigins(
  origins: Record<string, PlacementOrigin>,
): Readonly<Record<string, PlacementOrigin>> {
  return Object.freeze({ ...origins });
}

function freezePlacements(placements: Record<string, Rect>): Readonly<Record<string, Rect>> {
  return Object.freeze({ ...placements });
}

function commitGenerated(
  key: string,
  rect: Rect,
  effectivePlacements: Record<string, Rect>,
  origins: Record<string, PlacementOrigin>,
  generatedPlacements: Record<string, Rect>,
  occupied: OccupiedEntry[],
): void {
  effectivePlacements[key] = rect;
  origins[key] = 'generated';
  generatedPlacements[key] = rect;
  occupied.push({ key, rect });
}

/**
 * Deterministic Auto-Layout proposal (DND-3.2 + DND-3.3 stability).
 *
 * Pipeline:
 *   Source Intent (partial desiredPlacements)
 *     + optional previous ResolvedLayout (stability only)
 *     → Stage A: feasible Source Intent occupancy
 *     → Stage B: retain previous x/y with current size when feasible
 *     → Stage C: bounded first-fit reflow for remaining automatic items
 *     → Stage D: unplacedItemIds when no-fit
 *     → Generated Placements + origins (source | generated)
 *     → Effective LayoutIntent
 *
 * Does not mutate the caller's intent or previous layout.
 * Does not declare VALID/DEGRADED/INVALID. Does not replace `solveLayout`.
 *
 * Ordering: `LayoutIntent.items` declaration order (stable; no public priority).
 * Sizing: reuses {@link resolveItemSize} (preferred / useful / minimal).
 * Retention: previous x/y is a stability preference; current width/height are
 * authoritative. Size change alone does not force position change.
 * Compaction: Phase 3 Alpha does **not** opportunistically repack when space frees.
 *
 * No-fit: when no probe yields a non-overlapping in-container placement, the item
 * remains **unplaced** (listed in `unplacedItemIds`). No fabricated rectangle is
 * emitted. Proposal completeness ≠ solver validity.
 *
 * INTERNAL — not part of the public Alpha API.
 */
export function createAutoLayoutProposal(input: AutoLayoutProposalInput): AutoLayoutProposal {
  assertProposalInput(input);

  const { intent } = input;
  const sizingMode: SizingMode = input.sizingMode ?? 'preferred';
  const space = intent.space;
  const sourcePlacements = intent.desiredPlacements;
  const previousPlacements = input.previous?.placements;

  const effectivePlacements: Record<string, Rect> = {};
  const origins: Record<string, PlacementOrigin> = {};
  const generatedPlacements: Record<string, Rect> = {};
  const unplacedItemIds: string[] = [];
  const occupied: OccupiedEntry[] = [];

  // Stage A — establish Source Intent occupancy (do not relocate sources).
  for (const item of intent.items) {
    const key = itemIdToString(item.id);
    const source = sourcePlacements?.[key];
    if (source === undefined) {
      continue;
    }
    // Copy geometry — never mutate caller-owned Rect / map entries.
    const rect = createRect(source);
    effectivePlacements[key] = rect;
    origins[key] = 'source';
    if (isFeasibleSourceOccupancy(rect, space)) {
      occupied.push({ key, rect });
    }
  }

  // Stage B — retain previous x/y with current size for automatic items (declaration order).
  // Retention is a preference, not a pin. Origin remains `generated` — never promoted to source.
  // Current sizing is authoritative; previous width/height are not copied.
  // No automatic compaction: free space does not force first-fit relocation.
  if (previousPlacements !== undefined) {
    for (const item of intent.items) {
      const key = itemIdToString(item.id);
      if (origins[key] === 'source') {
        continue;
      }

      const previous = previousPlacements[key];
      if (previous === undefined) {
        continue;
      }

      const size = resolveItemSize(item, sizingMode, space);
      // previous x/y + current size — never mutate previous ResolvedLayout entries.
      const candidate = createRect({
        x: previous.x,
        y: previous.y,
        width: size.width,
        height: size.height,
      });
      if (!fitsInContainer(candidate, space)) {
        continue;
      }
      if (overlapsAny(candidate, occupied)) {
        continue;
      }

      commitGenerated(key, candidate, effectivePlacements, origins, generatedPlacements, occupied);
    }
  }

  // Stage C — deterministic reflow / first placement for remaining automatic items.
  // Previously unplaced items are retried here in declaration order (no starvation priority).
  for (const item of intent.items) {
    const key = itemIdToString(item.id);
    if (origins[key] !== undefined) {
      continue;
    }

    const size = resolveItemSize(item, sizingMode, space);
    const rect = tryPlaceAutomaticItem(item, size, space, occupied);
    if (rect === undefined) {
      // Stage D — no-fit: list as unplaced; no fabricated geometry; no origin entry.
      unplacedItemIds.push(key);
      continue;
    }

    commitGenerated(key, rect, effectivePlacements, origins, generatedPlacements, occupied);
  }

  const intentInput: {
    space: { width: number; height: number };
    items: Array<{
      id: (typeof intent.items)[number]['id'];
      constraints: (typeof intent.items)[number]['constraints'];
      measuredSize?: (typeof intent.items)[number]['measuredSize'];
    }>;
    desiredPlacements?: Record<string, Rect>;
  } = {
    space: {
      width: space.width,
      height: space.height,
    },
    items: intent.items.map((item) => ({
      id: item.id,
      constraints: item.constraints,
      measuredSize: item.measuredSize,
    })),
  };
  if (Object.keys(effectivePlacements).length > 0) {
    intentInput.desiredPlacements = effectivePlacements;
  }

  const effectiveIntent = createLayoutIntent(intentInput);

  return Object.freeze({
    effectiveIntent,
    placementOrigins: freezeOrigins(origins),
    generatedPlacements: freezePlacements(generatedPlacements),
    unplacedItemIds: Object.freeze([...unplacedItemIds]),
  });
}

/**
 * Returns a non-overlapping in-container placement, or `undefined` on no-fit.
 * Does not fabricate overlapping geometry.
 */
function tryPlaceAutomaticItem(
  _item: LayoutItem,
  size: Size,
  space: Size,
  occupied: readonly OccupiedEntry[],
): Rect | undefined {
  const probes = enumerateProbeOrigins(occupied);

  for (const probe of probes) {
    const candidate = createRect({
      x: probe.x,
      y: probe.y,
      width: size.width,
      height: size.height,
    });
    if (!fitsInContainer(candidate, space)) {
      continue;
    }
    if (overlapsAny(candidate, occupied)) {
      continue;
    }
    return candidate;
  }

  return undefined;
}
