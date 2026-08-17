// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('@dndgem/vue import surface', () => {
  it('can be imported in a Node environment without touching window or document', async () => {
    expect(typeof globalThis.window).toBe('undefined');
    expect(typeof globalThis.document).toBe('undefined');
    const api = await import('../src/index.js');
    expect(typeof globalThis.window).toBe('undefined');
    expect(typeof globalThis.document).toBe('undefined');
    expect(api.VUE_PACKAGE_NAME).toBe('@dndgem/vue');
    expect(typeof api.DnDGemProvider).toBe('object');
    expect(typeof api.getVuePackageInfo).toBe('function');
  });
});
