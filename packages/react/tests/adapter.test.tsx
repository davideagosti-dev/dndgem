import { StrictMode, act, useEffect, useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createLayoutSession } from '@dndgem/dom';
import {
  DnDGemProvider,
  useDnDGem,
  useDnDGemContainer,
  useDnDGemItem,
  type DnDGemItemConfig,
} from '../src/index.js';
import {
  FakeResizeObserver,
  createFakeDragMechanics,
  resetFakeResizeObservers,
  stubRect,
} from './helpers.js';

afterEach(() => {
  cleanup();
  resetFakeResizeObservers();
});

const ITEMS: readonly DnDGemItemConfig[] = [
  {
    id: 'chart',
    constraints: { minWidth: 40, minHeight: 20, preferredWidth: 120, preferredHeight: 60 },
  },
  {
    id: 'table',
    constraints: { minWidth: 40, minHeight: 20, preferredWidth: 80, preferredHeight: 60 },
  },
];

const DESIRED = {
  chart: { x: 8, y: 8, width: 120, height: 60 },
  table: { x: 140, y: 8, width: 80, height: 60 },
};

function Board() {
  const containerRef = useDnDGemContainer();
  const chart = useDnDGemItem('chart');
  const table = useDnDGemItem('table');
  const { state, ready } = useDnDGem();

  return (
    <div>
      <div
        data-testid="board"
        ref={(node) => {
          if (node) {
            stubRect(node, { left: 0, top: 0, width: 400, height: 200 });
          }
          containerRef(node);
        }}
      >
        <article
          data-testid="item-chart"
          ref={(node) => {
            if (node) {
              stubRect(node, { left: 8, top: 8, width: 120, height: 60 });
            }
            chart.ref(node);
          }}
          style={chart.style}
        >
          chart
        </article>
        <article
          data-testid="item-table"
          ref={(node) => {
            if (node) {
              stubRect(node, { left: 140, top: 8, width: 80, height: 60 });
            }
            table.ref(node);
          }}
          style={table.style}
        >
          table
        </article>
      </div>
      <div data-testid="ready">{ready ? 'yes' : 'no'}</div>
      <div data-testid="phase">{state?.phase ?? 'none'}</div>
      <div data-testid="chart-x">{state?.resolved.placements.chart?.x ?? ''}</div>
      <div data-testid="validity">{state?.solver.evaluation.state ?? ''}</div>
    </div>
  );
}

function Harness({
  items = ITEMS,
  desiredPlacements = DESIRED,
  strict = false,
  mechanics,
}: {
  items?: readonly DnDGemItemConfig[];
  desiredPlacements?: typeof DESIRED;
  strict?: boolean;
  mechanics?: ReturnType<typeof createFakeDragMechanics>;
}) {
  const tree = (
    <DnDGemProvider
      items={items}
      desiredPlacements={desiredPlacements}
      mechanics={mechanics?.adapter}
      ResizeObserver={FakeResizeObserver}
    >
      <Board />
    </DnDGemProvider>
  );
  return strict ? <StrictMode>{tree}</StrictMode> : tree;
}

describe('@dndgem/react integration', () => {
  it('registers items and renders resolved geometry on the matching element', () => {
    const mechanics = createFakeDragMechanics();
    render(<Harness mechanics={mechanics} />);
    expect(screen.getByTestId('ready').textContent).toBe('yes');
    const chart = screen.getByTestId('item-chart');
    const table = screen.getByTestId('item-table');
    expect(chart.style.left).toBe('8px');
    expect(chart.style.width).toBe('120px');
    expect(table.style.left).toBe('140px');
    expect(table.style.width).toBe('80px');
    expect(chart.style.left).not.toBe(table.style.left);
    expect(screen.getByTestId('chart-x').textContent).toBe('8');
  });

  it('exposes drag proposal state and commits an accepted drop', () => {
    const mechanics = createFakeDragMechanics();
    render(<Harness mechanics={mechanics} />);
    act(() => {
      mechanics.start('chart');
      mechanics.move('chart', { x: 20, y: 10 });
    });
    expect(screen.getByTestId('phase').textContent).toBe('dragging');
    act(() => {
      mechanics.drop('chart', { x: 20, y: 10 });
    });
    expect(screen.getByTestId('phase').textContent).toBe('idle');
    expect(screen.getByTestId('chart-x').textContent).toBe('28');
    expect(screen.getByTestId('item-chart').style.left).toBe('28px');
    expect(screen.getByTestId('item-table').style.left).toBe('140px');
  });

  it('restores committed layout on cancel', () => {
    const mechanics = createFakeDragMechanics();
    render(<Harness mechanics={mechanics} />);
    act(() => {
      mechanics.start('chart');
      mechanics.move('chart', { x: 30, y: 0 });
    });
    expect(screen.getByTestId('phase').textContent).toBe('dragging');
    act(() => {
      mechanics.cancel('chart');
    });
    expect(screen.getByTestId('phase').textContent).toBe('idle');
    expect(screen.getByTestId('chart-x').textContent).toBe('8');
    expect(screen.getByTestId('item-chart').style.left).toBe('8px');
  });

  it('preserves layout when a drop is rejected', () => {
    const mechanics = createFakeDragMechanics();
    render(
      <Harness
        mechanics={mechanics}
        items={[
          { id: 'chart', constraints: { minWidth: 300, minHeight: 160 } },
          { id: 'table', constraints: { minWidth: 300, minHeight: 160 } },
        ]}
      />,
    );
    const before = screen.getByTestId('chart-x').textContent;
    act(() => {
      mechanics.start('chart');
      mechanics.drop('chart', { x: 5, y: 5 });
    });
    expect(screen.getByTestId('chart-x').textContent).toBe(before);
  });

  it('disposes the session on unmount', () => {
    const mechanics = createFakeDragMechanics();
    const view = render(<Harness mechanics={mechanics} />);
    expect(mechanics.isConnected()).toBe(true);
    view.unmount();
    expect(mechanics.isConnected()).toBe(false);
  });

  it('does not keep duplicate observers under StrictMode', () => {
    const mechanics = createFakeDragMechanics();
    render(<Harness mechanics={mechanics} strict />);
    expect(mechanics.isConnected()).toBe(true);
    expect(FakeResizeObserver.instances.filter((instance) => !instance.disconnected)).toHaveLength(
      1,
    );
    expect(screen.getByTestId('ready').textContent).toBe('yes');
  });

  it('re-solves when constraints change', () => {
    const mechanics = createFakeDragMechanics();
    function Wrapper() {
      const [items, setItems] = useState<readonly DnDGemItemConfig[]>(ITEMS);
      useEffect(() => {
        setItems([
          {
            id: 'chart',
            constraints: {
              minWidth: 40,
              minHeight: 20,
              preferredWidth: 200,
              preferredHeight: 80,
            },
          },
          {
            id: 'table',
            constraints: { minWidth: 40, minHeight: 20, preferredWidth: 80, preferredHeight: 60 },
          },
        ]);
      }, []);
      return <Harness mechanics={mechanics} items={items} />;
    }
    render(<Wrapper />);
    expect(screen.getByTestId('ready').textContent).toBe('yes');
    expect(screen.getByTestId('validity').textContent).toMatch(/VALID|DEGRADED|INVALID/);
  });

  it('respects an explicit desiredPlacements update without previous stability', () => {
    const mechanics = createFakeDragMechanics();
    function Wrapper() {
      const [desired, setDesired] = useState(DESIRED);
      useEffect(() => {
        setDesired({
          chart: { x: 40, y: 8, width: 120, height: 60 },
          table: { x: 172, y: 8, width: 80, height: 60 },
        });
      }, []);
      return <Harness mechanics={mechanics} desiredPlacements={desired} />;
    }
    render(<Wrapper />);
    expect(screen.getByTestId('chart-x').textContent).toBe('40');
    expect(screen.getByTestId('item-chart').style.left).toBe('40px');
  });

  it('invokes the latest onDrop without rebuilding the session', () => {
    const mechanics = createFakeDragMechanics();
    const tags: string[] = [];
    function Wrapper() {
      const [tag, setTag] = useState('A');
      return (
        <>
          <button type="button" data-testid="flip-callback" onClick={() => setTag('B')}>
            flip
          </button>
          <DnDGemProvider
            items={ITEMS}
            desiredPlacements={DESIRED}
            mechanics={mechanics.adapter}
            ResizeObserver={FakeResizeObserver}
            onDrop={() => {
              tags.push(tag);
            }}
          >
            <Board />
          </DnDGemProvider>
        </>
      );
    }
    render(<Wrapper />);
    const connectsAfterMount = mechanics.connectCount();
    expect(connectsAfterMount).toBeGreaterThan(0);
    act(() => {
      screen.getByTestId('flip-callback').click();
    });
    expect(mechanics.connectCount()).toBe(connectsAfterMount);
    act(() => {
      mechanics.start('chart');
      mechanics.drop('chart', { x: 20, y: 10 });
    });
    expect(tags).toEqual(['B']);
    expect(mechanics.connectCount()).toBe(connectsAfterMount);
  });

  it('matches createLayoutSession resolved placements for the same inputs', () => {
    const mechanics = createFakeDragMechanics();
    render(<Harness mechanics={mechanics} />);
    const reactChartX = Number(screen.getByTestId('chart-x').textContent);
    const reactTableLeft = screen.getByTestId('item-table').style.left;

    const vanillaMechanics = createFakeDragMechanics();
    const container = document.createElement('div');
    const chartEl = document.createElement('article');
    const tableEl = document.createElement('article');
    stubRect(container, { left: 0, top: 0, width: 400, height: 200 });
    stubRect(chartEl, { left: 8, top: 8, width: 120, height: 60 });
    stubRect(tableEl, { left: 140, top: 8, width: 80, height: 60 });
    container.append(chartEl, tableEl);
    document.body.append(container);
    try {
      const session = createLayoutSession({
        container,
        items: [
          { id: 'chart', element: chartEl, constraints: ITEMS[0]?.constraints },
          { id: 'table', element: tableEl, constraints: ITEMS[1]?.constraints },
        ],
        desiredPlacements: DESIRED,
        mechanics: vanillaMechanics.adapter,
        ResizeObserver: FakeResizeObserver,
      });
      expect(session.getState().resolved.placements.chart?.x).toBe(reactChartX);
      expect(`${session.getState().resolved.placements.table?.x}px`).toBe(reactTableLeft);
      session.dispose();
    } finally {
      container.remove();
    }
  });

  it('throws when hooks are used without a provider', () => {
    function Bare() {
      useDnDGem();
      return null;
    }
    expect(() => render(<Bare />)).toThrow('useDnDGem must be used within a DnDGemProvider');
  });
});
