import { expect, test } from '@playwright/test';

interface ReactProbe {
  phase?: string;
  validity?: string;
  lastDropAccepted?: boolean;
  chartX?: number;
  spaceWidth?: number;
}

test('react playground integration applies geometry and accepts a drag drop', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'DnDGem Playground' })).toBeVisible();
  await expect(page.getByTestId('item-chart')).toBeVisible();

  const item = page.getByTestId('item-chart');
  await expect(item).toHaveCSS('left', '12px');
  const box = await item.boundingBox();
  expect(box).not.toBeNull();
  if (box === null) {
    throw new Error('item-chart bounding box was not available');
  }

  await page.mouse.move(box.x + 24, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 90, box.y + 48, { steps: 12 });
  await page.mouse.up();

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const probe = (window as unknown as { __DNDGEM_D17?: ReactProbe }).__DNDGEM_D17;
        return probe?.lastDropAccepted ?? null;
      });
    })
    .toBe(true);

  const probe = await page.evaluate(() => {
    return (window as unknown as { __DNDGEM_D17?: ReactProbe }).__DNDGEM_D17;
  });
  expect(probe?.chartX).toBeGreaterThan(12);
  await expect(item).not.toHaveCSS('left', '12px');
});

test('react playground resize updates measured space from engine state', async ({ page }) => {
  await page.goto('/');
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const probe = (window as unknown as { __DNDGEM_D17?: ReactProbe }).__DNDGEM_D17;
        return probe?.spaceWidth ?? null;
      });
    })
    .toBeGreaterThan(0);

  const initialWidth = await page.evaluate(() => {
    return (window as unknown as { __DNDGEM_D17?: ReactProbe }).__DNDGEM_D17?.spaceWidth ?? 0;
  });

  await page.getByTestId('board').evaluate((node) => {
    (node as HTMLElement).style.width = '360px';
  });

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const probe = (window as unknown as { __DNDGEM_D17?: ReactProbe }).__DNDGEM_D17;
        return probe?.spaceWidth ?? null;
      });
    })
    .toBeLessThan(initialWidth);

  const status = page.getByTestId('status');
  await expect(status).toContainText(/VALID|DEGRADED|INVALID/);
});
