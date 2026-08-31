import { DnDGemProvider, useDnDGem, useDnDGemContainer, useDnDGemItem } from '@dndgem/react';

export interface PlaygroundProbe {
  phase?: string;
  validity?: string;
  lastDropAccepted?: boolean;
  chartX?: number;
  spaceWidth?: number;
  cancelCount?: number;
  autoLayoutEnabled?: boolean;
  unplacedCount?: number;
}

declare global {
  interface Window {
    __DNDGEM_D17?: PlaygroundProbe;
  }
}

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
      // Tall readable body: board starts at 360px height, so a normal
      // bottom-right shrink below this useful floor yields real DEGRADED
      // while hard mins still fit — without displacing Source Intent chart.
      minUsefulHeight: 240,
      preferredWidth: 180,
      preferredHeight: 240,
    },
  },
  {
    id: 'metric',
    constraints: {
      minWidth: 72,
      minHeight: 64,
      minUsefulWidth: 88,
      minUsefulHeight: 72,
      // Preferred width keeps the compact constraint label readable at VALID.
      preferredWidth: 112,
      preferredHeight: 80,
    },
  },
] as const;

const DESIRED = {
  // Partial Source Intent — Auto-Layout places table/details/metric.
  chart: { x: 12, y: 12, width: 240, height: 96 },
};

const COPY: Record<string, { title: string; body: string; className: string; ariaLabel: string }> =
  {
    chart: {
      title: 'Chart',
      body: 'Needs ≥180px useful width',
      className: 'item chart',
      ariaLabel: 'Chart panel',
    },
    table: {
      title: 'Table',
      body: 'Needs ≥220px useful width',
      className: 'item table',
      ariaLabel: 'Table panel',
    },
    details: {
      title: 'Details',
      body: 'Needs ≥240px useful height',
      className: 'item details',
      ariaLabel: 'Details panel',
    },
    metric: {
      title: '42',
      body: '≥88×72',
      className: 'item metric',
      ariaLabel: 'Metric panel',
    },
  };

function stateExplanation(state: string | undefined): string | null {
  switch (state) {
    case 'VALID':
      return 'The layout fits and current content-usefulness constraints are satisfied.';
    case 'DEGRADED':
      return 'The layout still fits, but one or more useful-content constraints are missed.';
    case 'INVALID':
      return 'The layout violates one or more hard size constraints.';
    default:
      return null;
  }
}

function Board() {
  const containerRef = useDnDGemContainer();
  const { state } = useDnDGem();
  const chart = useDnDGemItem('chart');
  const table = useDnDGemItem('table');
  const details = useDnDGemItem('details');
  const metric = useDnDGemItem('metric');
  const bindings = { chart, table, details, metric } as const;

  const existing = window.__DNDGEM_D17;
  const probe: PlaygroundProbe = {
    phase: state?.phase,
    validity: state?.solver.evaluation.state,
    lastDropAccepted: state?.lastDrop?.accepted,
    chartX: state?.resolved.placements.chart?.x,
    spaceWidth: state?.resolved.space.width,
    cancelCount: existing?.cancelCount,
    autoLayoutEnabled: state?.autoLayout?.enabled,
    unplacedCount: state?.autoLayout?.proposalUnplacedItemIds.length,
  };
  window.__DNDGEM_D17 = probe;

  const evaluationState = state?.solver.evaluation.state;
  const explanation = stateExplanation(evaluationState);
  const spaceWidth = state ? Math.round(state.resolved.space.width) : null;
  const spaceHeight = state ? Math.round(state.resolved.space.height) : null;
  const autoOn = Boolean(state?.autoLayout);

  return (
    <main className="shell">
      <header className="intro">
        <h1>DnDGem Playground</h1>
        <p className="lede">Geometric fit isn&apos;t enough.</p>
        <p
          className="thesis"
          aria-label="Geometrically fits is not the same as content remains useful"
        >
          Geometrically fits ≠ content remains useful
        </p>
        <p className="thesis-explain">
          A card can still fit inside the layout while becoming too small for its content to remain
          useful.
        </p>
        <p className="prompt">
          Resize the layout and watch DnDGem evaluate whether the content still has enough useful
          space.
        </p>
      </header>

      <ol className="steps">
        <li>
          <strong>Resize</strong> the board from its bottom-right corner.
        </li>
        <li>
          <strong>Watch</strong> the engine move between useful and degraded states as content
          constraints are satisfied or missed.
        </li>
        <li>
          <strong>Drag</strong> a card and see the layout resolve again.
        </li>
      </ol>

      <div className="demo">
        <aside
          className={`engine-status${evaluationState ? ` is-${evaluationState.toLowerCase()}` : ''}`}
          data-testid="status"
          aria-live="polite"
        >
          {state ? (
            <>
              <p className="engine-label">Engine state</p>
              <p className="engine-state">{evaluationState}</p>
              {explanation ? <p className="engine-hint">{explanation}</p> : null}
              <dl className="engine-metrics">
                <div>
                  <dt>Score</dt>
                  <dd>{state.solver.evaluation.score.total.toFixed(3)}</dd>
                </div>
                <div>
                  <dt>Space</dt>
                  <dd>
                    {spaceWidth} × {spaceHeight}
                  </dd>
                </div>
                <div>
                  <dt>Auto-Layout</dt>
                  <dd>{autoOn ? 'ON · auto' : 'OFF'}</dd>
                </div>
                <div>
                  <dt>Phase</dt>
                  <dd>{state.phase}</dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="engine-state">starting</p>
          )}
        </aside>

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
                aria-label={copy.ariaLabel}
              >
                <h2>{copy.title}</h2>
                <p>{copy.body}</p>
              </article>
            );
          })}
        </div>
      </div>

      <div className="dev-tools">
        <button type="button" data-testid="focus-probe" className="focus-probe">
          Focus probe
        </button>
      </div>
    </main>
  );
}

export function App() {
  return (
    <DnDGemProvider
      items={ITEMS}
      desiredPlacements={DESIRED}
      autoLayout
      onCancel={() => {
        const probe = window.__DNDGEM_D17 ?? {};
        probe.cancelCount = (probe.cancelCount ?? 0) + 1;
        window.__DNDGEM_D17 = probe;
      }}
    >
      <Board />
    </DnDGemProvider>
  );
}
