import { describe, expect, it, vi } from 'vitest';

describe('@dndgem/svelte server render', () => {
  it('renders consumer markup without creating a layout session', async () => {
    expect(typeof globalThis.window).toBe('undefined');
    expect(typeof globalThis.document).toBe('undefined');

    const session = await import('@dndgem/dom');
    const createSpy = vi.spyOn(session, 'createLayoutSession');
    const { render } = await import('svelte/server');
    const { default: SsrApp } = await import('./fixtures/SsrApp.svelte');

    const result = render(SsrApp);

    expect(createSpy).not.toHaveBeenCalled();
    expect(result.body).toContain('ssr-board');
    expect(result.body).toContain('ssr-item');
    expect(result.body).toContain('chart');
    expect(typeof globalThis.window).toBe('undefined');
    expect(typeof globalThis.document).toBe('undefined');
  });

  it('compiled dist provider wrapper is import-safe in Node without a session', async () => {
    expect(typeof globalThis.window).toBe('undefined');
    expect(typeof globalThis.document).toBe('undefined');

    const session = await import('@dndgem/dom');
    const createSpy = vi.spyOn(session, 'createLayoutSession');
    const { DnDGemProvider } = await import('../dist/index.server.js');

    expect(typeof DnDGemProvider).toBe('function');
    expect(createSpy).not.toHaveBeenCalled();
    expect(typeof globalThis.window).toBe('undefined');
    expect(typeof globalThis.document).toBe('undefined');
  });
});
