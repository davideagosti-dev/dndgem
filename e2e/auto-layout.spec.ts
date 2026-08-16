import { expect, test } from '@playwright/test';

interface AutoLayoutProbe {
  phase?: string;
  validity?: string;
  lastDropAccepted?: boolean;
  chartX?: number;
  spaceWidth?: number;
  autoLayoutEnabled?: boolean;
  unplacedCount?: number;
}

test('react Auto-Layout smoke: initial hybrid layout, resize, drag promotion', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'DnDGem Playground' })).toBeVisible();

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const probe = (window as unknown as { __DNDGEM_D17?: AutoLayoutProbe }).__DNDGEM_D17;
        return probe?.autoLayoutEnabled ?? null;
      });
    })
    .toBe(true);

  const chart = page.getByTestId('item-chart');
  const table = page.getByTestId('item-table');
  await expect(chart).toHaveCSS('left', '12px');
  await expect(table).toBeVisible();
  // Table is automatic — must receive a placed left from Auto-Layout.
  await expect(table).not.toHaveCSS('left', '');

  const initialWidth = await page.evaluate(() => {
    return (window as unknown as { __DNDGEM_D17?: AutoLayoutProbe }).__DNDGEM_D17?.spaceWidth ?? 0;
  });
  expect(initialWidth).toBeGreaterThan(0);

  await page.getByTestId('board').evaluate((node) => {
    (node as HTMLElement).style.width = '420px';
  });

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const probe = (window as unknown as { __DNDGEM_D17?: AutoLayoutProbe }).__DNDGEM_D17;
        return probe?.spaceWidth ?? null;
      });
    })
    .toBeLessThan(initialWidth);

  // Source Intent chart should remain at 12 when still feasible after mild shrink.
  await expect(chart).toHaveCSS('left', '12px');

  const box = await table.boundingBox();
  expect(box).not.toBeNull();
  if (box === null) {
    throw new Error('item-table bounding box was not available');
  }

  await page.mouse.move(box.x + 20, box.y + 16);
  await page.mouse.down();
  await page.mouse.move(box.x + 80, box.y + 40, { steps: 10 });
  await page.mouse.up();

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const probe = (window as unknown as { __DNDGEM_D17?: AutoLayoutProbe }).__DNDGEM_D17;
        return probe?.lastDropAccepted ?? null;
      });
    })
    .toBe(true);

  await page.getByTestId('board').evaluate((node) => {
    (node as HTMLElement).style.width = '480px';
  });

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const probe = (window as unknown as { __DNDGEM_D17?: AutoLayoutProbe }).__DNDGEM_D17;
        return probe?.spaceWidth ?? null;
      });
    })
    .toBeGreaterThan(420);

  await expect(page.getByTestId('status')).toContainText(/VALID|DEGRADED|INVALID/);
  await expect(page.getByTestId('status')).toContainText('auto');
});
