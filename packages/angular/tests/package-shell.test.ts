import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ANGULAR_PACKAGE_NAME,
  ANGULAR_PACKAGE_VERSION,
  getAngularPackageInfo,
} from '../dist/index.js';

const pkg = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8'),
) as { version: string };

const ALPHA_RUNTIME_EXPORTS = [
  'ANGULAR_PACKAGE_NAME',
  'ANGULAR_PACKAGE_VERSION',
  'getAngularPackageInfo',
  'DNDGEM_BOARD_IMPORTS',
  'DnDGemBoard',
  'DnDGemBoardDirective',
  'DnDGemContainerDirective',
  'DnDGemItemDirective',
  'injectDnDGem',
] as const;

describe('@dndgem/angular package shell', () => {
  it('exposes package identity and linked core/dom info', () => {
    const info = getAngularPackageInfo();
    expect(info.name).toBe(ANGULAR_PACKAGE_NAME);
    expect(info.version).toBe(pkg.version);
    expect(ANGULAR_PACKAGE_VERSION).toBe(pkg.version);
    expect(info.core.name).toBe('@dndgem/core');
    expect(info.dom.name).toBe('@dndgem/dom');
  });

  it('locks the runtime export surface', async () => {
    const api = await import('../dist/index.js');
    expect(Object.keys(api).sort()).toEqual([...ALPHA_RUNTIME_EXPORTS].sort());
  });

  it('exports the integration API without provider machinery', async () => {
    const api = await import('../dist/index.js');
    expect(typeof api.DnDGemBoard).toBe('function');
    expect(typeof api.DnDGemBoardDirective).toBe('function');
    expect(typeof api.DnDGemContainerDirective).toBe('function');
    expect(typeof api.DnDGemItemDirective).toBe('function');
    expect(typeof api.injectDnDGem).toBe('function');
    expect(Array.isArray(api.DNDGEM_BOARD_IMPORTS)).toBe(true);
    expect('DragDropManager' in api).toBe(false);
    expect('Draggable' in api).toBe(false);
    expect('PointerSensor' in api).toBe(false);
    expect('KeyboardSensor' in api).toBe(false);
    expect('createDragInteraction' in api).toBe(false);
  });
});
