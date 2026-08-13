import { createLayoutSession, type DragDropResult, type LayoutSessionState } from '@dndgem/dom';

export interface VanillaFixtureProbe {
  phase?: string;
  validity?: string;
  lastDropAccepted?: boolean;
  lastDropItemId?: string;
  aX?: number;
  bX?: number;
  spaceWidth?: number;
  rejectAccepted?: boolean;
  rejectX?: number;
  cancelCount?: number;
}

declare global {
  interface Window {
    __DNDGEM_D17_VANILLA?: VanillaFixtureProbe;
  }
}

const board = document.getElementById('board');
const itemA = document.getElementById('item-a');
const itemB = document.getElementById('item-b');
const rejectBoard = document.getElementById('reject-board');
const itemC = document.getElementById('item-c');
const log = document.getElementById('log');

if (
  !(board instanceof HTMLElement) ||
  !(itemA instanceof HTMLElement) ||
  !(itemB instanceof HTMLElement) ||
  !(rejectBoard instanceof HTMLElement) ||
  !(itemC instanceof HTMLElement)
) {
  throw new Error('DND-1.7 vanilla fixture DOM nodes are missing');
}

const probe: VanillaFixtureProbe = {};
window.__DNDGEM_D17_VANILLA = probe;

function renderLog(): void {
  if (log) {
    log.textContent = JSON.stringify(probe, null, 2);
  }
}

function syncMain(state: LayoutSessionState): void {
  probe.phase = state.phase;
  probe.validity = state.solver.evaluation.state;
  probe.aX = state.resolved.placements.a?.x;
  probe.bX = state.resolved.placements.b?.x;
  probe.spaceWidth = state.resolved.space.width;
  if (state.lastDrop !== undefined) {
    probe.lastDropAccepted = state.lastDrop.accepted;
    probe.lastDropItemId = state.lastDrop.itemId;
  }
  renderLog();
}

createLayoutSession({
  container: board,
  items: [
    {
      id: 'a',
      element: itemA,
      constraints: {
        minWidth: 40,
        minHeight: 20,
        preferredWidth: 100,
        preferredHeight: 60,
      },
    },
    {
      id: 'b',
      element: itemB,
      constraints: {
        minWidth: 40,
        minHeight: 20,
        preferredWidth: 80,
        preferredHeight: 60,
      },
    },
  ],
  desiredPlacements: {
    a: { x: 16, y: 16, width: 100, height: 60 },
    b: { x: 140, y: 16, width: 80, height: 60 },
  },
  onChange: syncMain,
  onDrop: (event: { readonly result: DragDropResult }) => {
    probe.lastDropAccepted = event.result.accepted;
    probe.lastDropItemId = event.result.itemId;
    renderLog();
  },
  onCancel: () => {
    probe.cancelCount = (probe.cancelCount ?? 0) + 1;
    probe.phase = 'idle';
    renderLog();
  },
});

createLayoutSession({
  container: rejectBoard,
  items: [
    {
      id: 'c',
      element: itemC,
      constraints: { minWidth: 200, minHeight: 200 },
    },
  ],
  desiredPlacements: { c: { x: 8, y: 8, width: 80, height: 80 } },
  onDrop: (event) => {
    probe.rejectAccepted = event.result.accepted;
    probe.rejectX = event.result.intent.desiredPlacements?.c?.x;
    renderLog();
  },
  onChange: (state) => {
    if (state.lastDrop !== undefined) {
      probe.rejectAccepted = state.lastDrop.accepted;
    }
    renderLog();
  },
});

renderLog();
