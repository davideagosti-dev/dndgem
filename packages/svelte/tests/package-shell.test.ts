import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SVELTE_PACKAGE_NAME, SVELTE_PACKAGE_VERSION, getSveltePackageInfo } from '../src/index.js';

const pkg = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8'),
) as { version: string };

const ALPHA_RUNTIME_EXPORTS = [
  'SVELTE_PACKAGE_NAME',
  'SVELTE_PACKAGE_VERSION',
  'getSveltePackageInfo',
  'DnDGemProvider',
  'getDnDGem',
  'dndgemContainer',
  'dndgemItem',
] as const;

describe('@dndgem/svelte package shell', () => {
  it('exposes package identity and linked core/dom info', () => {
    const info = getSveltePackageInfo();
    expect(info.name).toBe(SVELTE_PACKAGE_NAME);
    expect(info.version).toBe(pkg.version);
    expect(SVELTE_PACKAGE_VERSION).toBe(pkg.version);
    expect(info.core.name).toBe('@dndgem/core');
    expect(info.dom.name).toBe('@dndgem/dom');
  });

  it('locks the runtime export surface', async () => {
    const api = await import('../src/index.js');
    expect(Object.keys(api).sort()).toEqual([...ALPHA_RUNTIME_EXPORTS].sort());
  });

  it('exports the integration API without provider machinery', async () => {
    const api = await import('../src/index.js');
    expect(typeof api.DnDGemProvider).toBe('function');
    expect(typeof api.getDnDGem).toBe('function');
    expect(typeof api.dndgemContainer).toBe('function');
    expect(typeof api.dndgemItem).toBe('function');
    expect('DragDropManager' in api).toBe(false);
    expect('Draggable' in api).toBe(false);
    expect('PointerSensor' in api).toBe(false);
    expect('KeyboardSensor' in api).toBe(false);
    expect('createDragInteraction' in api).toBe(false);
  });
});
