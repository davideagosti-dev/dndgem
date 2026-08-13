import { DnDGemProvider, useDnDGem, useDnDGemContainer, useDnDGemItem } from '@dndgem/react';

const ITEMS = [
  {
    id: 'chart',
    constraints: {
      minWidth: 120,
      minHeight: 64,
      minUsefulWidth: 180,
      minUsefulHeight: 72,
      preferredWidth: 240,
      preferredHeight: 96,
    },
  },
  {
    id: 'table',
    constraints: {
      minWidth: 160,
      minHeight: 72,
      minUsefulWidth: 220,
      minUsefulHeight: 96,
      preferredWidth: 280,
      preferredHeight: 140,
    },
  },
  {
    id: 'details',
    constraints: {
      minWidth: 100,
      minHeight: 80,
      minUsefulWidth: 140,
      minUsefulHeight: 120,
      preferredWidth: 180,
      preferredHeight: 160,
    },
  },
  {
    id: 'metric',
    constraints: {
      minWidth: 72,
      minHeight: 64,
      minUsefulWidth: 88,
      minUsefulHeight: 72,
      preferredWidth: 96,
      preferredHeight: 80,
    },
  },
] as const;

const DESIRED = {
  chart: { x: 12, y: 12, width: 240, height: 96 },
  table: { x: 264, y: 12, width: 280, height: 140 },
  details: { x: 12, y: 120, width: 180, height: 160 },
  metric: { x: 204, y: 168, width: 96, height: 80 },
};

const COPY: Record<string, { title: string; body: string; className: string }> = {
  chart: { title: 'Chart', body: 'Wide card · min useful 180', className: 'item chart' },
  table: { title: 'Table', body: 'Dense rows · min useful 220', className: 'item table' },
  details: { title: 'Details', body: 'Text panel that needs height.', className: 'item details' },
  metric: { title: '42', body: 'Metric', className: 'item metric' },
};

function Board() {
  const containerRef = useDnDGemContainer();
  const { state } = useDnDGem();
  const chart = useDnDGemItem('chart');
  const table = useDnDGemItem('table');
  const details = useDnDGemItem('details');
  const metric = useDnDGemItem('metric');
  const bindings = { chart, table, details, metric } as const;

  return (
    <main>
      <h1>DnDGem React Example</h1>
      <p>
        Public <code>@dndgem/react</code> adapter over the same DOM layout session.
      </p>
      <p data-testid="status">
        {state ? `${state.solver.evaluation.state} · ${state.phase}` : 'starting'}
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
    <DnDGemProvider items={ITEMS} desiredPlacements={DESIRED}>
      <Board />
    </DnDGemProvider>
  );
}
