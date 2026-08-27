import { itemIdToString, type LayoutIntent } from '@dndgem/core';

/**
 * Automatic item ids in declaration order (items without Source Intent placement).
 */
export function listAutomaticItemIds(intent: LayoutIntent): readonly string[] {
  const sourcePlacements = intent.desiredPlacements;
  const ids: string[] = [];
  for (const item of intent.items) {
    const key = itemIdToString(item.id);
    if (sourcePlacements?.[key] === undefined) {
      ids.push(key);
    }
  }
  return ids;
}

function isSourceIntentId(intent: LayoutIntent, itemId: string): boolean {
  return intent.desiredPlacements?.[itemId] !== undefined;
}

/**
 * Fail-closed normalization for advisory automatic-item processing order.
 *
 * Returns a complete deterministic permutation of automatic item ids:
 * 1. keep valid automatic ids in proposed order (first occurrence wins);
 * 2. discard unknown, source-intent, and duplicate ids;
 * 3. append omitted automatic ids in declaration order;
 * 4. fall back entirely to declaration order when the proposal is unusable.
 *
 * Does not mutate caller inputs.
 */
export function normalizeAutomaticItemOrder(
  intent: LayoutIntent,
  proposedOrder?: readonly string[],
): readonly string[] {
  const declarationOrder = listAutomaticItemIds(intent);
  if (declarationOrder.length === 0) {
    return declarationOrder;
  }

  if (proposedOrder === undefined || proposedOrder.length === 0) {
    return declarationOrder;
  }

  const declarationSet = new Set(declarationOrder);
  const seen = new Set<string>();
  const normalized: string[] = [];
  let validFromProposal = 0;

  for (const rawId of proposedOrder) {
    if (typeof rawId !== 'string' || rawId.length === 0) {
      continue;
    }
    if (isSourceIntentId(intent, rawId)) {
      continue;
    }
    if (!declarationSet.has(rawId)) {
      continue;
    }
    if (seen.has(rawId)) {
      continue;
    }
    seen.add(rawId);
    normalized.push(rawId);
    validFromProposal += 1;
  }

  if (validFromProposal === 0) {
    return declarationOrder;
  }

  for (const id of declarationOrder) {
    if (!seen.has(id)) {
      normalized.push(id);
    }
  }

  return Object.freeze([...normalized]);
}

function sanitizeProminence(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return value;
}

/**
 * Deterministic prominence-weighted automatic-item order.
 *
 * Total order: prominence DESC → declaration index ASC → itemId ASC.
 */
export function rankAutomaticItemsByProminence(
  intent: LayoutIntent,
  prominence?: Readonly<Record<string, number>>,
): readonly string[] {
  const automaticIds = listAutomaticItemIds(intent);
  if (automaticIds.length === 0) {
    return automaticIds;
  }

  const declarationIndex = new Map<string, number>();
  for (let index = 0; index < automaticIds.length; index += 1) {
    declarationIndex.set(automaticIds[index]!, index);
  }

  const ranked = [...automaticIds].sort((leftId, rightId) => {
    const leftProminence = sanitizeProminence(prominence?.[leftId]);
    const rightProminence = sanitizeProminence(prominence?.[rightId]);
    if (leftProminence !== rightProminence) {
      return rightProminence - leftProminence;
    }

    const leftIndex = declarationIndex.get(leftId) ?? 0;
    const rightIndex = declarationIndex.get(rightId) ?? 0;
    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    return leftId.localeCompare(rightId);
  });

  return Object.freeze(ranked);
}
