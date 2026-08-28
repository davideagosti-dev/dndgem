import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';
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

const mounts: Array<{ app: ReturnType<typeof createApp>; host: HTMLElement }> = [];

afterEach(() => {
  for (const mounted of mounts.splice(0)) {
    mounted.app.unmount();
    mounted.host.remove();
  }
  resetFakeResizeObservers();
  vi.restoreAllMocks();
});

async function flush(): Promise<void> {
  await nextTick();
  await new Promise<void>((resolve) => {
    queueMicrotask(resolve);
  });
  await nextTick();
}

describe('@dndgem/vue planner parity (DND-4.3)', () => {
  it('does not depend on @dndgem/intelligence', () => {
    const deps = {
      ...pkg.dependencies,
      ...pkg.peerDependencies,
      ...pkg.devDependencies,
    };
    expect(deps['@dndgem/intelligence']).toBeUndefined();
  });

  it('forwards planner into createLayoutSession and exposes replan', async () => {
    const createSpy = vi.spyOn(dom, 'createLayoutSession');
    const planner: LayoutSessionPlanner = () => ({ automaticItemOrder: ['chart'] });

    const Board = defineComponent({
      setup() {
        const containerRef = useDnDGemContainer();
        const chart = useDnDGemItem('chart');
        const { replan } = useDnDGem();
        return () =>
          h('div', [
            h(
              'div',
              {
                'data-testid': 'board',
                ref: (node: unknown) => {
                  if (node instanceof HTMLElement) {
                    stubRect(node, { left: 0, top: 0, width: 400, height: 200 });
                  }
                  containerRef(node);
                },
              },
              [
                h(
                  'article',
                  {
                    'data-testid': 'item-chart',
                    ref: (node: unknown) => {
                      if (node instanceof HTMLElement) {
                        stubRect(node, { left: 8, top: 8, width: 120, height: 60 });
                      }
                      chart.ref(node);
                    },
                    style: chart.style.value,
                  },
                  'chart',
                ),
              ],
            ),
            h('div', { 'data-testid': 'replan-type' }, typeof replan),
          ]);
      },
    });

    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp({
      setup() {
        return () =>
          h(
            DnDGemProvider,
            {
              items: ITEMS,
              desiredPlacements: DESIRED,
              planner,
              ResizeObserver: FakeResizeObserver,
            },
            { default: () => h(Board) },
          );
      },
    });
    app.mount(host);
    mounts.push({ app, host });
    await flush();

    expect(host.querySelector('[data-testid="replan-type"]')?.textContent).toBe('function');
    expect(createSpy).toHaveBeenCalled();
    const options = createSpy.mock.calls.at(-1)?.[0] as {
      planner?: LayoutSessionPlanner;
      onPlannerEvent?: (event: unknown) => void;
    };
    expect(typeof options.planner).toBe('function');
    expect(typeof options.onPlannerEvent).toBe('function');
  });
});
