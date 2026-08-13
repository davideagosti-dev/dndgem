// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('@dndgem/react import surface', () => {
  it('can be imported in a Node environment without touching window or document', async () => {
    expect(typeof globalThis.window).toBe('undefined');
    const api = await import('../src/index.js');
    expect(api.REACT_PACKAGE_NAME).toBe('@dndgem/react');
    expect(typeof api.DnDGemProvider).toBe('function');
    expect(typeof api.getReactPackageInfo).toBe('function');
  });
});
