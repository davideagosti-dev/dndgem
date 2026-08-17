// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('@dndgem/angular import surface', () => {
  it('can be imported in a Node environment without touching window or document', async () => {
    expect(typeof globalThis.window).toBe('undefined');
    expect(typeof globalThis.document).toBe('undefined');
    const api = await import('../dist/index.js');
    expect(typeof globalThis.window).toBe('undefined');
    expect(typeof globalThis.document).toBe('undefined');
    expect(api.ANGULAR_PACKAGE_NAME).toBe('@dndgem/angular');
    expect(typeof api.DnDGemBoardDirective).toBe('function');
    expect(typeof api.getAngularPackageInfo).toBe('function');
    expect(typeof api.injectDnDGem).toBe('function');
  });
});
