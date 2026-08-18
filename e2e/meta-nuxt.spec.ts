import { expect, test } from '@playwright/test';
import { dragItem, readProbe, startDrag, waitForReady } from './helpers/meta-compat';

const origin = 'http://127.0.0.1:5182';
const probeKey = '__DNDGEM_META_NUXT' as const;

test.describe('Nuxt compatibility', () => {
  test.use({ baseURL: origin });

  test('production server renders the board route without DnDGem geometry', async ({ request }) => {
    const response = await request.get(`${origin}/`);
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toContain('data-testid="compat-shell"');
    expect(html).toContain('data-testid="item-revenue"');
    expect(html).toContain('DnDGem Nuxt Compat');
    expect(html).not.toMatch(/left:\s*12px/);
  });

  test('hydrates a client session with Auto-Layout, drag, resize, Escape, and ARIA', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'DnDGem Nuxt Compat' })).toBeVisible();
    const initial = await waitForReady(page, probeKey);
    expect(initial.sessionsCreated).toBe(1);
    expect(initial.liveObservers).toBe(1);
    expect(initial.validity).toMatch(/VALID|DEGRADED|INVALID/);
    await expect(page.getByTestId('status')).toContainText(/VALID|DEGRADED|INVALID/);
    await expect(page.getByTestId('status')).toContainText('auto proposal unresolved');

    const item = page.getByTestId('item-revenue');
    await expect(item).toHaveAttribute('aria-label', 'Revenue');
    await expect(item).toHaveAttribute('tabindex', '0');
    await expect(page.getByTestId('item-revenue-action')).toBeVisible();

    await dragItem(page, item);
    await expect
      .poll(async () => (await readProbe(page, probeKey)).lastDropAccepted ?? null)
      .toBe(true);
    await expect(item).not.toHaveCSS('left', '12px');

    const afterDrag = await readProbe(page, probeKey);
    const initialWidth = afterDrag.spaceWidth ?? 0;
    expect(initialWidth).toBeGreaterThan(0);
    await page.getByTestId('board').evaluate((node) => {
      (node as HTMLElement).style.width = '360px';
    });
    await expect
      .poll(async () => (await readProbe(page, probeKey)).spaceWidth ?? null)
      .toBeLessThan(initialWidth);

    await expect(item).toHaveAttribute('aria-label', 'Revenue');
    await expect(item).toHaveAttribute('tabindex', '0');

    await page.reload();
    await waitForReady(page, probeKey);
    const restored = page.getByTestId('item-revenue');
    await expect(restored).toHaveCSS('left', '12px');
    await startDrag(page, restored);
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await expect
      .poll(async () => (await readProbe(page, probeKey)).cancelCount ?? 0)
      .toBeGreaterThan(0);
    await expect(restored).toHaveCSS('left', '12px');
  });

  test('route leave disposes the session and return recreates one', async ({ page }) => {
    await page.goto('/');
    await waitForReady(page, probeKey);
    await expect.poll(async () => (await readProbe(page, probeKey)).sessionsCreated ?? 0).toBe(1);
    await expect.poll(async () => (await readProbe(page, probeKey)).liveObservers ?? 0).toBe(1);

    await page.getByTestId('nav-other').click();
    await expect(page.getByTestId('other-status')).toBeVisible();
    await expect.poll(async () => (await readProbe(page, probeKey)).sessionsDisposed ?? 0).toBe(1);
    await expect.poll(async () => (await readProbe(page, probeKey)).liveObservers ?? 0).toBe(0);

    await page.getByTestId('nav-board').click();
    await waitForReady(page, probeKey);
    const probe = await readProbe(page, probeKey);
    expect(probe.sessionsCreated).toBe(2);
    expect(probe.sessionsDisposed).toBe(1);
    expect(probe.liveObservers).toBe(1);
  });
});
