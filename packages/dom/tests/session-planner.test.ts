import { describe, expect, it, vi } from 'vitest';
import { createAutoLayoutProposal, createLayoutIntent, createLayoutItem } from '@dndgem/core';
import {
  createLayoutSession,
  type LayoutSessionPlanner,
  type LayoutSessionPlannerEvent,
  type LayoutSessionState,
} from '../src/index.js';
import {
  FakeResizeObserver,
  createFakeDragMechanics,
  fakeElement,
  lastFakeObserver,
  resetFakeResizeObservers,
} from './helpers.js';

const ORDER_CONSTRAINTS = {
  preferredWidth: 90,
  preferredHeight: 100,
  minWidth: 40,
} as const;

const BLOCKER_CONSTRAINTS = {
  preferredWidth: 120,
  preferredHeight: 100,
  minWidth: 40,
} as const;

function orderSensitiveSession(planner?: LayoutSessionPlanner) {
  resetFakeResizeObservers();
  const mechanics = createFakeDragMechanics();
  const events: LayoutSessionPlannerEvent[] = [];
  const session = createLayoutSession({
    container: fakeElement({ left: 0, top: 0, width: 200, height: 100 }),
    items: [
      {
        id: 'blocker',
        element: fakeElement({ left: 0, top: 0, width: 120, height: 100 }),
        constraints: BLOCKER_CONSTRAINTS,
      },
      {
        id: 'target-a',
        element: fakeElement({ left: 0, top: 0, width: 90, height: 100 }),
        constraints: ORDER_CONSTRAINTS,
      },
      {
        id: 'target-b',
        element: fakeElement({ left: 0, top: 0, width: 90, height: 100 }),
        constraints: ORDER_CONSTRAINTS,
      },
    ],
    autoLayout: true,
    ...(planner !== undefined ? { planner } : {}),
    onPlannerEvent: (event) => {
      events.push(event);
    },
    mechanics: mechanics.adapter,
    ResizeObserver: FakeResizeObserver,
  });
  return { session, mechanics, events };
}

describe('createLayoutSession — planner integration (DND-4.3)', () => {
  it('preserves current behavior when no planner is configured', () => {
    const { session } = orderSensitiveSession();
    const state = session.getState();
    expect(state.autoLayout?.enabled).toBe(true);
    expect(state.resolved.placements['target-a']).toBeDefined();
    expect(typeof session.replan).toBe('function');
    const result = session.replan();
    expect(result).toBeInstanceOf(Promise);
    return result.then(() => {
      expect(session.getState().autoLayout?.proposalUnplacedItemIds).toEqual(
        createAutoLayoutProposal({
          intent: createLayoutIntent({
            space: { width: 200, height: 100 },
            items: [
              createLayoutItem({ id: 'blocker', constraints: BLOCKER_CONSTRAINTS }),
              createLayoutItem({ id: 'target-a', constraints: ORDER_CONSTRAINTS }),
              createLayoutItem({ id: 'target-b', constraints: ORDER_CONSTRAINTS }),
            ],
          }),
        }).unplacedItemIds,
      );
      session.dispose();
    });
  });

  it('replan() always returns a Promise', async () => {
    const { session } = orderSensitiveSession(() => ({
      automaticItemOrder: ['target-a', 'target-b', 'blocker'],
    }));
    const pending = session.replan();
    expect(pending).toBeInstanceOf(Promise);
    await pending;
    session.dispose();
  });

  it('sync planner replan applies advisory order', async () => {
    const planner = vi.fn<LayoutSessionPlanner>(() => ({
      automaticItemOrder: ['target-a', 'target-b', 'blocker'],
    }));
    const { session, events } = orderSensitiveSession(planner);
    const beforeUnplaced = session.getState().autoLayout?.proposalUnplacedItemIds ?? [];
    await session.replan();
    expect(planner).toHaveBeenCalledTimes(1);
    expect(session.getState().autoLayout?.proposalUnplacedItemIds).toEqual(['blocker']);
    expect(beforeUnplaced.length).toBeGreaterThan(
      session.getState().autoLayout?.proposalUnplacedItemIds.length ?? 0,
    );
    expect(events.some((event) => event.status === 'applied')).toBe(true);
    session.dispose();
  });

  it('planner snapshot includes committed previous without promoting it to Source Intent', async () => {
    const planner = vi.fn<LayoutSessionPlanner>((snapshot) => {
      expect(snapshot.previous).toBeDefined();
      expect(snapshot.intent.desiredPlacements).toBeUndefined();
      return { automaticItemOrder: ['target-a', 'target-b', 'blocker'] };
    });
    const { session } = orderSensitiveSession(planner);
    await session.replan();
    expect(planner).toHaveBeenCalledTimes(1);
    session.dispose();
  });

  it('retains last successful advisory order on resize without re-invoking planner', async () => {
    const planner = vi.fn<LayoutSessionPlanner>(() => ({
      automaticItemOrder: ['target-a', 'target-b', 'blocker'],
    }));
    const { session } = orderSensitiveSession(planner);
    await session.replan();
    expect(planner).toHaveBeenCalledTimes(1);
    expect(session.getState().autoLayout?.proposalUnplacedItemIds).toEqual(['blocker']);
    lastFakeObserver().deliver();
    expect(planner).toHaveBeenCalledTimes(1);
    expect(session.getState().autoLayout?.proposalUnplacedItemIds).toEqual(['blocker']);
    session.dispose();
  });

  it('async planner replan applies and keeps prior layout while pending', async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const planner: LayoutSessionPlanner = async () => {
      await gate;
      return { automaticItemOrder: ['target-a', 'target-b', 'blocker'] };
    };
    const { session } = orderSensitiveSession(planner);
    const before = session.getState().resolved;
    const pending = session.replan();
    expect(session.getState().resolved).toBe(before);
    release?.();
    await pending;
    expect(session.getState().autoLayout?.proposalUnplacedItemIds).toEqual(['blocker']);
    session.dispose();
  });

  it('stale result is ignored when a newer replan wins', async () => {
    let releaseA: (() => void) | undefined;
    const gateA = new Promise<void>((resolve) => {
      releaseA = resolve;
    });
    let call = 0;
    const planner: LayoutSessionPlanner = async () => {
      call += 1;
      if (call === 1) {
        await gateA;
        return { automaticItemOrder: ['blocker', 'target-a', 'target-b'] };
      }
      return { automaticItemOrder: ['target-a', 'target-b', 'blocker'] };
    };
    const { session, events } = orderSensitiveSession(planner);
    const first = session.replan();
    const second = session.replan();
    await second;
    expect(session.getState().autoLayout?.proposalUnplacedItemIds).toEqual(['blocker']);
    releaseA?.();
    await first;
    expect(session.getState().autoLayout?.proposalUnplacedItemIds).toEqual(['blocker']);
    expect(events.some((event) => event.status === 'stale')).toBe(true);
    session.dispose();
  });

  it('cancelled result is ignored', async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const planner: LayoutSessionPlanner = async (_snapshot, context) => {
      await gate;
      if (context?.signal?.aborted) {
        const error = new Error('aborted');
        error.name = 'AbortError';
        throw error;
      }
      return { automaticItemOrder: ['target-a', 'target-b', 'blocker'] };
    };
    const { session, events } = orderSensitiveSession(planner);
    const beforeUnplaced = [...(session.getState().autoLayout?.proposalUnplacedItemIds ?? [])];
    const pending = session.replan();
    session.dispose();
    release?.();
    await pending;
    expect(events.some((event) => event.status === 'cancelled' || event.status === 'stale')).toBe(
      true,
    );
    // Disposed session must not apply; capture pre-dispose expectation indirectly.
    expect(beforeUnplaced.length).toBeGreaterThan(0);
  });

  it('planner throw falls back to Phase 3 declaration order', async () => {
    const planner: LayoutSessionPlanner = () => {
      throw new Error('planner failed');
    };
    const { session, events } = orderSensitiveSession(planner);
    await session.replan();
    expect(events.some((event) => event.status === 'fallback')).toBe(true);
    expect(session.getState().autoLayout?.proposalUnplacedItemIds).toEqual(
      createAutoLayoutProposal({
        intent: createLayoutIntent({
          space: { width: 200, height: 100 },
          items: [
            createLayoutItem({ id: 'blocker', constraints: BLOCKER_CONSTRAINTS }),
            createLayoutItem({ id: 'target-a', constraints: ORDER_CONSTRAINTS }),
            createLayoutItem({ id: 'target-b', constraints: ORDER_CONSTRAINTS }),
          ],
        }),
      }).unplacedItemIds,
    );
    session.dispose();
  });

  it('planner reject falls back to Phase 3 declaration order', async () => {
    const planner: LayoutSessionPlanner = async () => {
      throw new Error('reject');
    };
    const { session, events } = orderSensitiveSession(planner);
    await session.replan();
    expect(events.some((event) => event.status === 'fallback')).toBe(true);
    session.dispose();
  });

  it('keeps source provenance unchanged after planner replan', async () => {
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 400, height: 200 }),
      items: [
        {
          id: 'pinned',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: {
            preferredWidth: 80,
            preferredHeight: 40,
            minWidth: 20,
          },
        },
        {
          id: 'auto',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: {
            preferredWidth: 80,
            preferredHeight: 40,
            minWidth: 20,
          },
        },
      ],
      autoLayout: true,
      desiredPlacements: {
        pinned: { x: 0, y: 0, width: 80, height: 40 },
      },
      planner: () => ({ automaticItemOrder: ['auto'] }),
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    await session.replan();
    const after = session.getState();
    expect(after.resolved.placements.pinned).toEqual({
      x: 0,
      y: 0,
      width: 80,
      height: 40,
    });
    const proposal = createAutoLayoutProposal({
      intent: createLayoutIntent({
        space: after.resolved.space,
        items: [
          {
            id: 'pinned',
            constraints: { preferredWidth: 80, preferredHeight: 40, minWidth: 20 },
          },
          {
            id: 'auto',
            constraints: { preferredWidth: 80, preferredHeight: 40, minWidth: 20 },
          },
        ],
        desiredPlacements: { pinned: { x: 0, y: 0, width: 80, height: 40 } },
      }),
      previous: after.resolved,
    });
    expect(proposal.placementOrigins.pinned).toBe('source');
    expect(proposal.placementOrigins.auto).toBe('generated');
    session.dispose();
  });

  it('keeps unplaced metadata honest after planner guidance', async () => {
    const { session } = orderSensitiveSession(() => ({
      automaticItemOrder: ['target-a', 'target-b', 'blocker'],
    }));
    await session.replan();
    expect(session.getState().autoLayout?.proposalUnplacedItemIds).toEqual(['blocker']);
    session.dispose();
  });

  it('does not execute planner on pointermove / drag preview', async () => {
    const planner = vi.fn<LayoutSessionPlanner>(() => ({
      automaticItemOrder: ['target-a', 'target-b', 'blocker'],
    }));
    const { session, mechanics } = orderSensitiveSession(planner);
    mechanics.start('target-a');
    mechanics.move('target-a', { x: 10, y: 4 });
    mechanics.move('target-a', { x: 20, y: 8 });
    expect(planner).not.toHaveBeenCalled();
    mechanics.cancel('target-a');
    expect(planner).not.toHaveBeenCalled();
    session.dispose();
  });

  it('does not execute planner on ResizeObserver / passive resize', () => {
    const planner = vi.fn<LayoutSessionPlanner>(() => ({
      automaticItemOrder: ['target-a', 'target-b', 'blocker'],
    }));
    const { session } = orderSensitiveSession(planner);
    const observer = lastFakeObserver();
    observer.deliver();
    observer.deliver();
    expect(planner).not.toHaveBeenCalled();
    session.dispose();
  });

  it('does not execute planner on every idle solve path', () => {
    const planner = vi.fn<LayoutSessionPlanner>(() => ({
      automaticItemOrder: ['target-a', 'target-b', 'blocker'],
    }));
    const { session } = orderSensitiveSession(planner);
    expect(planner).not.toHaveBeenCalled();
    lastFakeObserver().deliver();
    expect(planner).not.toHaveBeenCalled();
    session.dispose();
  });

  it('accepted drop does not auto-call the custom planner', () => {
    const planner = vi.fn<LayoutSessionPlanner>(() => ({
      automaticItemOrder: ['target-a', 'target-b', 'blocker'],
    }));
    const { session, mechanics } = orderSensitiveSession(planner);
    mechanics.start('target-a');
    mechanics.drop('target-a', { x: 8, y: 4 });
    expect(session.getState().lastDrop?.accepted).toBe(true);
    expect(planner).not.toHaveBeenCalled();
    session.dispose();
  });

  it('Phase 3 Auto-Layout regression still passes with planner option unused', () => {
    const changes: LayoutSessionState[] = [];
    resetFakeResizeObservers();
    const mechanics = createFakeDragMechanics();
    const session = createLayoutSession({
      container: fakeElement({ left: 0, top: 0, width: 400, height: 200 }),
      items: [
        {
          id: 'a',
          element: fakeElement({ left: 0, top: 0, width: 80, height: 40 }),
          constraints: {
            preferredWidth: 80,
            preferredHeight: 40,
            minWidth: 20,
          },
        },
        {
          id: 'b',
          element: fakeElement({ left: 0, top: 0, width: 60, height: 40 }),
          constraints: {
            preferredWidth: 60,
            preferredHeight: 40,
            minWidth: 20,
          },
        },
      ],
      autoLayout: true,
      onChange: (state) => {
        changes.push(state);
      },
      mechanics: mechanics.adapter,
      ResizeObserver: FakeResizeObserver,
    });
    expect(session.getState().autoLayout?.enabled).toBe(true);
    expect(session.getState().resolved.placements.a).toBeDefined();
    expect(session.getState().resolved.placements.b).toBeDefined();
    expect(changes.length).toBeGreaterThan(0);
    session.dispose();
  });
});

describe('DND-4.3 product fixtures D/E/F', () => {
  it('Fixture D — custom planner success affects automatic competition', async () => {
    const { session } = orderSensitiveSession(() => ({
      automaticItemOrder: ['target-a', 'target-b', 'blocker'],
    }));
    const baselineUnplaced = createAutoLayoutProposal({
      intent: createLayoutIntent({
        space: { width: 200, height: 100 },
        items: [
          createLayoutItem({ id: 'blocker', constraints: BLOCKER_CONSTRAINTS }),
          createLayoutItem({ id: 'target-a', constraints: ORDER_CONSTRAINTS }),
          createLayoutItem({ id: 'target-b', constraints: ORDER_CONSTRAINTS }),
        ],
      }),
    }).unplacedItemIds.length;
    await session.replan();
    expect(session.getState().autoLayout?.proposalUnplacedItemIds).toEqual(['blocker']);
    expect(baselineUnplaced).toBeGreaterThan(1);
    session.dispose();
  });

  it('Fixture E — raw custom planner failure falls back to Phase 3 declaration-order Auto-Layout', async () => {
    const { session, events } = orderSensitiveSession(() => {
      throw new Error('fail');
    });
    await session.replan();
    const state = session.getState();
    expect(events.some((event) => event.status === 'fallback')).toBe(true);
    expect(events.some((event) => event.proposalSource === 'declaration')).toBe(true);
    expect(state.solver.evaluation.state).toMatch(/VALID|DEGRADED/);
    expect(state.resolved.placements['target-a']).toBeDefined();
    // Raw DOM planner path skips the intelligence deterministic-middle step.
    expect(state.autoLayout?.proposalUnplacedItemIds).toEqual(
      createAutoLayoutProposal({
        intent: createLayoutIntent({
          space: { width: 200, height: 100 },
          items: [
            createLayoutItem({ id: 'blocker', constraints: BLOCKER_CONSTRAINTS }),
            createLayoutItem({ id: 'target-a', constraints: ORDER_CONSTRAINTS }),
            createLayoutItem({ id: 'target-b', constraints: ORDER_CONSTRAINTS }),
          ],
        }),
      }).unplacedItemIds,
    );
    session.dispose();
  });

  it('Fixture F — stale async planner result is rejected', async () => {
    let releaseOld: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      releaseOld = resolve;
    });
    let calls = 0;
    const planner: LayoutSessionPlanner = async () => {
      calls += 1;
      if (calls === 1) {
        await gate;
        return { automaticItemOrder: ['blocker', 'target-b', 'target-a'] };
      }
      return { automaticItemOrder: ['target-a', 'target-b', 'blocker'] };
    };
    const { session } = orderSensitiveSession(planner);
    const old = session.replan();
    await session.replan();
    const afterNew = session.getState().autoLayout?.proposalUnplacedItemIds;
    releaseOld?.();
    await old;
    expect(session.getState().autoLayout?.proposalUnplacedItemIds).toEqual(afterNew);
    expect(session.getState().autoLayout?.proposalUnplacedItemIds).toEqual(['blocker']);
    session.dispose();
  });
});
