import { Directive, ElementRef, type OnDestroy, inject } from '@angular/core';
import { DnDGemBoard } from './board.js';
import { boardScopeError } from './errors.js';

/**
 * Registers the consumer host as the board container.
 * Exactly one container per board. May share the `dndgemBoard` host.
 */
@Directive({
  selector: '[dndgemContainer]',
  standalone: true,
})
export class DnDGemContainerDirective implements OnDestroy {
  private readonly board = inject(DnDGemBoard, { optional: true });
  private readonly host = inject(ElementRef<HTMLElement>);

  constructor() {
    if (this.board === null) {
      throw boardScopeError('dndgemContainer');
    }
    this.board.registerContainer(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.board?.registerContainer(null);
  }
}
