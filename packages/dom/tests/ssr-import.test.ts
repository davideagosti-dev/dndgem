// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('@dndgem/dom import surface', () => {
  it('can be imported in a Node environment without touching window or document', async () => {
    expect(typeof globalThis.window).toBe('undefined');
    expect(typeof globalThis.document).toBe('undefined');
    const api = await import('../src/index.js');
    expect(api.DOM_PACKAGE_NAME).toBe('@dndgem/dom');
    expect(typeof api.createLayoutSession).toBe('function');
    expect(typeof api.getDomPackageInfo).toBe('function');
  });
});
