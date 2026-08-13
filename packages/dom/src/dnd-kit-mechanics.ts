/**
 * Internal @dnd-kit/dom adapter. Not part of the public @dndgem/dom API.
 *
 * Provider collision/hit-testing is interaction mechanics only. It is never
 * Core validity, overlap policy, or solver ranking.
 */
import { DragDropManager, Draggable, Feedback } from '@dnd-kit/dom';
import type { DragMechanicsAdapter, DragMechanicsContext, DragTranslation } from './interaction.js';

function readTranslation(transform: { readonly x: number; readonly y: number }): DragTranslation {
  return { x: transform.x, y: transform.y };
}

function sourceItemId(
  source: { readonly id: string | number | symbol } | null,
): string | undefined {
  if (source === null) {
    return undefined;
  }
  const { id } = source;
  if (typeof id === 'string') {
    return id;
  }
  if (typeof id === 'number' && Number.isFinite(id)) {
    return String(id);
  }
  return undefined;
}

/**
 * Default browser mechanics: @dnd-kit/dom behind the DnDGem-owned callback seam.
 */
export const dndKitMechanicsAdapter: DragMechanicsAdapter = {
  connect(context: DragMechanicsContext) {
    const manager = new DragDropManager({
      plugins: (defaults) => [...defaults, Feedback.configure({ dropAnimation: null })],
    });

    const draggables: Draggable[] = [];
    for (const itemId of Object.keys(context.items)) {
      const element = context.items[itemId];
      if (element === undefined) {
        continue;
      }
      draggables.push(new Draggable({ id: itemId, element }, manager));
    }

    const stopStart = manager.monitor.addEventListener('dragstart', (event) => {
      const itemId = sourceItemId(event.operation.source);
      if (itemId === undefined) {
        return;
      }
      context.onStart({ itemId });
    });

    const stopMove = manager.monitor.addEventListener('dragmove', (event) => {
      const itemId = sourceItemId(event.operation.source);
      if (itemId === undefined) {
        return;
      }
      context.onMove({
        itemId,
        translation: readTranslation(event.operation.transform),
      });
    });

    const stopEnd = manager.monitor.addEventListener('dragend', (event) => {
      const itemId = sourceItemId(event.operation.source);
      if (itemId === undefined) {
        return;
      }
      if (event.canceled) {
        context.onCancel({ itemId });
        return;
      }
      context.onDrop({
        itemId,
        translation: readTranslation(event.operation.transform),
      });
    });

    return {
      dispose() {
        stopStart();
        stopMove();
        stopEnd();
        for (const draggable of draggables) {
          draggable.destroy();
        }
        manager.destroy();
      },
    };
  },
};
