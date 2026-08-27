import { itemIdToString } from './identity.js';
import type { LayoutIntent } from './intent.js';
import type { LayoutItem } from './item.js';

/**
 * Automatic item ids in declaration order (items without Source Intent placement).
 * INTERNAL — defensive helper for Auto-Layout ordering.
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
 * Fail-closed normalization for optional automatic-item processing order.
 * INTERNAL — mirrors intelligence trust boundary without importing intelligence.
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

/** Resolve automatic items in the given id order; skips unknown ids deterministically. */
export function automaticItemsInOrder(
  intent: LayoutIntent,
  order: readonly string[],
): readonly LayoutItem[] {
  const byId = new Map<string, LayoutItem>();
  for (const item of intent.items) {
    byId.set(itemIdToString(item.id), item);
  }

  const resolved: LayoutItem[] = [];
  for (const id of order) {
    const item = byId.get(id);
    if (item !== undefined && !isSourceIntentId(intent, id)) {
      resolved.push(item);
    }
  }
  return resolved;
}
