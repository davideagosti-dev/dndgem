import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const pkg = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8'),
) as { version: string };

describe('@dndgem/svelte import surface', () => {
  it('can be imported in a Node environment without touching window or document', async () => {
    expect(typeof globalThis.window).toBe('undefined');
    expect(typeof globalThis.document).toBe('undefined');
    const api = await import('../dist/index.js');
    expect(typeof globalThis.window).toBe('undefined');
    expect(typeof globalThis.document).toBe('undefined');
    expect(api.SVELTE_PACKAGE_NAME).toBe('@dndgem/svelte');
    expect(typeof api.DnDGemProvider).toBe('function');
    expect(typeof api.getSveltePackageInfo).toBe('function');
    expect(typeof api.getDnDGem).toBe('function');
    expect(typeof api.dndgemContainer).toBe('function');
    expect(typeof api.dndgemItem).toBe('function');
  });

  it('does not start a layout session at import time', async () => {
    const api = await import('../dist/index.js');
    expect(api.SVELTE_PACKAGE_VERSION).toBe(pkg.version);
    expect(typeof globalThis.window).toBe('undefined');
    expect(typeof globalThis.document).toBe('undefined');
  });
});
