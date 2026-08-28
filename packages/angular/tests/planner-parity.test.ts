import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as dom from '@dndgem/dom';
import {
  DNDGEM_BOARD_IMPORTS,
  type DnDGemItemConfig,
  type LayoutSessionPlanner,
} from '../dist/index.js';
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

@Component({
  standalone: true,
  imports: [...DNDGEM_BOARD_IMPORTS],
  template: `
    <div
      dndgemBoard
      dndgemContainer
      data-box="0,0,400,200"
      data-testid="board"
      #board="dndgemBoard"
      [dndgemItems]="items()"
      [dndgemDesiredPlacements]="desiredPlacements()"
      [dndgemPlanner]="planner"
      [dndgemResizeObserver]="observer"
    >
      <article dndgemItem="chart" data-box="8,8,120,60" data-testid="item-chart">chart</article>
      <div data-testid="ready">{{ board.ready() ? 'yes' : 'no' }}</div>
    </div>
  `,
})
class PlannerHost {
  readonly items = signal(ITEMS);
  readonly desiredPlacements = signal(DESIRED);
  readonly observer = FakeResizeObserver;
  planner: LayoutSessionPlanner = () => ({ automaticItemOrder: ['chart'] });
}

afterEach(() => {
  resetFakeResizeObservers();
  vi.restoreAllMocks();
});

async function mountPlannerHost(): Promise<ComponentFixture<PlannerHost>> {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [PlannerHost],
    providers: [provideZonelessChangeDetection()],
  }).compileComponents();
  const fixture = TestBed.createComponent(PlannerHost);
  fixture.detectChanges();
  await Promise.resolve();
  fixture.detectChanges();
  await new Promise<void>((resolve) => {
    queueMicrotask(resolve);
  });
  fixture.detectChanges();
  return fixture;
}

describe('@dndgem/angular planner parity (DND-4.3)', () => {
  it('does not depend on @dndgem/intelligence', () => {
    const deps = {
      ...pkg.dependencies,
      ...pkg.peerDependencies,
      ...pkg.devDependencies,
    };
    expect(deps['@dndgem/intelligence']).toBeUndefined();
  });

  it('forwards planner into createLayoutSession and exposes replan', async () => {
    const { DnDGemBoard } = await import('../dist/index.js');
    expect(typeof DnDGemBoard.prototype.replan).toBe('function');

    const createSpy = vi.spyOn(dom, 'createLayoutSession');
    const fixture = await mountPlannerHost();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-testid="ready"]')?.textContent).toBe('yes');
    expect(createSpy).toHaveBeenCalled();
    const options = createSpy.mock.calls.at(-1)?.[0] as {
      planner?: LayoutSessionPlanner;
      onPlannerEvent?: (event: unknown) => void;
    };
    expect(typeof options.planner).toBe('function');
    expect(typeof options.onPlannerEvent).toBe('function');
  });
});
