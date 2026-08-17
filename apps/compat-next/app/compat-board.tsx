'use client';

import type { ReactElement } from 'react';
import { DnDGemProvider, useDnDGem, useDnDGemContainer, useDnDGemItem } from '@dndgem/react';
import type { LayoutSessionState } from '@dndgem/react';
import { createCountingResizeObserver, ensureProbe } from './probe';

const ITEMS = [
  {
    id: 'revenue',
    constraints: {
      minWidth: 96,
      minHeight: 64,
      minUsefulWidth: 140,
      minUsefulHeight: 72,
      preferredWidth: 180,
      preferredHeight: 88,
    },
  },
  {
    id: 'expenses',
    constraints: {
      minWidth: 96,
      minHeight: 64,
      minUsefulWidth: 140,
      minUsefulHeight: 72,
      preferredWidth: 180,
      preferredHeight: 88,
    },
  },
] as const;

const DESIRED = {
  revenue: { x: 12, y: 12, width: 180, height: 88 },
};

const CountingResizeObserver = createCountingResizeObserver();

function syncProbe(state: LayoutSessionState): void {
  const probe = ensureProbe();
  probe.ready = true;
  probe.phase = state.phase;
  probe.validity = state.solver.evaluation.state;
  probe.lastDropAccepted = state.lastDrop?.accepted;
  probe.spaceWidth = state.resolved.space.width;
  probe.proposalUnplaced = state.autoLayout?.proposalUnplacedItemIds.length;
}

function Board(): ReactElement {
  const containerRef = useDnDGemContainer();
  const { state, ready } = useDnDGem();
  const revenue = useDnDGemItem('revenue');
  const expenses = useDnDGemItem('expenses');

  const status = state
    ? `${state.solver.evaluation.state} · ${state.phase}${
        state.autoLayout
          ? ` · auto proposal unresolved: ${state.autoLayout.proposalUnplacedItemIds.length}`
          : ''
      }`
    : 'starting';

  return (
    <main>
      <h1>DnDGem Next Compat</h1>
      <p>
        App Router client boundary over <code>@dndgem/react</code>. Session is client-only.
      </p>
      <p data-testid="status">{ready ? status : 'starting'}</p>
      <div ref={containerRef} className="board" data-testid="board">
        <article
          ref={revenue.ref}
          style={revenue.style}
          className="item revenue"
          data-testid="item-revenue"
          aria-label="Revenue"
          tabIndex={0}
        >
          <h2>Revenue</h2>
          <p>Explicit Source Intent</p>
          <button type="button" data-testid="item-revenue-action">
            Details
          </button>
        </article>
        <article
          ref={expenses.ref}
          style={expenses.style}
          className="item expenses"
          data-testid="item-expenses"
          aria-label="Expenses"
          tabIndex={0}
        >
          <h2>Expenses</h2>
          <p>Auto-Layout generated</p>
        </article>
      </div>
    </main>
  );
}

export function CompatBoard(): ReactElement {
  return (
    <DnDGemProvider
      items={ITEMS}
      desiredPlacements={DESIRED}
      autoLayout
      ResizeObserver={CountingResizeObserver}
      onChange={syncProbe}
      onCancel={() => {
        const probe = ensureProbe();
        probe.cancelCount += 1;
      }}
    >
      <Board />
    </DnDGemProvider>
  );
}
