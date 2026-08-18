import { defineComponent, h, watch } from 'vue';
import { DnDGemProvider, useDnDGem, useDnDGemContainer, useDnDGemItem } from '@dndgem/vue';
import type { LayoutSessionState } from '@dndgem/vue';
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

const Board = defineComponent({
  name: 'Board',
  setup() {
    const containerRef = useDnDGemContainer();
    const { state, ready } = useDnDGem();
    const revenue = useDnDGemItem('revenue');
    const expenses = useDnDGemItem('expenses');

    watch(
      state,
      (next) => {
        if (next !== undefined) {
          syncProbe(next);
        }
      },
      { immediate: true },
    );

    return () => {
      const snapshot = state.value;
      const status = snapshot
        ? `${snapshot.solver.evaluation.state} · ${snapshot.phase}${
            snapshot.autoLayout
              ? ` · auto proposal unresolved: ${snapshot.autoLayout.proposalUnplacedItemIds.length}`
              : ''
          }`
        : 'starting';
      return h('main', [
        h('h1', 'DnDGem Nuxt Compat'),
        h('p', [
          'Nuxt page over ',
          h('code', '@dndgem/vue'),
          '. Session is client-only; no Nuxt plugin.',
        ]),
        h('p', { 'data-testid': 'status' }, ready.value ? status : 'starting'),
        h('div', { ref: containerRef, class: 'board', 'data-testid': 'board' }, [
          h(
            'article',
            {
              ref: revenue.ref,
              style: revenue.style.value,
              class: 'item revenue',
              'data-testid': 'item-revenue',
              'aria-label': 'Revenue',
              tabindex: 0,
            },
            [
              h('h2', 'Revenue'),
              h('p', 'Explicit Source Intent'),
              h('button', { type: 'button', 'data-testid': 'item-revenue-action' }, 'Details'),
            ],
          ),
          h(
            'article',
            {
              ref: expenses.ref,
              style: expenses.style.value,
              class: 'item expenses',
              'data-testid': 'item-expenses',
              'aria-label': 'Expenses',
              tabindex: 0,
            },
            [h('h2', 'Expenses'), h('p', 'Auto-Layout generated')],
          ),
        ]),
      ]);
    };
  },
});

export const CompatBoard = defineComponent({
  name: 'CompatBoard',
  setup() {
    return () =>
      h(
        DnDGemProvider,
        {
          items: ITEMS,
          desiredPlacements: DESIRED,
          autoLayout: true,
          ResizeObserver: CountingResizeObserver,
          onChange: syncProbe,
          onCancel: () => {
            const probe = ensureProbe();
            probe.cancelCount += 1;
          },
        },
        { default: () => h(Board) },
      );
  },
});
