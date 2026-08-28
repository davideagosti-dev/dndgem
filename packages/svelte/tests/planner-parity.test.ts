import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import * as dom from '@dndgem/dom';
import type { DnDGemItemConfig, LayoutSessionPlanner } from '../src/index.js';
import PlannerHarness from './fixtures/PlannerHarness.svelte';
import { FakeResizeObserver, resetFakeResizeObservers } from './helpers.js';

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

const mounts: Array<{ app: ReturnType<typeof mount>; host: HTMLElement }> = [];

afterEach(() => {
  for (const mounted of mounts.splice(0)) {
    unmount(mounted.app);
    mounted.host.remove();
  }
  resetFakeResizeObservers();
  vi.restoreAllMocks();
});

async function flush(): Promise<void> {
  flushSync();
  await tick();
  await new Promise<void>((resolve) => {
    queueMicrotask(resolve);
  });
  flushSync();
  await tick();
}

describe('@dndgem/svelte planner parity (DND-4.3)', () => {
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

    const host = document.createElement('div');
    document.body.append(host);
    const app = mount(PlannerHarness, {
      target: host,
      props: {
        items: ITEMS,
        desiredPlacements: DESIRED,
        planner,
        ResizeObserver: FakeResizeObserver,
      },
    });
    mounts.push({ app, host });
    await flush();

    expect(host.querySelector('[data-testid="ready"]')?.textContent).toBe('yes');
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
