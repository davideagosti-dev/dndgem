/**
 * Frozen DND-4.4 experiment corpus (F1–F8).
 * MUST NOT be altered after live inference begins except with transparent invalidation.
 */
import {
  createContentConstraints,
  createLayoutIntent,
  createLayoutItem,
  createResolvedLayout,
  type LayoutIntent,
  type ResolvedLayout,
} from '@dndgem/core';
import type { PlanningSnapshot } from '@dndgem/intelligence';

export const CORPUS_VERSION = '1.0.0' as const;

export type LiveFixtureId = 'F1' | 'F2' | 'F3' | 'F4' | 'F5';
export type RobustnessFixtureId = 'F6' | 'F7' | 'F8';
export type FixtureId = LiveFixtureId | RobustnessFixtureId;

export interface ExperimentFixture {
  readonly id: FixtureId;
  readonly purpose: string;
  readonly live: boolean;
  readonly snapshot: PlanningSnapshot;
}

function intentWith(
  space: { width: number; height: number },
  items: Array<{
    id: string;
    constraints?: Parameters<typeof createContentConstraints>[0];
  }>,
  desiredPlacements?: Record<string, { x: number; y: number; width: number; height: number }>,
): LayoutIntent {
  return createLayoutIntent({
    space,
    items: items.map((item) =>
      createLayoutItem({
        id: item.id,
        constraints: createContentConstraints(item.constraints ?? {}),
      }),
    ),
    desiredPlacements,
  });
}

/** F1 — Prominence competition where deterministic planner performs sensibly. */
function fixtureF1(): ExperimentFixture {
  const intent = intentWith({ width: 200, height: 100 }, [
    {
      id: 'hero-primary-card',
      constraints: { preferredWidth: 120, preferredHeight: 100, minWidth: 40 },
    },
    {
      id: 'sidebar-widget',
      constraints: { preferredWidth: 90, preferredHeight: 100, minWidth: 40 },
    },
    {
      id: 'footer-strip',
      constraints: { preferredWidth: 90, preferredHeight: 100, minWidth: 40 },
    },
  ]);
  return {
    id: 'F1',
    purpose:
      'Prominence competition: deterministic prominence planner places high-priority automatic items first.',
    live: true,
    snapshot: {
      intent,
      prominence: {
        'sidebar-widget': 10,
        'footer-strip': 5,
        'hero-primary-card': 0,
      },
    },
  };
}

/**
 * F2 — Multi-item interaction where declaration order and prominence are not
 * obviously globally optimal (order-sensitive value case).
 */
function fixtureF2(): ExperimentFixture {
  const intent = intentWith({ width: 240, height: 120 }, [
    {
      id: 'wide-blocker',
      constraints: { preferredWidth: 140, preferredHeight: 120, minWidth: 60 },
    },
    {
      id: 'mid-panel',
      constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 },
    },
    {
      id: 'tall-panel',
      constraints: { preferredWidth: 80, preferredHeight: 120, minWidth: 40 },
    },
    {
      id: 'compact-chip',
      constraints: { preferredWidth: 60, preferredHeight: 40, minWidth: 20 },
    },
  ]);
  return {
    id: 'F2',
    purpose:
      'Multi-item interaction: four automatic items; declaration vs prominence not obviously globally optimal.',
    live: true,
    snapshot: {
      intent,
      prominence: {
        'wide-blocker': 1,
        'mid-panel': 8,
        'tall-panel': 7,
        'compact-chip': 3,
      },
    },
  };
}

/** F3 — Mixed source + automatic; pinned source must remain untouched. */
function fixtureF3(): ExperimentFixture {
  const intent = intentWith(
    { width: 200, height: 100 },
    [
      {
        id: 'pinned-nav',
        constraints: { preferredWidth: 100, preferredHeight: 100, minWidth: 40 },
      },
      {
        id: 'low-priority',
        constraints: { preferredWidth: 90, preferredHeight: 90, minWidth: 40 },
      },
      {
        id: 'high-priority',
        constraints: { preferredWidth: 90, preferredHeight: 90, minWidth: 40 },
      },
    ],
    { 'pinned-nav': { x: 0, y: 0, width: 100, height: 100 } },
  );
  return {
    id: 'F3',
    purpose: 'Mixed source + automatic: source-locked placement must be preserved.',
    live: true,
    snapshot: {
      intent,
      prominence: { 'high-priority': 10, 'low-priority': 0 },
    },
  };
}

/** F4 — Previous-layout stability context (never Source Intent). */
function fixtureF4(): ExperimentFixture {
  const intent = intentWith({ width: 220, height: 100 }, [
    {
      id: 'alpha-block',
      constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 },
    },
    {
      id: 'beta-block',
      constraints: { preferredWidth: 100, preferredHeight: 80, minWidth: 40 },
    },
    {
      id: 'gamma-block',
      constraints: { preferredWidth: 80, preferredHeight: 60, minWidth: 30 },
    },
  ]);
  const previous: ResolvedLayout = createResolvedLayout({
    space: { width: 220, height: 100 },
    placements: {
      'alpha-block': { x: 0, y: 0, width: 100, height: 80 },
      'beta-block': { x: 100, y: 0, width: 100, height: 80 },
      'gamma-block': { x: 0, y: 80, width: 80, height: 20 },
    },
  });
  return {
    id: 'F4',
    purpose: 'Previous-layout stability context exists but is never Source Intent.',
    live: true,
    snapshot: {
      intent,
      previous,
      prominence: { 'gamma-block': 9, 'alpha-block': 2, 'beta-block': 2 },
    },
  };
}

/** F5 — Tight constrained container; placement opportunity materially order-sensitive. */
function fixtureF5(): ExperimentFixture {
  const intent = intentWith({ width: 180, height: 100 }, [
    {
      id: 'large-a',
      constraints: { preferredWidth: 100, preferredHeight: 100, minWidth: 50 },
    },
    {
      id: 'large-b',
      constraints: { preferredWidth: 100, preferredHeight: 100, minWidth: 50 },
    },
    {
      id: 'small-fit',
      constraints: { preferredWidth: 80, preferredHeight: 50, minWidth: 30 },
    },
  ]);
  return {
    id: 'F5',
    purpose:
      'Tight constrained container: multiple plausible orders; placement opportunity order-sensitive.',
    live: true,
    snapshot: {
      intent,
      prominence: { 'large-a': 5, 'large-b': 5, 'small-fit': 1 },
    },
  };
}

/** F6 — malformed provider response (offline robustness). */
function fixtureF6(): ExperimentFixture {
  return {
    id: 'F6',
    purpose: 'Offline robustness: malformed provider structured response.',
    live: false,
    snapshot: fixtureF1().snapshot,
  };
}

/** F7 — delayed stale provider result (offline robustness). */
function fixtureF7(): ExperimentFixture {
  return {
    id: 'F7',
    purpose: 'Offline robustness: delayed stale provider result must not apply.',
    live: false,
    snapshot: fixtureF1().snapshot,
  };
}

/** F8 — provider unavailable (offline robustness). */
function fixtureF8(): ExperimentFixture {
  return {
    id: 'F8',
    purpose: 'Offline robustness: provider unavailable / throw.',
    live: false,
    snapshot: fixtureF1().snapshot,
  };
}

export const EXPERIMENT_CORPUS: readonly ExperimentFixture[] = Object.freeze([
  fixtureF1(),
  fixtureF2(),
  fixtureF3(),
  fixtureF4(),
  fixtureF5(),
  fixtureF6(),
  fixtureF7(),
  fixtureF8(),
]);

export const LIVE_FIXTURES: readonly ExperimentFixture[] = Object.freeze(
  EXPERIMENT_CORPUS.filter((fixture) => fixture.live),
);

export function getFixture(id: FixtureId): ExperimentFixture {
  const found = EXPERIMENT_CORPUS.find((fixture) => fixture.id === id);
  if (found === undefined) {
    throw new Error(`Unknown fixture ${id}`);
  }
  return found;
}
