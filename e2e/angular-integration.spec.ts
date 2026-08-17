import { expect, test } from '@playwright/test';

interface AngularProbe {
  phase?: string;
  validity?: string;
  lastDropAccepted?: boolean;
  spaceWidth?: number;
  cancelCount?: number;
  proposalUnplaced?: number;
}

const angularExample = 'http://127.0.0.1:5177';

test.describe('angular example integration', () => {
  test.use({ baseURL: angularExample });

  test('angular example applies geometry, Auto-Layout, and accepts a drag drop', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'DnDGem Angular Example' })).toBeVisible();
    await expect(page.getByTestId('item-revenue')).toBeVisible();
    await expect(page.getByTestId('status')).toContainText(/VALID|DEGRADED|INVALID/);
    await expect(page.getByTestId('status')).toContainText('auto proposal unresolved');

    const item = page.getByTestId('item-revenue');
    await expect(item).toHaveCSS('left', '12px');
    const box = await item.boundingBox();
    expect(box).not.toBeNull();
    if (box === null) {
      throw new Error('item-revenue bounding box was not available');
    }

    await page.mouse.move(box.x + 24, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + 90, box.y + 48, { steps: 12 });
    await page.mouse.up();

    await expect
      .poll(async () => {
        return page.evaluate(() => {
          const probe = (window as unknown as { __DNDGEM_ANGULAR?: AngularProbe }).__DNDGEM_ANGULAR;
          return probe?.lastDropAccepted ?? null;
        });
      })
      .toBe(true);

    await expect(item).not.toHaveCSS('left', '12px');
  });

  test('angular example resize updates measured space from engine state', async ({ page }) => {
    await page.goto('/');
    await expect
      .poll(async () => {
        return page.evaluate(() => {
          const probe = (window as unknown as { __DNDGEM_ANGULAR?: AngularProbe }).__DNDGEM_ANGULAR;
          return probe?.spaceWidth ?? null;
        });
      })
      .toBeGreaterThan(0);

    const initialWidth = await page.evaluate(() => {
      return (
        (window as unknown as { __DNDGEM_ANGULAR?: AngularProbe }).__DNDGEM_ANGULAR?.spaceWidth ?? 0
      );
    });

    await page.getByTestId('board').evaluate((node) => {
      (node as HTMLElement).style.width = '360px';
    });

    await expect
      .poll(async () => {
        return page.evaluate(() => {
          const probe = (window as unknown as { __DNDGEM_ANGULAR?: AngularProbe }).__DNDGEM_ANGULAR;
          return probe?.spaceWidth ?? null;
        });
      })
      .toBeLessThan(initialWidth);

    await expect(page.getByTestId('status')).toContainText(/VALID|DEGRADED|INVALID/);
  });

  test('angular example Escape cancel restores committed layout', async ({ page }) => {
    await page.goto('/');
    const item = page.getByTestId('item-revenue');
    await expect(item).toHaveCSS('left', '12px');
    const box = await item.boundingBox();
    expect(box).not.toBeNull();
    if (box === null) {
      throw new Error('item-revenue bounding box was not available');
    }

    await page.mouse.move(box.x + 24, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + 100, box.y + 48, { steps: 10 });
    await page.keyboard.press('Escape');
    await page.mouse.up();

    await expect
      .poll(async () => {
        return page.evaluate(() => {
          return (
            (window as unknown as { __DNDGEM_ANGULAR?: AngularProbe }).__DNDGEM_ANGULAR
              ?.cancelCount ?? 0
          );
        });
      })
      .toBeGreaterThan(0);

    await expect(item).toHaveCSS('left', '12px');
  });

  test('angular example preserves consumer ARIA and tabindex', async ({ page }) => {
    await page.goto('/');
    const item = page.getByTestId('item-revenue');
    await expect(item).toHaveAttribute('aria-label', 'Revenue');
    await expect(item).toHaveAttribute('tabindex', '0');

    await page.getByTestId('board').evaluate((node) => {
      (node as HTMLElement).style.width = '360px';
    });

    await expect
      .poll(async () => {
        return page.evaluate(() => {
          return (
            (window as unknown as { __DNDGEM_ANGULAR?: AngularProbe }).__DNDGEM_ANGULAR
              ?.spaceWidth ?? 0
          );
        });
      })
      .toBeLessThan(720);

    await expect(item).toHaveAttribute('aria-label', 'Revenue');
    await expect(item).toHaveAttribute('tabindex', '0');
  });
});
