import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  DOM_PACKAGE_NAME,
  DomAdapterError,
  getDomPackageInfo,
  measureLayout,
  observeLayout,
} from '../src/index.js';

describe('@dndgem/dom public API', () => {
  it('exposes package identity and linked core info', () => {
    const info = getDomPackageInfo();
    expect(info.name).toBe(DOM_PACKAGE_NAME);
    expect(info.version).toBe('0.0.0');
    expect(info.core.name).toBe('@dndgem/core');
  });

  it('exports measurement and observation entry points', () => {
    expect(typeof measureLayout).toBe('function');
    expect(typeof observeLayout).toBe('function');
    expect(new DomAdapterError('TEST', 'test').name).toBe('DomAdapterError');
  });

  it('does not leak internal helpers as public symbols', async () => {
    const api = await import('../src/index.js');
    expect('snapshotsEqual' in api).toBe(false);
    expect('readClientBox' in api).toBe(false);
    expect('assertMeasurableElement' in api).toBe(false);
    expect('resolveResizeObserverConstructor' in api).toBe(false);
  });
});

describe('compile-time contracts', () => {
  it('keeps snapshots free of renderer handles', () => {
    type Snapshot = import('../src/index.js').DomMeasurementSnapshot;
    type ForbiddenKeys = 'container' | 'element' | 'node' | 'ref' | 'style' | 'observer';
    type SnapshotKeys = keyof Snapshot;
    expectTypeOf<Extract<SnapshotKeys, ForbiddenKeys>>().toEqualTypeOf<never>();
  });
});
