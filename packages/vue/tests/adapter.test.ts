import { afterEach, describe, expect, it } from 'vitest';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';
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
  type FakeDragController,
} from './helpers.js';

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

const mounts: Array<{ app: ReturnType<typeof createApp>; host: HTMLElement }> = [];

afterEach(() => {
  for (const mounted of mounts.splice(0)) {
    mounted.app.unmount();
    mounted.host.remove();
  }
  resetFakeResizeObservers();
});

async function flush(): Promise<void> {
  await nextTick();
  await new Promise<void>((resolve) => {
    queueMicrotask(resolve);
  });
  await nextTick();
}

function text(host: HTMLElement, testId: string): string {
  return host.querySelector(`[data-testid="${testId}"]`)?.textContent ?? '';
}

function el(host: HTMLElement, testId: string): HTMLElement {
  const node = host.querySelector(`[data-testid="${testId}"]`);
  if (!(node instanceof HTMLElement)) {
    throw new Error(`missing ${testId}`);
  }
  return node;
}

function bindRect(
  node: unknown,
  box: { left: number; top: number; width: number; height: number },
  register: (element: unknown) => void,
): void {
  if (node instanceof HTMLElement) {
    stubRect(node, box);
  }
  register(node);
}

const Board = defineComponent({
  name: 'Board',
  setup() {
    const containerRef = useDnDGemContainer();
    const chart = useDnDGemItem('chart');
    const table = useDnDGemItem('table');
    const { state, ready } = useDnDGem();
    const setContainer = (node: unknown): void => {
      bindRect(node, { left: 0, top: 0, width: 400, height: 200 }, containerRef);
    };
    const setChart = (node: unknown): void => {
      bindRect(node, { left: 8, top: 8, width: 120, height: 60 }, chart.ref);
    };
    const setTable = (node: unknown): void => {
      bindRect(node, { left: 140, top: 8, width: 80, height: 60 }, table.ref);
    };
    return () =>
      h('div', [
        h(
          'div',
          {
            'data-testid': 'board',
            ref: setContainer,
          },
          [
            h(
              'article',
              {
                'data-testid': 'item-chart',
                ref: setChart,
                style: chart.style.value,
              },
              'chart',
            ),
            h(
              'article',
              {
                'data-testid': 'item-table',
                ref: setTable,
                style: table.style.value,
              },
              'table',
            ),
          ],
        ),
        h('div', { 'data-testid': 'ready' }, ready.value ? 'yes' : 'no'),
        h('div', { 'data-testid': 'phase' }, state.value?.phase ?? 'none'),
        h(
          'div',
          { 'data-testid': 'chart-x' },
          String(state.value?.resolved.placements.chart?.x ?? ''),
        ),
        h('div', { 'data-testid': 'validity' }, state.value?.solver.evaluation.state ?? ''),
        h(
          'div',
          { 'data-testid': 'auto-layout' },
          state.value?.autoLayout
            ? JSON.stringify({
                enabled: state.value.autoLayout.enabled,
                proposalUnplacedItemIds: state.value.autoLayout.proposalUnplacedItemIds,
              })
            : '',
        ),
        h(
          'div',
          { 'data-testid': 'resolved-json' },
          state.value
            ? JSON.stringify({
                space: state.value.resolved.space,
                placements: state.value.resolved.placements,
              })
            : '',
        ),
        h(
          'div',
          { 'data-testid': 'source-table' },
          state.value?.intent.desiredPlacements?.table ? 'yes' : 'no',
        ),
        h(
          'div',
          { 'data-testid': 'drop-accepted' },
          state.value?.lastDrop === undefined ? '' : String(state.value.lastDrop.accepted),
        ),
      ]);
  },
});

interface HarnessOptions {
  items?: readonly DnDGemItemConfig[];
  desiredPlacements?:
    | typeof DESIRED
    | Record<string, { x: number; y: number; width: number; height: number }>
    | undefined;
  autoLayout?: boolean;
  mechanics?: FakeDragController;
  onChange?: (state: import('@dndgem/dom').LayoutSessionState) => void;
  onDrop?: (event: { readonly result: import('@dndgem/dom').DragDropResult }) => void;
  onCancel?: (event: import('@dndgem/dom').DragCancelEvent) => void;
}

async function mountHarness(options: HarnessOptions = {}): Promise<HTMLElement> {
  const host = document.createElement('div');
  document.body.append(host);
  const app = createApp({
    setup() {
      return () =>
        h(
          DnDGemProvider,
          {
            items: options.items ?? ITEMS,
            desiredPlacements: 'desiredPlacements' in options ? options.desiredPlacements : DESIRED,
            autoLayout: options.autoLayout === true,
            mechanics: options.mechanics?.adapter,
            ResizeObserver: FakeResizeObserver,
            onChange: options.onChange,
            onDrop: options.onDrop,
            onCancel: options.onCancel,
          },
          { default: () => h(Board) },
        );
    },
  });
  app.mount(host);
  mounts.push({ app, host });
  await flush();
  return host;
}

describe('@dndgem/vue integration', () => {
  it('throws when composables are used without a provider', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp({
      setup() {
        useDnDGem();
        return () => null;
      },
    });
    expect(() => app.mount(host)).toThrow('useDnDGem must be used within a DnDGemProvider');
    host.remove();
  });

  it('throws when container binding is used without a provider', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp({
      setup() {
        useDnDGemContainer();
        return () => null;
      },
    });
    expect(() => app.mount(host)).toThrow(
      'useDnDGemContainer must be used within a DnDGemProvider',
    );
    host.remove();
  });

  it('throws when item binding is used without a provider', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp({
      setup() {
        useDnDGemItem('chart');
        return () => null;
      },
    });
    expect(() => app.mount(host)).toThrow('useDnDGemItem must be used within a DnDGemProvider');
    host.remove();
  });

  it('waits for container and all declared items before creating a session', async () => {
    const mechanics = createFakeDragMechanics();
    const showTable = ref(false);
    const PartialBoard = defineComponent({
      setup() {
        const containerRef = useDnDGemContainer();
        const chart = useDnDGemItem('chart');
        const table = useDnDGemItem('table');
        const { ready } = useDnDGem();
        const setContainer = (node: unknown): void => {
          bindRect(node, { left: 0, top: 0, width: 400, height: 200 }, containerRef);
        };
        const setChart = (node: unknown): void => {
          bindRect(node, { left: 8, top: 8, width: 120, height: 60 }, chart.ref);
        };
        const setTable = (node: unknown): void => {
          bindRect(node, { left: 140, top: 8, width: 80, height: 60 }, table.ref);
        };
        return () =>
          h('div', [
            h(
              'div',
              {
                'data-testid': 'board',
                ref: setContainer,
              },
              [
                h(
                  'article',
                  {
                    'data-testid': 'item-chart',
                    ref: setChart,
                    style: chart.style.value,
                  },
                  'chart',
                ),
                showTable.value
                  ? h(
                      'article',
                      {
                        'data-testid': 'item-table',
                        ref: setTable,
                        style: table.style.value,
                      },
                      'table',
                    )
                  : null,
              ],
            ),
            h('div', { 'data-testid': 'ready' }, ready.value ? 'yes' : 'no'),
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
              mechanics: mechanics.adapter,
              ResizeObserver: FakeResizeObserver,
            },
            { default: () => h(PartialBoard) },
          );
      },
    });
    app.mount(host);
    mounts.push({ app, host });
    await flush();
    expect(mechanics.isConnected()).toBe(false);
    expect(text(host, 'ready')).toBe('no');
    showTable.value = true;
    await flush();
    expect(mechanics.isConnected()).toBe(true);
    expect(text(host, 'ready')).toBe('yes');
    expect(mechanics.connectCount()).toBe(1);
  });

  it('registers items and renders resolved geometry on the matching element', async () => {
    const mechanics = createFakeDragMechanics();
    const host = await mountHarness({ mechanics });
    expect(text(host, 'ready')).toBe('yes');
    expect(el(host, 'item-chart').style.left).toBe('8px');
    expect(el(host, 'item-chart').style.width).toBe('120px');
    expect(el(host, 'item-table').style.left).toBe('140px');
    expect(el(host, 'item-table').style.width).toBe('80px');
    expect(el(host, 'item-chart').style.left).not.toBe(el(host, 'item-table').style.left);
    expect(text(host, 'chart-x')).toBe('8');
    expect(mechanics.connectCount()).toBe(1);
  });

  it('keeps Auto-Layout off by default', async () => {
    const host = await mountHarness({ mechanics: createFakeDragMechanics() });
    expect(text(host, 'auto-layout')).toBe('');
    expect(text(host, 'validity')).toMatch(/VALID|DEGRADED|INVALID/);
  });

  it('supports multiple independent boards', async () => {
    const first = createFakeDragMechanics();
    const second = createFakeDragMechanics();
    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp({
      setup() {
        return () =>
          h('div', [
            h(
              DnDGemProvider,
              {
                items: ITEMS,
                desiredPlacements: DESIRED,
                mechanics: first.adapter,
                ResizeObserver: FakeResizeObserver,
              },
              { default: () => h(Board) },
            ),
            h(
              DnDGemProvider,
              {
                items: ITEMS,
                desiredPlacements: DESIRED,
                mechanics: second.adapter,
                ResizeObserver: FakeResizeObserver,
              },
              { default: () => h(Board) },
            ),
          ]);
      },
    });
    app.mount(host);
    mounts.push({ app, host });
    await flush();
    expect(first.isConnected()).toBe(true);
    expect(second.isConnected()).toBe(true);
    expect(first.connectCount()).toBe(1);
    expect(second.connectCount()).toBe(1);
    expect(host.querySelectorAll('[data-testid="ready"]').length).toBe(2);
  });

  it('exposes drag proposal state and commits an accepted drop', async () => {
    const mechanics = createFakeDragMechanics();
    const host = await mountHarness({ mechanics });
    mechanics.start('chart');
    mechanics.move('chart', { x: 20, y: 10 });
    await flush();
    expect(text(host, 'phase')).toBe('dragging');
    mechanics.drop('chart', { x: 20, y: 10 });
    await flush();
    expect(text(host, 'phase')).toBe('idle');
    expect(text(host, 'chart-x')).toBe('28');
    expect(el(host, 'item-chart').style.left).toBe('28px');
    expect(el(host, 'item-table').style.left).toBe('140px');
    expect(text(host, 'drop-accepted')).toBe('true');
  });

  it('restores committed layout on cancel', async () => {
    const mechanics = createFakeDragMechanics();
    const host = await mountHarness({ mechanics });
    mechanics.start('chart');
    mechanics.move('chart', { x: 30, y: 0 });
    await flush();
    expect(text(host, 'phase')).toBe('dragging');
    mechanics.cancel('chart');
    await flush();
    expect(text(host, 'phase')).toBe('idle');
    expect(text(host, 'chart-x')).toBe('8');
    expect(el(host, 'item-chart').style.left).toBe('8px');
  });

  it('preserves layout when a drop is rejected', async () => {
    const mechanics = createFakeDragMechanics();
    const host = await mountHarness({
      mechanics,
      items: [
        { id: 'chart', constraints: { minWidth: 300, minHeight: 160 } },
        { id: 'table', constraints: { minWidth: 300, minHeight: 160 } },
      ],
    });
    const before = text(host, 'chart-x');
    mechanics.start('chart');
    mechanics.drop('chart', { x: 5, y: 5 });
    await flush();
    expect(text(host, 'chart-x')).toBe(before);
  });

  it('disposes the session on unmount', async () => {
    const mechanics = createFakeDragMechanics();
    const host = await mountHarness({ mechanics });
    expect(mechanics.isConnected()).toBe(true);
    const mounted = mounts.pop();
    mounted?.app.unmount();
    mounted?.host.remove();
    expect(mechanics.isConnected()).toBe(false);
  });

  it('creates exactly one new session after remount', async () => {
    const mechanics = createFakeDragMechanics();
    const host = await mountHarness({ mechanics });
    expect(mechanics.connectCount()).toBe(1);
    const mounted = mounts.pop();
    mounted?.app.unmount();
    mounted?.host.remove();
    expect(mechanics.isConnected()).toBe(false);
    await mountHarness({ mechanics });
    expect(mechanics.isConnected()).toBe(true);
    expect(mechanics.connectCount()).toBe(2);
    expect(FakeResizeObserver.instances.filter((instance) => !instance.disconnected)).toHaveLength(
      1,
    );
  });

  it('does not keep duplicate observers or sessions after mount', async () => {
    const mechanics = createFakeDragMechanics();
    await mountHarness({ mechanics });
    expect(mechanics.isConnected()).toBe(true);
    expect(mechanics.connectCount()).toBe(1);
    expect(FakeResizeObserver.instances.filter((instance) => !instance.disconnected)).toHaveLength(
      1,
    );
  });

  it('does not recreate the session on ordinary reactive renders', async () => {
    const mechanics = createFakeDragMechanics();
    const ticks = ref(0);
    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp({
      setup() {
        return () =>
          h('div', [
            h('button', {
              'data-testid': 'tick',
              onClick: () => {
                ticks.value += 1;
              },
            }),
            h('div', { 'data-testid': 'ticks' }, String(ticks.value)),
            h(
              DnDGemProvider,
              {
                items: ITEMS,
                desiredPlacements: DESIRED,
                mechanics: mechanics.adapter,
                ResizeObserver: FakeResizeObserver,
              },
              { default: () => h(Board) },
            ),
          ]);
      },
    });
    app.mount(host);
    mounts.push({ app, host });
    await flush();
    const connects = mechanics.connectCount();
    el(host, 'tick').click();
    await flush();
    el(host, 'tick').click();
    await flush();
    expect(text(host, 'ticks')).toBe('2');
    expect(mechanics.connectCount()).toBe(connects);
  });

  it('recreates the session when item configuration changes', async () => {
    const mechanics = createFakeDragMechanics();
    const items = ref<readonly DnDGemItemConfig[]>(ITEMS);
    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp({
      setup() {
        return () =>
          h(
            DnDGemProvider,
            {
              items: items.value,
              desiredPlacements: DESIRED,
              mechanics: mechanics.adapter,
              ResizeObserver: FakeResizeObserver,
            },
            { default: () => h(Board) },
          );
      },
    });
    app.mount(host);
    mounts.push({ app, host });
    await flush();
    const connects = mechanics.connectCount();
    items.value = [
      {
        id: 'chart',
        constraints: { minWidth: 40, minHeight: 20, preferredWidth: 200, preferredHeight: 80 },
      },
      {
        id: 'table',
        constraints: { minWidth: 40, minHeight: 20, preferredWidth: 80, preferredHeight: 60 },
      },
    ];
    await flush();
    expect(mechanics.connectCount()).toBeGreaterThan(connects);
    expect(text(host, 'ready')).toBe('yes');
    expect(text(host, 'validity')).toMatch(/VALID|DEGRADED|INVALID/);
  });

  it('respects an explicit desiredPlacements update without previous stability', async () => {
    const mechanics = createFakeDragMechanics();
    const desired = ref(DESIRED);
    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp({
      setup() {
        return () =>
          h(
            DnDGemProvider,
            {
              items: ITEMS,
              desiredPlacements: desired.value,
              mechanics: mechanics.adapter,
              ResizeObserver: FakeResizeObserver,
            },
            { default: () => h(Board) },
          );
      },
    });
    app.mount(host);
    mounts.push({ app, host });
    await flush();
    desired.value = {
      chart: { x: 40, y: 8, width: 120, height: 60 },
      table: { x: 172, y: 8, width: 80, height: 60 },
    };
    await flush();
    expect(text(host, 'chart-x')).toBe('40');
    expect(el(host, 'item-chart').style.left).toBe('40px');
  });

  it('recreates the session when autoLayout enablement changes', async () => {
    const mechanics = createFakeDragMechanics();
    const autoLayout = ref(false);
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
              autoLayout: autoLayout.value,
              mechanics: mechanics.adapter,
              ResizeObserver: FakeResizeObserver,
            },
            { default: () => h(Board) },
          );
      },
    });
    app.mount(host);
    mounts.push({ app, host });
    await flush();
    const connects = mechanics.connectCount();
    expect(text(host, 'auto-layout')).toBe('');
    autoLayout.value = true;
    await flush();
    expect(mechanics.connectCount()).toBeGreaterThan(connects);
    expect(text(host, 'auto-layout')).toContain('"enabled":true');
  });

  it('invokes the latest onDrop without rebuilding the session', async () => {
    const mechanics = createFakeDragMechanics();
    const tags: string[] = [];
    const tag = ref('A');
    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp({
      setup() {
        return () =>
          h('div', [
            h('button', {
              'data-testid': 'flip-callback',
              onClick: () => {
                tag.value = 'B';
              },
            }),
            h(
              DnDGemProvider,
              {
                items: ITEMS,
                desiredPlacements: DESIRED,
                mechanics: mechanics.adapter,
                ResizeObserver: FakeResizeObserver,
                onDrop: () => {
                  tags.push(tag.value);
                },
              },
              { default: () => h(Board) },
            ),
          ]);
      },
    });
    app.mount(host);
    mounts.push({ app, host });
    await flush();
    const connectsAfterMount = mechanics.connectCount();
    expect(connectsAfterMount).toBeGreaterThan(0);
    el(host, 'flip-callback').click();
    await flush();
    expect(mechanics.connectCount()).toBe(connectsAfterMount);
    mechanics.start('chart');
    mechanics.drop('chart', { x: 20, y: 10 });
    await flush();
    expect(tags).toEqual(['B']);
    expect(mechanics.connectCount()).toBe(connectsAfterMount);
  });

  it('matches createLayoutSession ResolvedLayout for the same normalized inputs', async () => {
    const mechanics = createFakeDragMechanics();
    const host = await mountHarness({ mechanics });
    const vueResolved = JSON.parse(text(host, 'resolved-json') || '{}') as {
      space: { width: number; height: number };
      placements: Record<string, { x: number; y: number; width: number; height: number }>;
    };

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
      const vanilla = session.getState().resolved;
      expect(vanilla.space).toEqual(vueResolved.space);
      expect(vanilla.placements).toEqual(vueResolved.placements);
      session.dispose();
    } finally {
      container.remove();
    }
  });

  it('preserves consumer aria attributes and tabIndex across resolve and cancel', async () => {
    const mechanics = createFakeDragMechanics();
    const AccessibleBoard = defineComponent({
      setup() {
        const containerRef = useDnDGemContainer();
        const chart = useDnDGemItem('chart');
        const table = useDnDGemItem('table');
        const setContainer = (node: unknown): void => {
          bindRect(node, { left: 0, top: 0, width: 400, height: 200 }, containerRef);
        };
        const setChart = (node: unknown): void => {
          bindRect(node, { left: 8, top: 8, width: 120, height: 60 }, chart.ref);
        };
        const setTable = (node: unknown): void => {
          bindRect(node, { left: 140, top: 8, width: 80, height: 60 }, table.ref);
        };
        return () =>
          h(
            'div',
            {
              'data-testid': 'board',
              ref: setContainer,
            },
            [
              h(
                'article',
                {
                  'data-testid': 'item-chart',
                  'aria-label': 'Chart card',
                  tabindex: 0,
                  ref: setChart,
                  style: chart.style.value,
                },
                [h('button', { type: 'button', 'data-testid': 'chart-action' }, 'Open')],
              ),
              h(
                'article',
                {
                  'data-testid': 'item-table',
                  ref: setTable,
                  style: table.style.value,
                },
                'table',
              ),
            ],
          );
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
              mechanics: mechanics.adapter,
              ResizeObserver: FakeResizeObserver,
            },
            { default: () => h(AccessibleBoard) },
          );
      },
    });
    app.mount(host);
    mounts.push({ app, host });
    await flush();
    const chart = el(host, 'item-chart');
    expect(chart.getAttribute('aria-label')).toBe('Chart card');
    expect(chart.tabIndex).toBe(0);
    expect(host.querySelector('[data-testid="chart-action"]')).toBeTruthy();
    mechanics.start('chart');
    mechanics.move('chart', { x: 20, y: 10 });
    mechanics.cancel('chart');
    await flush();
    expect(el(host, 'item-chart').getAttribute('aria-label')).toBe('Chart card');
    expect(el(host, 'item-chart').tabIndex).toBe(0);
    expect(host.querySelector('[data-testid="chart-action"]')).toBeTruthy();
    expect(el(host, 'item-chart').style.left).toBe('8px');
  });

  it('opts into Auto-Layout and places items without complete desiredPlacements', async () => {
    const mechanics = createFakeDragMechanics();
    const host = await mountHarness({ mechanics, autoLayout: true, desiredPlacements: undefined });
    expect(text(host, 'ready')).toBe('yes');
    expect(text(host, 'auto-layout')).toContain('"enabled":true');
    expect(el(host, 'item-chart').style.left).not.toBe('');
    expect(el(host, 'item-table').style.left).not.toBe('');
  });

  it('matches Vanilla Auto-Layout ResolvedLayout for the same inputs', async () => {
    const mechanics = createFakeDragMechanics();
    const host = await mountHarness({
      mechanics,
      autoLayout: true,
      desiredPlacements: { chart: { x: 8, y: 8, width: 120, height: 60 } },
    });
    const vueResolved = JSON.parse(text(host, 'resolved-json') || '{}') as {
      space: { width: number; height: number };
      placements: Record<string, { x: number; y: number; width: number; height: number }>;
    };
    const vueAuto = JSON.parse(text(host, 'auto-layout') || '{}') as {
      enabled: boolean;
      proposalUnplacedItemIds: string[];
    };

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
        autoLayout: true,
        desiredPlacements: { chart: { x: 8, y: 8, width: 120, height: 60 } },
        mechanics: vanillaMechanics.adapter,
        ResizeObserver: FakeResizeObserver,
      });
      const vanilla = session.getState();
      expect(vanilla.resolved.space).toEqual(vueResolved.space);
      expect(vanilla.resolved.placements).toEqual(vueResolved.placements);
      expect(vanilla.autoLayout?.enabled).toBe(vueAuto.enabled);
      expect(vanilla.autoLayout?.proposalUnplacedItemIds).toEqual(vueAuto.proposalUnplacedItemIds);
      expect(vanilla.solver.evaluation.state).toBe(text(host, 'validity'));
      session.dispose();
    } finally {
      container.remove();
    }
  });

  it('promotes only the dragged Auto-Layout item on accept', async () => {
    const mechanics = createFakeDragMechanics();
    const host = await mountHarness({ mechanics, autoLayout: true, desiredPlacements: undefined });
    mechanics.start('table');
    mechanics.drop('table', { x: 24, y: 8 });
    await flush();
    expect(text(host, 'phase')).toBe('idle');
    expect(el(host, 'item-table').style.left).toBe('164px');
    expect(el(host, 'item-table').style.top).toBe('16px');
    expect(text(host, 'drop-accepted')).toBe('true');
    expect(text(host, 'source-table')).toBe('yes');
  });

  it('reflows from the DOM session ResizeObserver without a Vue observer', async () => {
    const mechanics = createFakeDragMechanics();
    const host = await mountHarness({ mechanics });
    const before = JSON.parse(text(host, 'resolved-json') || '{}') as {
      space: { width: number };
    };
    expect(before.space.width).toBeGreaterThan(0);
    const board = el(host, 'board');
    stubRect(board, { left: 0, top: 0, width: 280, height: 200 });
    const observer = FakeResizeObserver.instances.find((instance) => !instance.disconnected);
    expect(observer).toBeDefined();
    observer?.deliver();
    await flush();
    const after = JSON.parse(text(host, 'resolved-json') || '{}') as {
      space: { width: number };
    };
    expect(after.space.width).toBeLessThan(before.space.width);
    expect(FakeResizeObserver.instances.filter((instance) => !instance.disconnected)).toHaveLength(
      1,
    );
    expect(mechanics.isConnected()).toBe(true);
  });
});
