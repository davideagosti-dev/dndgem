import {
  Directive,
  ElementRef,
  type OnDestroy,
  type OnInit,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { DnDGemBoard } from './board.js';
import { boardScopeError } from './errors.js';

/**
 * Registers the consumer host as a layout item. The attribute value is the
 * Core item id (`dndgemItem="revenue"`), not the component instance.
 */
@Directive({
  selector: '[dndgemItem]',
  standalone: true,
})
export class DnDGemItemDirective implements OnInit, OnDestroy {
  readonly dndgemItem = input.required<string>();

  private readonly board = inject(DnDGemBoard, { optional: true });
  private readonly host = inject(ElementRef<HTMLElement>);
  private registeredId: string | undefined;
  private initialized = false;

  constructor() {
    if (this.board === null) {
      throw boardScopeError('dndgemItem');
    }

    effect(() => {
      const id = this.dndgemItem();
      if (!this.initialized) {
        return;
      }
      untracked(() => {
        this.bind(id);
      });
    });
  }

  ngOnInit(): void {
    this.initialized = true;
    this.bind(this.dndgemItem());
  }

  ngOnDestroy(): void {
    this.bind(null);
  }

  private bind(id: string | null): void {
    if (this.board === null) {
      return;
    }
    if (this.registeredId !== undefined) {
      this.board.registerItem(this.registeredId, null);
      this.registeredId = undefined;
    }
    if (id === null || id === '') {
      if (id === '') {
        throw new Error('dndgemItem requires a non-empty item id');
      }
      return;
    }
    this.board.registerItem(id, this.host.nativeElement);
    this.registeredId = id;
  }
}
