import { defineComponent, h, watch } from 'vue';
import { DnDGemProvider, useDnDGem, useDnDGemContainer, useDnDGemItem } from '@dndgem/vue';

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

interface VueProbe {
  phase?: string;
  validity?: string;
  lastDropAccepted?: boolean;
  spaceWidth?: number;
  cancelCount?: number;
  proposalUnplaced?: number;
}

const Board = defineComponent({
  name: 'Board',
  setup() {
    const containerRef = useDnDGemContainer();
    const { state } = useDnDGem();
    const revenue = useDnDGemItem('revenue');
    const expenses = useDnDGemItem('expenses');
    const cashflow = useDnDGemItem('cashflow');
    const transactions = useDnDGemItem('transactions');
    const alerts = useDnDGemItem('alerts');
    const notes = useDnDGemItem('notes');
    const bindings = { revenue, expenses, cashflow, transactions, alerts, notes } as const;

    watch(
      state,
      (next) => {
        const probe: VueProbe = ((window as unknown as { __DNDGEM_VUE?: VueProbe }).__DNDGEM_VUE ??=
          {});
        probe.phase = next?.phase;
        probe.validity = next?.solver.evaluation.state;
        probe.lastDropAccepted = next?.lastDrop?.accepted;
        probe.spaceWidth = next?.resolved.space.width;
        probe.proposalUnplaced = next?.autoLayout?.proposalUnplacedItemIds.length;
        if (
          next?.phase === 'idle' &&
          next.lastDrop === undefined &&
          probe.cancelCount === undefined
        ) {
          probe.cancelCount = 0;
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
        h('h1', 'DnDGem Vue Example'),
        h('p', [
          'Opt-in Auto-Layout (',
          h('code', 'autoLayout'),
          '): one explicit Source Intent card; DnDGem places the rest. Resize to see adaptive retention; drag an automatic card to promote it to Source Intent. This package is implemented in the repository and is ',
          h('strong', 'not yet published on npm'),
          '.',
        ]),
        h('p', { 'data-testid': 'status' }, status),
        h(
          'div',
          {
            ref: containerRef,
            class: 'board',
            'data-testid': 'board',
          },
          ITEMS.map((item) => {
            const binding = bindings[item.id];
            const copy = COPY[item.id];
            if (copy === undefined) {
              return null;
            }
            return h(
              'article',
              {
                key: item.id,
                ref: binding.ref,
                style: binding.style.value,
                class: copy.className,
                'data-testid': `item-${item.id}`,
                'aria-label': copy.title,
                tabindex: 0,
              },
              [h('h2', copy.title), h('p', copy.body)],
            );
          }),
        ),
      ]);
    };
  },
});

export const ExampleApp = defineComponent({
  name: 'ExampleApp',
  setup() {
    return () =>
      h(
        DnDGemProvider,
        {
          items: ITEMS,
          desiredPlacements: DESIRED,
          autoLayout: true,
          onCancel: () => {
            const probe: VueProbe = ((
              window as unknown as { __DNDGEM_VUE?: VueProbe }
            ).__DNDGEM_VUE ??= {});
            probe.cancelCount = (probe.cancelCount ?? 0) + 1;
          },
        },
        { default: () => h(Board) },
      );
  },
});
