import { Directive, afterRenderEffect, inject, input, output, untracked } from '@angular/core';
import type { RectInput } from '@dndgem/core';
import type {
  DragCancelEvent,
  DragDropResult,
  DragMechanicsAdapter,
  LayoutSessionState,
  ResizeObserverConstructor,
} from '@dndgem/dom';
import { DnDGemBoard } from './board.js';
import type { DnDGemItemConfig } from './types.js';

/**
 * Board owner. Provides a board-local `DnDGemBoard` and owns layout configuration.
 * Attach to a consumer host (typically the same node as `dndgemContainer`).
 * Does not insert wrapper DOM.
 */
@Directive({
  selector: '[dndgemBoard]',
  standalone: true,
  providers: [DnDGemBoard],
  exportAs: 'dndgemBoard',
})
export class DnDGemBoardDirective {
  readonly dndgemItems = input.required<readonly DnDGemItemConfig[]>();
  readonly dndgemDesiredPlacements = input<Readonly<Record<string, RectInput>> | undefined>(
    undefined,
  );
  readonly dndgemAutoLayout = input(false);
  readonly dndgemMechanics = input<DragMechanicsAdapter | undefined>(undefined);
  readonly dndgemResizeObserver = input<ResizeObserverConstructor | undefined>(undefined);

  readonly dndgemChange = output<LayoutSessionState>();
  readonly dndgemDrop = output<{ readonly result: DragDropResult }>();
  readonly dndgemCancel = output<DragCancelEvent>();

  readonly board = inject(DnDGemBoard);
  readonly state = this.board.state;
  readonly ready = this.board.ready;

  constructor() {
    this.board.setCallbacks({
      onChange: (state) => {
        this.dndgemChange.emit(state);
      },
      onDrop: (event) => {
        this.dndgemDrop.emit(event);
      },
      onCancel: (event) => {
        this.dndgemCancel.emit(event);
      },
    });

    afterRenderEffect(() => {
      const items = this.dndgemItems();
      const desiredPlacements = this.dndgemDesiredPlacements();
      const autoLayout = this.dndgemAutoLayout();
      const mechanics = this.dndgemMechanics();
      const ResizeObserver = this.dndgemResizeObserver();
      this.board.registryGeneration();
      untracked(() => {
        this.board.configure({
          items,
          desiredPlacements,
          autoLayout,
          mechanics,
          ResizeObserver,
        });
        this.board.syncSession();
      });
    });
  }
}
