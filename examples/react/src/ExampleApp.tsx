import { DnDGemProvider, useDnDGem, useDnDGemContainer, useDnDGemItem } from '@dndgem/react';

/**
 * Representative dashboard board: heterogeneous content needs.
 * Shrink the board to observe VALID → DEGRADED when minUseful* is missed.
 */
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
  {
    id: 'cashflow',
    constraints: {
      minWidth: 160,
      minHeight: 96,
      minUsefulWidth: 220,
      minUsefulHeight: 120,
      preferredWidth: 280,
      preferredHeight: 160,
    },
  },
  {
    id: 'transactions',
    constraints: {
      minWidth: 180,
      minHeight: 120,
      minUsefulWidth: 240,
      minUsefulHeight: 160,
      preferredWidth: 300,
      preferredHeight: 200,
    },
  },
  {
    id: 'alerts',
    constraints: {
      minWidth: 72,
      minHeight: 64,
      minUsefulWidth: 96,
      minUsefulHeight: 72,
      preferredWidth: 120,
      preferredHeight: 80,
    },
  },
  {
    id: 'notes',
    constraints: {
      minWidth: 100,
      minHeight: 80,
      minUsefulWidth: 140,
      minUsefulHeight: 100,
      preferredWidth: 200,
      preferredHeight: 140,
    },
  },
] as const;

const DESIRED = {
  // Partial Source Intent — remaining cards are Auto-Layout generated (opt-in).
  revenue: { x: 12, y: 12, width: 180, height: 88 },
};

const COPY: Record<string, { title: string; body: string; className: string }> = {
  revenue: {
    title: 'Revenue',
    body: 'KPI · compact OK · useful ≥ 140',
    className: 'item revenue',
  },
  expenses: {
    title: 'Expenses',
    body: 'KPI · compact OK · useful ≥ 140',
    className: 'item expenses',
  },
  cashflow: {
    title: 'Cash Flow',
    body: 'Chart · needs meaningful width',
    className: 'item cashflow',
  },
  transactions: {
    title: 'Transactions',
    body: 'Table · needs vertical space',
    className: 'item transactions',
  },
  alerts: {
    title: 'Alerts',
    body: 'Tolerates a smaller slot',
    className: 'item alerts',
  },
  notes: {
    title: 'Notes',
    body: 'Text · prefers readable height',
    className: 'item notes',
  },
};

function Board() {
  const containerRef = useDnDGemContainer();
  const { state } = useDnDGem();
  const revenue = useDnDGemItem('revenue');
  const expenses = useDnDGemItem('expenses');
  const cashflow = useDnDGemItem('cashflow');
  const transactions = useDnDGemItem('transactions');
  const alerts = useDnDGemItem('alerts');
  const notes = useDnDGemItem('notes');
  const bindings = { revenue, expenses, cashflow, transactions, alerts, notes } as const;

  return (
    <main>
      <h1>DnDGem React Example</h1>
      <p>
        Opt-in Auto-Layout (<code>autoLayout</code>): one explicit Source Intent card; DnDGem places
        the rest. Resize to see adaptive retention; drag an automatic card to promote it to Source
        Intent. Published npm <code>0.1.0-alpha.0</code> does not include this yet — repository /
        next Alpha.
      </p>
      <p data-testid="status">
        {state
          ? `${state.solver.evaluation.state} · ${state.phase}${
              state.autoLayout
                ? ` · auto proposal unresolved: ${state.autoLayout.proposalUnplacedItemIds.length}`
                : ''
            }`
          : 'starting'}
      </p>
      <div ref={containerRef} className="board" data-testid="board">
        {ITEMS.map((item) => {
          const binding = bindings[item.id];
          const copy = COPY[item.id];
          if (copy === undefined) {
            return null;
          }
          return (
            <article
              key={item.id}
              ref={binding.ref}
              style={binding.style}
              className={copy.className}
              data-testid={`item-${item.id}`}
              aria-label={copy.title}
            >
              <h2>{copy.title}</h2>
              <p>{copy.body}</p>
            </article>
          );
        })}
      </div>
    </main>
  );
}

export function ExampleApp() {
  return (
    <DnDGemProvider items={ITEMS} desiredPlacements={DESIRED} autoLayout>
      <Board />
    </DnDGemProvider>
  );
}
