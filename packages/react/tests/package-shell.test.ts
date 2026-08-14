import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { REACT_PACKAGE_NAME, REACT_PACKAGE_VERSION, getReactPackageInfo } from '../src/index.js';

const pkg = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8'),
) as { version: string };

const ALPHA_RUNTIME_EXPORTS = [
  'REACT_PACKAGE_NAME',
  'REACT_PACKAGE_VERSION',
  'getReactPackageInfo',
  'DnDGemProvider',
  'useDnDGem',
  'useDnDGemContainer',
  'useDnDGemItem',
] as const;

describe('@dndgem/react package shell', () => {
  it('exposes package identity and linked core/dom info', () => {
    const info = getReactPackageInfo();
    expect(info.name).toBe(REACT_PACKAGE_NAME);
    expect(info.version).toBe(pkg.version);
    expect(REACT_PACKAGE_VERSION).toBe(pkg.version);
    expect(info.core.name).toBe('@dndgem/core');
    expect(info.dom.name).toBe('@dndgem/dom');
  });

  it('locks the Alpha runtime export surface', async () => {
    const api = await import('../src/index.js');
    expect(Object.keys(api).sort()).toEqual([...ALPHA_RUNTIME_EXPORTS].sort());
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
