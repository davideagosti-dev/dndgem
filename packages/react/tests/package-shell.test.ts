import { describe, expect, it } from 'vitest';
import { REACT_PACKAGE_NAME, getReactPackageInfo } from '../src/index.js';

describe('@dndgem/react package shell', () => {
  it('exposes package identity and linked core/dom info', () => {
    const info = getReactPackageInfo();
    expect(info.name).toBe(REACT_PACKAGE_NAME);
    expect(info.version).toBe('0.0.0');
    expect(info.core.name).toBe('@dndgem/core');
    expect(info.dom.name).toBe('@dndgem/dom');
  });

  it('exports the integration API without provider machinery', async () => {
    const api = await import('../src/index.js');
    expect(typeof api.DnDGemProvider).toBe('function');
    expect(typeof api.useDnDGem).toBe('function');
    expect(typeof api.useDnDGemItem).toBe('function');
    expect(typeof api.useDnDGemContainer).toBe('function');
    expect('DragDropManager' in api).toBe(false);
    expect('Draggable' in api).toBe(false);
    expect('PointerSensor' in api).toBe(false);
    expect('KeyboardSensor' in api).toBe(false);
    expect('createDragInteraction' in api).toBe(false);
  });
});
