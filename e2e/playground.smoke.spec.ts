import { test, expect } from '@playwright/test';

interface PlaygroundProbe {
  phase?: string;
  validity?: string;
  spaceWidth?: number;
  autoLayoutEnabled?: boolean;
}

const DISPOSED_INTERACTION = /Cannot read state from a disposed drag interaction/i;

test('playground smoke loads 30-second proof shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'DnDGem Playground' })).toBeVisible();
  await expect(page.getByText(/Geometric fit isn't enough/i)).toBeVisible();
  await expect(page.getByText(/Geometrically fits/i)).toBeVisible();
  await expect(page.getByTestId('board')).toBeVisible();
  await expect(page.getByTestId('status')).toContainText(/VALID|DEGRADED|INVALID/);
});

test('playground proves VALID → DEGRADED on real board resize without disposed-interaction error', async ({
  page,
}) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.goto('/');

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const probe = (window as unknown as { __DNDGEM_D17?: PlaygroundProbe }).__DNDGEM_D17;
        return probe?.validity ?? null;
      });
    })
    .toBe('VALID');

  await expect(page.getByTestId('status')).toContainText('VALID');
  await expect(page.getByTestId('status')).toContainText('auto');

  const initialWidth = await page.evaluate(() => {
    return (window as unknown as { __DNDGEM_D17?: PlaygroundProbe }).__DNDGEM_D17?.spaceWidth ?? 0;
  });
  expect(initialWidth).toBeGreaterThan(0);

  // Moderate shrink: Details useful-height pressure crosses DEGRADED without absurd tiny boards.
  await page.getByTestId('board').evaluate((node) => {
    const el = node as HTMLElement;
    el.style.width = '480px';
    el.style.height = '220px';
  });

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const probe = (window as unknown as { __DNDGEM_D17?: PlaygroundProbe }).__DNDGEM_D17;
        return probe?.validity ?? null;
      });
    })
    .toBe('DEGRADED');

  await expect(page.getByTestId('status')).toContainText('DEGRADED');

  const degradedWidth = await page.evaluate(() => {
    return (window as unknown as { __DNDGEM_D17?: PlaygroundProbe }).__DNDGEM_D17?.spaceWidth ?? 0;
  });
  expect(degradedWidth).toBeLessThan(initialWidth);
  expect(degradedWidth).toBeGreaterThan(200);

  // Expand restores useful room → VALID again.
  await page.getByTestId('board').evaluate((node) => {
    const el = node as HTMLElement;
    el.style.width = '';
    el.style.height = '';
  });

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const probe = (window as unknown as { __DNDGEM_D17?: PlaygroundProbe }).__DNDGEM_D17;
        return probe?.validity ?? null;
      });
    })
    .toBe('VALID');

  const disposedHits = [...pageErrors, ...consoleErrors].filter((text) =>
    DISPOSED_INTERACTION.test(text),
  );
  expect(disposedHits, `disposed-interaction errors: ${disposedHits.join(' | ')}`).toEqual([]);
});
