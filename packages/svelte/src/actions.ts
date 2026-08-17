import { getContext } from 'svelte';
import type { Action } from 'svelte/action';
import type { DnDGemBoard } from './board.js';
import { DnDGemBoardKey } from './context.js';
import { boardScopeError } from './errors.js';

function requireBoard(api: string): DnDGemBoard {
  const board = getContext<DnDGemBoard | undefined>(DnDGemBoardKey);
  if (board === undefined) {
    throw boardScopeError(api);
  }
  return board;
}

export function createBoundContainerAction(board: DnDGemBoard): Action<HTMLElement> {
  return (node) => {
    board.registerContainer(node);
    return {
      destroy() {
        board.registerContainer(null);
      },
    };
  };
}

export function createBoundItemAction(board: DnDGemBoard): Action<HTMLElement, string> {
  return (node, id) => {
    if (id === '') {
      throw new Error('dndgemItem requires a non-empty item id');
    }
    let currentId = id;
    board.registerItem(currentId, node);
    return {
      update(nextId) {
        if (nextId === '') {
          throw new Error('dndgemItem requires a non-empty item id');
        }
        if (nextId === currentId) {
          return;
        }
        board.registerItem(currentId, null);
        currentId = nextId;
        board.registerItem(currentId, node);
      },
      destroy() {
        board.registerItem(currentId, null);
      },
    };
  };
}

/**
 * Registers the consumer host as the board container.
 * Exactly one container per board. Must run inside `DnDGemProvider`.
 */
export const dndgemContainer: Action<HTMLElement> = (node) => {
  return createBoundContainerAction(requireBoard('dndgemContainer'))(node);
};

/**
 * Registers the consumer host as a layout item. The action parameter is the
 * Core item id (`use:dndgemItem={'revenue'}`), not a component instance.
 */
export const dndgemItem: Action<HTMLElement, string> = (node, id) => {
  return createBoundItemAction(requireBoard('dndgemItem'))(node, id);
};
