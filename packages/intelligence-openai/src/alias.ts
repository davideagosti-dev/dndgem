import type { AliasMaps } from './types.js';

/**
 * Deterministic transient aliasing from declaration order.
 * Provider sees `item-0`, `item-1`, … — never application-defined ids.
 */
export function createAliasMaps(
  automaticIds: readonly string[],
  sourceIds: readonly string[],
): AliasMaps {
  const toAlias = new Map<string, string>();
  const toOriginal = new Map<string, string>();
  const automaticAliases: string[] = [];
  const sourceAliases: string[] = [];

  let nextIndex = 0;

  for (const id of automaticIds) {
    const alias = `item-${nextIndex}`;
    nextIndex += 1;
    toAlias.set(id, alias);
    toOriginal.set(alias, id);
    automaticAliases.push(alias);
  }

  for (const id of sourceIds) {
    const alias = `item-${nextIndex}`;
    nextIndex += 1;
    toAlias.set(id, alias);
    toOriginal.set(alias, id);
    sourceAliases.push(alias);
  }

  return Object.freeze({
    toAlias,
    toOriginal,
    automaticAliases: Object.freeze([...automaticAliases]),
    sourceAliases: Object.freeze([...sourceAliases]),
  });
}

/**
 * Remap provider aliases back to original ids.
 * Unknown aliases and source aliases are dropped (safe fail-closed).
 * Duplicates keep first occurrence. Does not mutate inputs.
 */
export function remapAliasedOrder(
  aliasedOrder: readonly string[],
  maps: AliasMaps,
): readonly string[] {
  const automaticSet = new Set(maps.automaticAliases);
  const sourceSet = new Set(maps.sourceAliases);
  const seen = new Set<string>();
  const remapped: string[] = [];

  for (const alias of aliasedOrder) {
    if (typeof alias !== 'string' || alias.length === 0) {
      continue;
    }
    if (sourceSet.has(alias)) {
      continue;
    }
    if (!automaticSet.has(alias)) {
      continue;
    }
    const original = maps.toOriginal.get(alias);
    if (original === undefined) {
      continue;
    }
    if (seen.has(original)) {
      continue;
    }
    seen.add(original);
    remapped.push(original);
  }

  return Object.freeze([...remapped]);
}
