import { expect, type Locator, type Page } from '@playwright/test';

export interface CompatProbe {
  ready?: boolean;
  phase?: string;
  validity?: string;
  lastDropAccepted?: boolean;
  spaceWidth?: number;
  cancelCount?: number;
  proposalUnplaced?: number;
  sessionsCreated?: number;
  sessionsDisposed?: number;
  liveObservers?: number;
}

export interface MetaCompatOptions {
  readonly origin: string;
  readonly probeKey: '__DNDGEM_META_NEXT' | '__DNDGEM_META_NUXT' | '__DNDGEM_META_SVELTEKIT';
  readonly heading: string;
}

export async function readProbe(
  page: Page,
  probeKey: MetaCompatOptions['probeKey'],
): Promise<CompatProbe> {
  return page.evaluate((key) => {
    return (window as unknown as Record<string, CompatProbe | undefined>)[key] ?? {};
  }, probeKey);
}

export function liveSessionCount(probe: CompatProbe): number {
  return (probe.sessionsCreated ?? 0) - (probe.sessionsDisposed ?? 0);
}

export async function waitForReady(
  page: Page,
  probeKey: MetaCompatOptions['probeKey'],
): Promise<CompatProbe> {
  await expect(page.getByTestId('item-revenue')).toBeVisible();
  await expect
    .poll(async () => {
      const probe = await readProbe(page, probeKey);
      return probe.ready === true && liveSessionCount(probe) === 1 ? probe : null;
    })
    .not.toBeNull();
  await expect(page.getByTestId('item-revenue')).toHaveCSS('left', '12px');
  const probe = await readProbe(page, probeKey);
  expect(probe.liveObservers).toBe(1);
  expect(liveSessionCount(probe)).toBe(1);
  return probe;
}

export async function dragItem(page: Page, item: Locator, deltaX = 90, deltaY = 48): Promise<void> {
  const box = await item.boundingBox();
  expect(box).not.toBeNull();
  if (box === null) {
    throw new Error('item bounding box was not available');
  }
  await page.mouse.move(box.x + 24, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + deltaX, box.y + deltaY, { steps: 12 });
  await page.mouse.up();
}

export async function startDrag(
  page: Page,
  item: Locator,
  deltaX = 100,
  deltaY = 48,
): Promise<void> {
  const box = await item.boundingBox();
  expect(box).not.toBeNull();
  if (box === null) {
    throw new Error('item bounding box was not available');
  }
  await page.mouse.move(box.x + 24, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + deltaX, box.y + deltaY, { steps: 10 });
}
