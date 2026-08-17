import { getContext } from 'svelte';
import type { DnDGemBoard } from './board.js';
import { DnDGemBoardKey } from './context.js';
import { boardScopeError } from './errors.js';
import type { DnDGemStore } from './types.js';

/**
 * Read board-local session stores.
 * Throws when used outside `DnDGemProvider`.
 */
export function getDnDGem(): DnDGemStore {
  const board = getContext<DnDGemBoard | undefined>(DnDGemBoardKey);
  if (board === undefined) {
    throw boardScopeError('getDnDGem');
  }
  return board.asStore();
}
