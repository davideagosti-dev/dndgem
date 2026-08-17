import { inject } from '@angular/core';
import { DnDGemBoard } from './board.js';
import { boardScopeError } from './errors.js';

/**
 * Inject the board-local DnDGem session owner.
 * Throws when used outside `dndgemBoard`.
 */
export function injectDnDGem(): DnDGemBoard {
  const board = inject(DnDGemBoard, { optional: true });
  if (board === null) {
    throw boardScopeError('injectDnDGem()');
  }
  return board;
}
