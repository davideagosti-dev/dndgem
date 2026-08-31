import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { createLayoutSession } from '@dndgem/dom';
import {
  DNDGEM_BOARD_IMPORTS,
  DnDGemContainerDirective,
  DnDGemItemDirective,
  injectDnDGem,
  type DnDGemItemConfig,
} from '../dist/index.js';
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

const CONTAINER_BOX = '0,0,400,200';
const CHART_BOX = '8,8,120,60';
const TABLE_BOX = '140,8,80,60';

@Component({
  standalone: true,
  imports: [...DNDGEM_BOARD_IMPORTS],
  template: `
    <div
      dndgemBoard
      dndgemContainer
      data-box="${CONTAINER_BOX}"
      data-testid="board"
      #board="dndgemBoard"
      [dndgemItems]="items()"
      [dndgemDesiredPlacements]="desiredPlacements()"
      [dndgemAutoLayout]="autoLayout()"
      [dndgemMechanics]="mechanics?.adapter"
      [dndgemResizeObserver]="observer"
      (dndgemChange)="onChange?.($event)"
      (dndgemDrop)="onDrop?.($event)"
      (dndgemCancel)="onCancel?.($event)"
    >
      <article dndgemItem="chart" data-box="${CHART_BOX}" data-testid="item-chart">chart</article>
      @if (showTable()) {
        <article dndgemItem="table" data-box="${TABLE_BOX}" data-testid="item-table">table</article>
      }
      <div data-testid="ready">{{ board.ready() ? 'yes' : 'no' }}</div>
      <div data-testid="phase">{{ board.state()?.phase ?? 'none' }}</div>
      <div data-testid="chart-x">{{ board.state()?.resolved.placements.chart?.x ?? '' }}</div>
      <div data-testid="validity">{{ board.state()?.solver.evaluation.state ?? '' }}</div>
      <div data-testid="auto-layout">
        {{
          board.state()?.autoLayout
            ? json({
                enabled: board.state()?.autoLayout?.enabled,
                proposalUnplacedItemIds: board.state()?.autoLayout?.proposalUnplacedItemIds,
              })
            : ''
        }}
      </div>
      <div data-testid="resolved-json">
        {{
          board.state()
            ? json({
                space: board.state()?.resolved.space,
                placements: board.state()?.resolved.placements,
              })
            : ''
        }}
      </div>
      <div data-testid="source-table">
        {{ board.state()?.intent.desiredPlacements?.table ? 'yes' : 'no' }}
      </div>
      <div data-testid="drop-accepted">
        {{ board.state()?.lastDrop === undefined ? '' : board.state()?.lastDrop?.accepted }}
      </div>
    </div>
  `,
})
class BoardHost {
  readonly items = signal<readonly DnDGemItemConfig[]>(ITEMS);
  readonly desiredPlacements = signal<
    | typeof DESIRED
    | Record<string, { x: number; y: number; width: number; height: number }>
    | undefined
  >(DESIRED);
  readonly autoLayout = signal(false);
  mechanics: FakeDragController = createFakeDragMechanics();
  observer: typeof FakeResizeObserver = FakeResizeObserver;
  readonly showTable = signal(true);
  onChange: ((state: import('@dndgem/dom').LayoutSessionState) => void) | undefined;
  onDrop: ((event: { readonly result: import('@dndgem/dom').DragDropResult }) => void) | undefined;
  onCancel: ((event: import('@dndgem/dom').DragCancelEvent) => void) | undefined;

  json(value: unknown): string {
    return JSON.stringify(value);
  }
}

@Component({
  standalone: true,
  imports: [...DNDGEM_BOARD_IMPORTS],
  template: `
    <div>
      <div
        dndgemBoard
        dndgemContainer
        data-box="${CONTAINER_BOX}"
        [dndgemItems]="items"
        [dndgemDesiredPlacements]="desired"
        [dndgemMechanics]="first.adapter"
        [dndgemResizeObserver]="observer"
      >
        <article dndgemItem="chart" data-box="${CHART_BOX}"></article>
        <article dndgemItem="table" data-box="${TABLE_BOX}"></article>
        <div data-testid="ready">ready</div>
      </div>
      <div
        dndgemBoard
        dndgemContainer
        data-box="${CONTAINER_BOX}"
        [dndgemItems]="items"
        [dndgemDesiredPlacements]="desired"
        [dndgemMechanics]="second.adapter"
        [dndgemResizeObserver]="observer"
      >
        <article dndgemItem="chart" data-box="${CHART_BOX}"></article>
        <article dndgemItem="table" data-box="${TABLE_BOX}"></article>
        <div data-testid="ready">ready</div>
      </div>
    </div>
  `,
})
class DualBoardHost {
  items = ITEMS;
  desired = DESIRED;
  first = createFakeDragMechanics();
  second = createFakeDragMechanics();
  observer = FakeResizeObserver;
}

@Component({
  standalone: true,
  imports: [...DNDGEM_BOARD_IMPORTS],
  template: `
    <div
      dndgemBoard
      dndgemContainer
      data-box="${CONTAINER_BOX}"
      [dndgemItems]="items"
      [dndgemDesiredPlacements]="desired"
      [dndgemMechanics]="mechanics.adapter"
      [dndgemResizeObserver]="observer"
    >
      <article
        dndgemItem="chart"
        data-box="${CHART_BOX}"
        data-testid="item-chart"
        aria-label="Chart card"
        tabindex="0"
      >
        <button type="button" data-testid="chart-action">Open</button>
      </article>
      <article dndgemItem="table" data-box="${TABLE_BOX}" data-testid="item-table">table</article>
    </div>
  `,
})
class AccessibleHost {
  items = ITEMS;
  desired = DESIRED;
  mechanics = createFakeDragMechanics();
  observer = FakeResizeObserver;
}

@Component({
  standalone: true,
  imports: [DnDGemItemDirective],
  template: `<div dndgemItem="chart"></div>`,
})
class OrphanItemHost {}

@Component({
  standalone: true,
  imports: [DnDGemContainerDirective],
  template: `<div dndgemContainer></div>`,
})
class OrphanContainerHost {}

@Component({
  standalone: true,
  template: '',
})
class OrphanInjectHost {
  constructor() {
    injectDnDGem();
  }
}

@Component({
  standalone: true,
  imports: [...DNDGEM_BOARD_IMPORTS],
  template: `
    <div>
      <button type="button" data-testid="tick" (click)="ticks += 1">tick</button>
      <div data-testid="ticks">{{ ticks }}</div>
      <div
        dndgemBoard
        dndgemContainer
        data-box="${CONTAINER_BOX}"
        [dndgemItems]="items"
        [dndgemDesiredPlacements]="desired"
        [dndgemMechanics]="mechanics.adapter"
        [dndgemResizeObserver]="observer"
      >
        <article dndgemItem="chart" data-box="${CHART_BOX}"></article>
        <article dndgemItem="table" data-box="${TABLE_BOX}"></article>
      </div>
    </div>
  `,
})
class TickHost {
  items = ITEMS;
  desired = DESIRED;
  mechanics = createFakeDragMechanics();
  observer = FakeResizeObserver;
  ticks = 0;
}

const fixtures: ComponentFixture<unknown>[] = [];

afterEach(() => {
  for (const fixture of fixtures.splice(0)) {
    fixture.destroy();
  }
  TestBed.resetTestingModule();
  resetFakeResizeObservers();
});

async function flush(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges(false);
  await fixture.whenStable();
  await new Promise<void>((resolve) => {
    queueMicrotask(resolve);
  });
  fixture.detectChanges(false);
  await fixture.whenStable();
}

function text(host: HTMLElement, testId: string): string {
  return host.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim() ?? '';
}

function el(host: HTMLElement, testId: string): HTMLElement {
  const node = host.querySelector(`[data-testid="${testId}"]`);
  if (!(node instanceof HTMLElement)) {
    throw new Error(`missing ${testId}`);
  }
  return node;
}

async function mountBoard(init?: (host: BoardHost) => void): Promise<ComponentFixture<BoardHost>> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [BoardHost],
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(BoardHost);
  fixtures.push(fixture);
  init?.(fixture.componentInstance);
  await flush(fixture);
  return fixture;
}

describe('@dndgem/angular integration', () => {
  it('throws when injectDnDGem is used without a board owner', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [OrphanInjectHost],
      providers: [provideZonelessChangeDetection()],
    });
    expect(() => TestBed.createComponent(OrphanInjectHost)).toThrow(
      'injectDnDGem() must be used within a dndgemBoard',
    );
  });

  it('throws when container directive is used without a board owner', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [OrphanContainerHost],
      providers: [provideZonelessChangeDetection()],
    });
    expect(() => TestBed.createComponent(OrphanContainerHost)).toThrow(
      'dndgemContainer must be used within a dndgemBoard',
    );
  });

  it('throws when item directive is used without a board owner', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [OrphanItemHost],
      providers: [provideZonelessChangeDetection()],
    });
    expect(() => TestBed.createComponent(OrphanItemHost)).toThrow(
      'dndgemItem must be used within a dndgemBoard',
    );
  });

  it('waits for container and all declared items before creating a session', async () => {
    const fixture = await mountBoard((host) => {
      host.mechanics = createFakeDragMechanics();
      host.showTable.set(false);
    });
    const host = fixture.componentInstance;
    expect(host.mechanics?.isConnected()).toBe(false);
    expect(text(fixture.nativeElement, 'ready')).toBe('no');
    host.showTable.set(true);
    await flush(fixture);
    expect(host.mechanics?.isConnected()).toBe(true);
    expect(text(fixture.nativeElement, 'ready')).toBe('yes');
    expect(host.mechanics?.connectCount()).toBe(1);
  });

  it('registers items and renders resolved geometry on the matching element', async () => {
    const fixture = await mountBoard((host) => {
      host.mechanics = createFakeDragMechanics();
    });
    const host = fixture.componentInstance;
    expect(text(fixture.nativeElement, 'ready')).toBe('yes');
    expect(el(fixture.nativeElement, 'item-chart').style.left).toBe('8px');
    expect(el(fixture.nativeElement, 'item-chart').style.width).toBe('120px');
    expect(el(fixture.nativeElement, 'item-table').style.left).toBe('140px');
    expect(el(fixture.nativeElement, 'item-table').style.width).toBe('80px');
    expect(el(fixture.nativeElement, 'item-chart').style.left).not.toBe(
      el(fixture.nativeElement, 'item-table').style.left,
    );
    expect(text(fixture.nativeElement, 'chart-x')).toBe('8');
    expect(host.mechanics.connectCount()).toBe(1);
  });

  it('keeps Auto-Layout off by default', async () => {
    const fixture = await mountBoard((host) => {
      host.mechanics = createFakeDragMechanics();
    });
    expect(text(fixture.nativeElement, 'auto-layout')).toBe('');
    expect(text(fixture.nativeElement, 'validity')).toMatch(/VALID|DEGRADED|INVALID/);
  });

  it('supports multiple independent boards', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DualBoardHost],
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(DualBoardHost);
    fixtures.push(fixture);
    await flush(fixture);
    const host = fixture.componentInstance;
    expect(host.first.isConnected()).toBe(true);
    expect(host.second.isConnected()).toBe(true);
    expect(host.first.connectCount()).toBe(1);
    expect(host.second.connectCount()).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('[data-testid="ready"]').length).toBe(2);
  });

  it('exposes drag proposal state and commits an accepted drop', async () => {
    const fixture = await mountBoard((host) => {
      host.mechanics = createFakeDragMechanics();
    });
    const host = fixture.componentInstance;
    host.mechanics.start('chart');
    host.mechanics.move('chart', { x: 20, y: 10 });
    await flush(fixture);
    expect(text(fixture.nativeElement, 'phase')).toBe('dragging');
    host.mechanics.drop('chart', { x: 20, y: 10 });
    await flush(fixture);
    expect(text(fixture.nativeElement, 'phase')).toBe('idle');
    expect(text(fixture.nativeElement, 'chart-x')).toBe('28');
    expect(el(fixture.nativeElement, 'item-chart').style.left).toBe('28px');
    expect(el(fixture.nativeElement, 'item-table').style.left).toBe('140px');
    expect(text(fixture.nativeElement, 'drop-accepted')).toBe('true');
  });

  it('restores committed layout on cancel', async () => {
    const fixture = await mountBoard((host) => {
      host.mechanics = createFakeDragMechanics();
    });
    const host = fixture.componentInstance;
    host.mechanics.start('chart');
    host.mechanics.move('chart', { x: 30, y: 0 });
    await flush(fixture);
    expect(text(fixture.nativeElement, 'phase')).toBe('dragging');
    host.mechanics.cancel('chart');
    await flush(fixture);
    expect(text(fixture.nativeElement, 'phase')).toBe('idle');
    expect(text(fixture.nativeElement, 'chart-x')).toBe('8');
    expect(el(fixture.nativeElement, 'item-chart').style.left).toBe('8px');
  });

  it('preserves layout when a drop is rejected', async () => {
    const fixture = await mountBoard((host) => {
      host.mechanics = createFakeDragMechanics();
      host.items.set([
        { id: 'chart', constraints: { minWidth: 300, minHeight: 160 } },
        { id: 'table', constraints: { minWidth: 300, minHeight: 160 } },
      ]);
    });
    const host = fixture.componentInstance;
    const before = text(fixture.nativeElement, 'chart-x');
    host.mechanics.start('chart');
    host.mechanics.drop('chart', { x: 5, y: 5 });
    await flush(fixture);
    expect(text(fixture.nativeElement, 'chart-x')).toBe(before);
  });

  it('disposes the session on destroy', async () => {
    const fixture = await mountBoard((host) => {
      host.mechanics = createFakeDragMechanics();
    });
    const host = fixture.componentInstance;
    expect(host.mechanics.isConnected()).toBe(true);
    fixture.destroy();
    fixtures.splice(fixtures.indexOf(fixture), 1);
    expect(host.mechanics.isConnected()).toBe(false);
  });

  it('creates exactly one new session after remount', async () => {
    const mechanics = createFakeDragMechanics();
    const fixture = await mountBoard((host) => {
      host.mechanics = mechanics;
    });
    expect(mechanics.connectCount()).toBe(1);
    fixture.destroy();
    fixtures.splice(fixtures.indexOf(fixture), 1);
    expect(mechanics.isConnected()).toBe(false);
    await mountBoard((host) => {
      host.mechanics = mechanics;
    });
    expect(mechanics.isConnected()).toBe(true);
    expect(mechanics.connectCount()).toBe(2);
    expect(FakeResizeObserver.instances.filter((instance) => !instance.disconnected)).toHaveLength(
      1,
    );
  });

  it('does not keep duplicate observers or sessions after mount', async () => {
    const fixture = await mountBoard((host) => {
      host.mechanics = createFakeDragMechanics();
    });
    expect(fixture.componentInstance.mechanics?.isConnected()).toBe(true);
    expect(fixture.componentInstance.mechanics?.connectCount()).toBe(1);
    expect(FakeResizeObserver.instances.filter((instance) => !instance.disconnected)).toHaveLength(
      1,
    );
  });

  it('does not recreate the session on ordinary change detection', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TickHost],
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(TickHost);
    fixtures.push(fixture);
    await flush(fixture);
    const connects = fixture.componentInstance.mechanics.connectCount();
    el(fixture.nativeElement, 'tick').click();
    await flush(fixture);
    el(fixture.nativeElement, 'tick').click();
    await flush(fixture);
    expect(text(fixture.nativeElement, 'ticks')).toBe('2');
    expect(fixture.componentInstance.mechanics.connectCount()).toBe(connects);
  });

  it('recreates the session when item configuration changes', async () => {
    const fixture = await mountBoard((host) => {
      host.mechanics = createFakeDragMechanics();
    });
    const host = fixture.componentInstance;
    const connects = host.mechanics!.connectCount();
    host.items.set([
      {
        id: 'chart',
        constraints: { minWidth: 40, minHeight: 20, preferredWidth: 200, preferredHeight: 80 },
      },
      {
        id: 'table',
        constraints: { minWidth: 40, minHeight: 20, preferredWidth: 80, preferredHeight: 60 },
      },
    ]);
    await flush(fixture);
    expect(host.mechanics!.connectCount()).toBeGreaterThan(connects);
    expect(text(fixture.nativeElement, 'ready')).toBe('yes');
    expect(text(fixture.nativeElement, 'validity')).toMatch(/VALID|DEGRADED|INVALID/);
  });

  it('respects an explicit desiredPlacements update without previous stability', async () => {
    const fixture = await mountBoard((host) => {
      host.mechanics = createFakeDragMechanics();
    });
    const host = fixture.componentInstance;
    host.desiredPlacements.set({
      chart: { x: 40, y: 8, width: 120, height: 60 },
      table: { x: 172, y: 8, width: 80, height: 60 },
    });
    await flush(fixture);
    expect(text(fixture.nativeElement, 'chart-x')).toBe('40');
    expect(el(fixture.nativeElement, 'item-chart').style.left).toBe('40px');
  });

  it('recreates the session when autoLayout enablement changes', async () => {
    const fixture = await mountBoard((host) => {
      host.mechanics = createFakeDragMechanics();
    });
    const host = fixture.componentInstance;
    const connects = host.mechanics!.connectCount();
    expect(text(fixture.nativeElement, 'auto-layout')).toBe('');
    host.autoLayout.set(true);
    await flush(fixture);
    expect(host.mechanics!.connectCount()).toBeGreaterThan(connects);
    expect(text(fixture.nativeElement, 'auto-layout')).toContain('"enabled":true');
  });

  it('invokes the latest onDrop without rebuilding the session', async () => {
    const tags: string[] = [];
    let tag = 'A';
    const fixture = await mountBoard((host) => {
      host.mechanics = createFakeDragMechanics();
      host.onDrop = () => {
        tags.push(tag);
      };
    });
    const host = fixture.componentInstance;
    const connectsAfterMount = host.mechanics!.connectCount();
    expect(connectsAfterMount).toBeGreaterThan(0);
    tag = 'B';
    host.onDrop = () => {
      tags.push(tag);
    };
    await flush(fixture);
    expect(host.mechanics!.connectCount()).toBe(connectsAfterMount);
    host.mechanics!.start('chart');
    host.mechanics!.drop('chart', { x: 20, y: 10 });
    await flush(fixture);
    expect(tags).toEqual(['B']);
    // Accepted drop remasures + reconnects mechanics so the next drag baseline
    // matches applied geometry (DND-BUG-DRAG-INTENT-1). Callback flips must not.
    expect(host.mechanics!.connectCount()).toBe(connectsAfterMount + 1);
  });

  it('matches createLayoutSession ResolvedLayout for the same normalized inputs', async () => {
    const fixture = await mountBoard((host) => {
      host.mechanics = createFakeDragMechanics();
    });
    const angularResolved = JSON.parse(text(fixture.nativeElement, 'resolved-json') || '{}') as {
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
      expect(vanilla.space).toEqual(angularResolved.space);
      expect(vanilla.placements).toEqual(angularResolved.placements);
      session.dispose();
    } finally {
      container.remove();
    }
  });

  it('preserves consumer aria attributes and tabIndex across resolve and cancel', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AccessibleHost],
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(AccessibleHost);
    fixtures.push(fixture);
    await flush(fixture);
    const chart = el(fixture.nativeElement, 'item-chart');
    expect(chart.getAttribute('aria-label')).toBe('Chart card');
    expect(chart.tabIndex).toBe(0);
    expect(fixture.nativeElement.querySelector('[data-testid="chart-action"]')).toBeTruthy();
    fixture.componentInstance.mechanics.start('chart');
    fixture.componentInstance.mechanics.move('chart', { x: 20, y: 10 });
    fixture.componentInstance.mechanics.cancel('chart');
    await flush(fixture);
    expect(el(fixture.nativeElement, 'item-chart').getAttribute('aria-label')).toBe('Chart card');
    expect(el(fixture.nativeElement, 'item-chart').tabIndex).toBe(0);
    expect(fixture.nativeElement.querySelector('[data-testid="chart-action"]')).toBeTruthy();
    expect(el(fixture.nativeElement, 'item-chart').style.left).toBe('8px');
  });

  it('opts into Auto-Layout and places items without complete desiredPlacements', async () => {
    const fixture = await mountBoard((host) => {
      host.mechanics = createFakeDragMechanics();
      host.autoLayout.set(true);
      host.desiredPlacements.set(undefined);
    });
    expect(text(fixture.nativeElement, 'ready')).toBe('yes');
    expect(text(fixture.nativeElement, 'auto-layout')).toContain('"enabled":true');
    expect(el(fixture.nativeElement, 'item-chart').style.left).not.toBe('');
    expect(el(fixture.nativeElement, 'item-table').style.left).not.toBe('');
  });

  it('matches Vanilla Auto-Layout ResolvedLayout for the same inputs', async () => {
    const fixture = await mountBoard((host) => {
      host.mechanics = createFakeDragMechanics();
      host.autoLayout.set(true);
      host.desiredPlacements.set({ chart: { x: 8, y: 8, width: 120, height: 60 } });
    });
    const angularResolved = JSON.parse(text(fixture.nativeElement, 'resolved-json') || '{}') as {
      space: { width: number; height: number };
      placements: Record<string, { x: number; y: number; width: number; height: number }>;
    };
    const angularAuto = JSON.parse(text(fixture.nativeElement, 'auto-layout') || '{}') as {
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
      expect(vanilla.resolved.space).toEqual(angularResolved.space);
      expect(vanilla.resolved.placements).toEqual(angularResolved.placements);
      expect(vanilla.autoLayout?.enabled).toBe(angularAuto.enabled);
      expect(vanilla.autoLayout?.proposalUnplacedItemIds).toEqual(
        angularAuto.proposalUnplacedItemIds,
      );
      expect(vanilla.solver.evaluation.state).toBe(text(fixture.nativeElement, 'validity'));
      session.dispose();
    } finally {
      container.remove();
    }
  });

  it('promotes only the dragged Auto-Layout item on accept', async () => {
    const fixture = await mountBoard((host) => {
      host.mechanics = createFakeDragMechanics();
      host.autoLayout.set(true);
      host.desiredPlacements.set(undefined);
    });
    const host = fixture.componentInstance;
    host.mechanics!.start('table');
    host.mechanics!.drop('table', { x: 24, y: 8 });
    await flush(fixture);
    expect(text(fixture.nativeElement, 'phase')).toBe('idle');
    expect(el(fixture.nativeElement, 'item-table').style.left).toBe('164px');
    expect(el(fixture.nativeElement, 'item-table').style.top).toBe('16px');
    expect(text(fixture.nativeElement, 'drop-accepted')).toBe('true');
    expect(text(fixture.nativeElement, 'source-table')).toBe('yes');
  });

  it('reflows from the DOM session ResizeObserver without an Angular observer', async () => {
    const fixture = await mountBoard((host) => {
      host.mechanics = createFakeDragMechanics();
    });
    const before = JSON.parse(text(fixture.nativeElement, 'resolved-json') || '{}') as {
      space: { width: number };
    };
    expect(before.space.width).toBeGreaterThan(0);
    const board = el(fixture.nativeElement, 'board');
    stubRect(board, { left: 0, top: 0, width: 280, height: 200 });
    const observer = FakeResizeObserver.instances.find((instance) => !instance.disconnected);
    expect(observer).toBeDefined();
    observer?.deliver();
    await flush(fixture);
    const after = JSON.parse(text(fixture.nativeElement, 'resolved-json') || '{}') as {
      space: { width: number };
    };
    expect(after.space.width).toBeLessThan(before.space.width);
    expect(FakeResizeObserver.instances.filter((instance) => !instance.disconnected)).toHaveLength(
      1,
    );
    expect(fixture.componentInstance.mechanics!.isConnected()).toBe(true);
  });

  it('propagates zoneless state updates from drag without NgZone', async () => {
    const fixture = await mountBoard((host) => {
      host.mechanics = createFakeDragMechanics();
    });
    const host = fixture.componentInstance;
    host.mechanics!.start('chart');
    host.mechanics!.move('chart', { x: 16, y: 0 });
    await flush(fixture);
    expect(text(fixture.nativeElement, 'phase')).toBe('dragging');
    host.mechanics!.drop('chart', { x: 16, y: 0 });
    await flush(fixture);
    expect(text(fixture.nativeElement, 'phase')).toBe('idle');
    expect(text(fixture.nativeElement, 'chart-x')).toBe('24');
  });
});

describe('@dndgem/angular cleanup', () => {
  it('does not leak mechanics after destroy', async () => {
    const fixture = await mountBoard((host) => {
      host.mechanics = createFakeDragMechanics();
    });
    const host = fixture.componentInstance;
    expect(host.mechanics!.isConnected()).toBe(true);
    fixture.destroy();
    fixtures.splice(fixtures.indexOf(fixture), 1);
    expect(host.mechanics!.isConnected()).toBe(false);
    expect(FakeResizeObserver.instances.filter((instance) => !instance.disconnected)).toHaveLength(
      0,
    );
  });
});
