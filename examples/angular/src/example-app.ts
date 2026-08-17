import { Component } from '@angular/core';
import { DNDGEM_BOARD_IMPORTS, type DnDGemItemConfig } from '@dndgem/angular';

/**
 * Representative dashboard board: heterogeneous content needs.
 * Shrink the board to observe VALID → DEGRADED when minUseful* is missed.
 */
const ITEMS: readonly DnDGemItemConfig[] = [
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
];

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

interface AngularProbe {
  phase?: string;
  validity?: string;
  lastDropAccepted?: boolean;
  spaceWidth?: number;
  cancelCount?: number;
  proposalUnplaced?: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [...DNDGEM_BOARD_IMPORTS],
  template: `
    <main>
      <h1>DnDGem Angular Example</h1>
      <p>
        Opt-in Auto-Layout (<code>autoLayout</code>): one explicit Source Intent card; DnDGem places
        the rest. Resize to see adaptive retention; drag an automatic card to promote it to Source
        Intent. This package is implemented in the repository and is
        <strong>not yet published on npm</strong>.
      </p>
      <p data-testid="status">{{ status }}</p>
      <div
        class="board"
        dndgemBoard
        dndgemContainer
        data-testid="board"
        #board="dndgemBoard"
        [dndgemItems]="items"
        [dndgemDesiredPlacements]="desired"
        [dndgemAutoLayout]="true"
        (dndgemChange)="onChange($event)"
        (dndgemCancel)="onCancel()"
      >
        @for (item of items; track item.id) {
          <article
            [dndgemItem]="item.id"
            [attr.data-testid]="'item-' + item.id"
            [attr.aria-label]="copy[item.id]?.title"
            [class]="copy[item.id]?.className"
            tabindex="0"
          >
            <h2>{{ copy[item.id]?.title }}</h2>
            <p>{{ copy[item.id]?.body }}</p>
          </article>
        }
      </div>
    </main>
  `,
})
export class ExampleApp {
  readonly items = ITEMS;
  readonly desired = DESIRED;
  readonly copy = COPY;
  status = 'starting';

  onChange(state: import('@dndgem/angular').LayoutSessionState): void {
    const probe: AngularProbe = ((
      window as unknown as { __DNDGEM_ANGULAR?: AngularProbe }
    ).__DNDGEM_ANGULAR ??= {});
    probe.phase = state.phase;
    probe.validity = state.solver.evaluation.state;
    probe.lastDropAccepted = state.lastDrop?.accepted;
    probe.spaceWidth = state.resolved.space.width;
    probe.proposalUnplaced = state.autoLayout?.proposalUnplacedItemIds.length;
    if (state.phase === 'idle' && state.lastDrop === undefined && probe.cancelCount === undefined) {
      probe.cancelCount = 0;
    }
    this.status = `${state.solver.evaluation.state} · ${state.phase}${
      state.autoLayout
        ? ` · auto proposal unresolved: ${state.autoLayout.proposalUnplacedItemIds.length}`
        : ''
    }`;
  }

  onCancel(): void {
    const probe: AngularProbe = ((
      window as unknown as { __DNDGEM_ANGULAR?: AngularProbe }
    ).__DNDGEM_ANGULAR ??= {});
    probe.cancelCount = (probe.cancelCount ?? 0) + 1;
  }
}
