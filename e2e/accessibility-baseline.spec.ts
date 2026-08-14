import { expect, test } from '@playwright/test';

/**
 * DND-2.4 accessibility baseline checks (engine matrix).
 * These prove non-destructive focus/ARIA behavior for the pointer Alpha path.
 * They do not certify WCAG conformance or keyboard-drag product support.
 */

test('consumer aria-label on a vanilla item remains after layout and resize', async ({ page }) => {
  await page.goto('/vanilla-fixture.html');
  const item = page.getByTestId('item-a');
  await expect(item).toHaveAttribute('aria-label', 'Item A');

  await page.getByTestId('board').evaluate((node) => {
    (node as HTMLElement).style.width = '320px';
  });

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        return (
          (window as unknown as { __DNDGEM_D17_VANILLA?: { spaceWidth?: number } })
            .__DNDGEM_D17_VANILLA?.spaceWidth ?? 0
        );
      });
    })
    .toBeLessThan(480);

  await expect(item).toHaveAttribute('aria-label', 'Item A');
  await expect(item).toBeVisible();
});

test('focusable control outside the board keeps focus across resize', async ({ page }) => {
  await page.goto('/');
  const probe = page.getByTestId('focus-probe');
  await probe.focus();
  await expect(probe).toBeFocused();

  await page.getByTestId('board').evaluate((node) => {
    (node as HTMLElement).style.width = '360px';
  });

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        return (window as unknown as { __DNDGEM_D17?: { spaceWidth?: number } }).__DNDGEM_D17
          ?.spaceWidth;
      });
    })
    .toBeLessThan(480);

  await expect(probe).toBeFocused();
});

test('react playground Escape cancel restores committed layout without drop', async ({ page }) => {
  await page.goto('/');
  const item = page.getByTestId('item-chart');
  await expect(item).toHaveCSS('left', '12px');
  const box = await item.boundingBox();
  expect(box).not.toBeNull();
  if (box === null) {
    throw new Error('item-chart bounding box was not available');
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
          (window as unknown as { __DNDGEM_D17?: { cancelCount?: number } }).__DNDGEM_D17
            ?.cancelCount ?? 0
        );
      });
    })
    .toBeGreaterThan(0);

  await expect(item).toHaveCSS('left', '12px');
  const probe = await page.evaluate(() => {
    return (window as unknown as { __DNDGEM_D17?: { phase?: string; chartX?: number } })
      .__DNDGEM_D17;
  });
  expect(probe?.phase).toBe('idle');
  expect(probe?.chartX).toBe(12);
});

test('react item consumer aria-label remains after accepted drag', async ({ page }) => {
  await page.goto('/');
  const item = page.getByTestId('item-chart');
  await expect(item).toHaveAttribute('aria-label', 'Chart panel');

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
        return (
          (window as unknown as { __DNDGEM_D17?: { lastDropAccepted?: boolean } }).__DNDGEM_D17
            ?.lastDropAccepted ?? null
        );
      });
    })
    .toBe(true);

  await expect(item).toHaveAttribute('aria-label', 'Chart panel');
  await expect(item.getByRole('heading', { name: 'Chart' })).toBeVisible();
});
