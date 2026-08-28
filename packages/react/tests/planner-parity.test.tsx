import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import * as dom from '@dndgem/dom';
import {
  DnDGemProvider,
  useDnDGem,
  useDnDGemContainer,
  useDnDGemItem,
  type DnDGemItemConfig,
  type LayoutSessionPlanner,
} from '../src/index.js';
import { FakeResizeObserver, resetFakeResizeObservers, stubRect } from './helpers.js';

const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '../package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const ITEMS: readonly DnDGemItemConfig[] = [
  {
    id: 'chart',
    constraints: { minWidth: 40, minHeight: 20, preferredWidth: 120, preferredHeight: 60 },
  },
];

const DESIRED = {
  chart: { x: 8, y: 8, width: 120, height: 60 },
};

afterEach(() => {
  cleanup();
  resetFakeResizeObservers();
  vi.restoreAllMocks();
});

function Board() {
  const containerRef = useDnDGemContainer();
  const chart = useDnDGemItem('chart');
  const { replan } = useDnDGem();
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
      </div>
      <div data-testid="replan-type">{typeof replan}</div>
    </div>
  );
}

describe('@dndgem/react planner parity (DND-4.3)', () => {
  it('does not depend on @dndgem/intelligence', () => {
    const deps = {
      ...pkg.dependencies,
      ...pkg.peerDependencies,
      ...pkg.devDependencies,
    };
    expect(deps['@dndgem/intelligence']).toBeUndefined();
  });

  it('forwards planner into createLayoutSession and exposes replan', () => {
    const createSpy = vi.spyOn(dom, 'createLayoutSession');
    const planner: LayoutSessionPlanner = () => ({ automaticItemOrder: ['chart'] });

    render(
      <StrictMode>
        <DnDGemProvider
          items={ITEMS}
          desiredPlacements={DESIRED}
          planner={planner}
          ResizeObserver={FakeResizeObserver}
        >
          <Board />
        </DnDGemProvider>
      </StrictMode>,
    );

    expect(screen.getByTestId('replan-type').textContent).toBe('function');
    expect(createSpy).toHaveBeenCalled();
    const options = createSpy.mock.calls.at(-1)?.[0] as {
      planner?: LayoutSessionPlanner;
      onPlannerEvent?: (event: unknown) => void;
    };
    expect(typeof options.planner).toBe('function');
    expect(typeof options.onPlannerEvent).toBe('function');
  });
});
