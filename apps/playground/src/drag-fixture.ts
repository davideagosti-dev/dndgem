import { createLayoutIntent, createResolvedLayout } from '@dndgem/core';
import { createDragInteraction, type DragDropResult, type DragProposal } from '@dndgem/dom';

export interface DragFixtureProbe {
  lastProposal?: {
    itemId: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lastDrop?: {
    accepted: boolean;
    itemId: string;
    state: string;
    x?: number;
    y?: number;
  };
}

declare global {
  interface Window {
    __DNDGEM_D16?: DragFixtureProbe;
  }
}

const board = document.getElementById('board');
const itemA = document.getElementById('item-a');
const itemB = document.getElementById('item-b');
const log = document.getElementById('log');

if (
  !(board instanceof HTMLElement) ||
  !(itemA instanceof HTMLElement) ||
  !(itemB instanceof HTMLElement)
) {
  throw new Error('DND-1.6 drag fixture DOM nodes are missing');
}

const intent = createLayoutIntent({
  space: { width: 480, height: 240 },
  items: [
    {
      id: 'a',
      measuredSize: { width: 100, height: 60 },
      constraints: {
        minWidth: 40,
        minHeight: 20,
        preferredWidth: 100,
        preferredHeight: 60,
      },
    },
    {
      id: 'b',
      measuredSize: { width: 80, height: 60 },
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
});

const probe: DragFixtureProbe = {};
window.__DNDGEM_D16 = probe;

function renderLog(): void {
  if (log) {
    log.textContent = JSON.stringify(probe, null, 2);
  }
}

function recordProposal(proposal: DragProposal): void {
  probe.lastProposal = {
    itemId: proposal.itemId,
    x: proposal.desiredPlacement.x,
    y: proposal.desiredPlacement.y,
    width: proposal.desiredPlacement.width,
    height: proposal.desiredPlacement.height,
  };
  renderLog();
}

function recordDrop(result: DragDropResult): void {
  const placed = result.intent.desiredPlacements?.[result.itemId];
  probe.lastDrop = {
    accepted: result.accepted,
    itemId: result.itemId,
    state: result.solver.evaluation.state,
    x: placed?.x,
    y: placed?.y,
  };
  renderLog();
}

createDragInteraction({
  container: board,
  items: { a: itemA, b: itemB },
  intent,
  previous: createResolvedLayout({
    space: intent.space,
    placements: intent.desiredPlacements ?? {},
  }),
  onProposal: (event) => {
    recordProposal(event.proposal);
  },
  onDrop: (event) => {
    recordDrop(event.result);
  },
});

renderLog();
