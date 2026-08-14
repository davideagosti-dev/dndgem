import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  DOM_PACKAGE_NAME,
  DOM_PACKAGE_VERSION,
  DomAdapterError,
  applyLayoutPlacements,
  createDragInteraction,
  createLayoutSession,
  getDomPackageInfo,
  layoutPlacementStyle,
  measureLayout,
  observeLayout,
} from '../src/index.js';

const pkg = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8'),
) as { version: string };

const ALPHA_RUNTIME_EXPORTS = [
  'DOM_PACKAGE_NAME',
  'DOM_PACKAGE_VERSION',
  'getDomPackageInfo',
  'DomAdapterError',
  'measureLayout',
  'observeLayout',
  'createDragInteraction',
  'applyLayoutPlacements',
  'layoutPlacementStyle',
  'prepareLayoutContainer',
  'createLayoutSession',
] as const;

describe('@dndgem/dom public API', () => {
  it('exposes package identity and linked core info', () => {
    const info = getDomPackageInfo();
    expect(info.name).toBe(DOM_PACKAGE_NAME);
    expect(info.version).toBe(pkg.version);
    expect(DOM_PACKAGE_VERSION).toBe(pkg.version);
    expect(info.core.name).toBe('@dndgem/core');
  });

  it('exports measurement, observation, drag interaction, and layout session entry points', () => {
    expect(typeof measureLayout).toBe('function');
    expect(typeof observeLayout).toBe('function');
    expect(typeof createDragInteraction).toBe('function');
    expect(typeof createLayoutSession).toBe('function');
    expect(typeof applyLayoutPlacements).toBe('function');
    expect(typeof layoutPlacementStyle).toBe('function');
    expect(new DomAdapterError('TEST', 'test').name).toBe('DomAdapterError');
  });

  it('locks the Alpha runtime export surface', async () => {
    const api = await import('../src/index.js');
    expect(Object.keys(api).sort()).toEqual([...ALPHA_RUNTIME_EXPORTS].sort());
  });

  it('does not leak internal helpers or provider types as public symbols', async () => {
    const api = await import('../src/index.js');
    expect('snapshotsEqual' in api).toBe(false);
    expect('readClientBox' in api).toBe(false);
    expect('assertMeasurableElement' in api).toBe(false);
    expect('resolveResizeObserverConstructor' in api).toBe(false);
    expect('dndKitMechanicsAdapter' in api).toBe(false);
    expect('DragDropManager' in api).toBe(false);
    expect('Draggable' in api).toBe(false);
    expect('Droppable' in api).toBe(false);
    expect('PointerSensor' in api).toBe(false);
  });
});

describe('compile-time contracts', () => {
  it('keeps snapshots and proposals free of renderer and provider handles', () => {
    type Snapshot = import('../src/index.js').DomMeasurementSnapshot;
    type Proposal = import('../src/index.js').DragProposal;
    type ForbiddenKeys = 'container' | 'element' | 'node' | 'ref' | 'style' | 'observer';
    type SnapshotKeys = keyof Snapshot;
    type ProposalKeys = keyof Proposal;
    expectTypeOf<Extract<SnapshotKeys, ForbiddenKeys>>().toEqualTypeOf<never>();
    expectTypeOf<Extract<ProposalKeys, ForbiddenKeys>>().toEqualTypeOf<never>();
  });
});
