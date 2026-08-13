import { expect, test } from '@playwright/test';

interface VanillaProbe {
  lastDropAccepted?: boolean;
  lastDropItemId?: string;
  aX?: number;
  spaceWidth?: number;
  rejectAccepted?: boolean;
  cancelCount?: number;
  phase?: string;
}

test('vanilla layout session applies geometry and accepts a drag drop', async ({ page }) => {
  await page.goto('/vanilla-fixture.html');
  await expect(page.getByRole('heading', { name: 'DND-1.7 vanilla fixture' })).toBeVisible();

  const item = page.getByTestId('item-a');
  await expect(item).toHaveCSS('left', '16px');
  const box = await item.boundingBox();
  expect(box).not.toBeNull();
  if (box === null) {
    throw new Error('item-a bounding box was not available');
  }

  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 80, box.y + 50, { steps: 12 });
  await page.mouse.up();

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const probe = (window as unknown as { __DNDGEM_D17_VANILLA?: VanillaProbe })
          .__DNDGEM_D17_VANILLA;
        return probe?.lastDropAccepted ?? null;
      });
    })
    .toBe(true);

  const probe = await page.evaluate(() => {
    return (window as unknown as { __DNDGEM_D17_VANILLA?: VanillaProbe }).__DNDGEM_D17_VANILLA;
  });
  expect(probe?.lastDropItemId).toBe('a');
  expect(probe?.aX).toBeGreaterThan(16);
  await expect(item).not.toHaveCSS('left', '16px');
});

test('vanilla rejected drop preserves the previous layout', async ({ page }) => {
  await page.goto('/vanilla-fixture.html');
  const item = page.getByTestId('item-c');
  const before = await item.evaluate((node) => (node as HTMLElement).style.left);
  const box = await item.boundingBox();
  expect(box).not.toBeNull();
  if (box === null) {
    throw new Error('item-c bounding box was not available');
  }

  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + 24, box.y + 18, { steps: 8 });
  await page.mouse.up();

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const probe = (window as unknown as { __DNDGEM_D17_VANILLA?: VanillaProbe })
          .__DNDGEM_D17_VANILLA;
        return probe?.rejectAccepted ?? null;
      });
    })
    .toBe(false);

  const after = await item.evaluate((node) => (node as HTMLElement).style.left);
  expect(after).toBe(before);
});

test('vanilla container resize updates measured space', async ({ page }) => {
  await page.goto('/vanilla-fixture.html');
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const probe = (window as unknown as { __DNDGEM_D17_VANILLA?: VanillaProbe })
          .__DNDGEM_D17_VANILLA;
        return probe?.spaceWidth ?? null;
      });
    })
    .toBeGreaterThan(0);

  const initialWidth = await page.evaluate(() => {
    return (
      (window as unknown as { __DNDGEM_D17_VANILLA?: VanillaProbe }).__DNDGEM_D17_VANILLA
        ?.spaceWidth ?? 0
    );
  });

  await page.getByTestId('board').evaluate((node) => {
    (node as HTMLElement).style.width = '320px';
  });

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const probe = (window as unknown as { __DNDGEM_D17_VANILLA?: VanillaProbe })
          .__DNDGEM_D17_VANILLA;
        return probe?.spaceWidth ?? null;
      });
    })
    .toBeLessThan(initialWidth);
});

test('vanilla drag cancel restores the committed layout', async ({ page }) => {
  await page.goto('/vanilla-fixture.html');
  const item = page.getByTestId('item-a');
  await expect(item).toHaveCSS('left', '16px');
  const box = await item.boundingBox();
  expect(box).not.toBeNull();
  if (box === null) {
    throw new Error('item-a bounding box was not available');
  }

  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 100, box.y + 40, { steps: 10 });
  await page.keyboard.press('Escape');
  await page.mouse.up();

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const probe = (window as unknown as { __DNDGEM_D17_VANILLA?: VanillaProbe })
          .__DNDGEM_D17_VANILLA;
        return probe?.cancelCount ?? 0;
      });
    })
    .toBeGreaterThan(0);

  await expect(item).toHaveCSS('left', '16px');
  const probe = await page.evaluate(() => {
    return (window as unknown as { __DNDGEM_D17_VANILLA?: VanillaProbe }).__DNDGEM_D17_VANILLA;
  });
  expect(probe?.phase).toBe('idle');
  expect(probe?.aX).toBe(16);
});
