import { expect, test } from '@playwright/test';

interface DragFixtureProbe {
  lastProposal?: {
    itemId: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lastDrop?: {
    accepted: boolean;
    itemId: string;
    state: string;
    x?: number;
    y?: number;
  };
}

test('drag fixture produces a normalized proposal and accepted solver drop', async ({ page }) => {
  await page.goto('/drag-fixture.html');
  await expect(page.getByRole('heading', { name: 'DND-1.6 drag fixture' })).toBeVisible();

  const item = page.getByTestId('item-a');
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
        const probe = (window as unknown as { __DNDGEM_D16?: DragFixtureProbe }).__DNDGEM_D16;
        return probe?.lastDrop?.accepted ?? null;
      });
    })
    .toBe(true);

  const probe = await page.evaluate(() => {
    return (window as unknown as { __DNDGEM_D16?: DragFixtureProbe }).__DNDGEM_D16;
  });
  expect(probe?.lastProposal?.itemId).toBe('a');
  expect(probe?.lastProposal?.x).toBeGreaterThan(16);
  expect(probe?.lastProposal?.y).toBeGreaterThan(16);
  expect(probe?.lastDrop?.state).toBe('VALID');
  expect(probe?.lastDrop?.x).toBeGreaterThan(16);
});
