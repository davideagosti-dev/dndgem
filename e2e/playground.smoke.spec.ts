import { test, expect } from '@playwright/test';

interface PlaygroundProbe {
  phase?: string;
  validity?: string;
  spaceWidth?: number;
  lastDropAccepted?: boolean;
  autoLayoutEnabled?: boolean;
}

const DISPOSED_INTERACTION = /Cannot read state from a disposed drag interaction/i;
const RECT_TOLERANCE = 1.5;

async function dragBy(
  page: import('@playwright/test').Page,
  testId: string,
  translation: { x: number; y: number },
) {
  const box = await page.getByTestId(testId).boundingBox();
  expect(box).not.toBeNull();
  if (box === null) {
    throw new Error(`Missing drag geometry for ${testId}`);
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + translation.x,
    box.y + box.height / 2 + translation.y,
    { steps: 12 },
  );
  await page.mouse.up();

  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const probe = (window as unknown as { __DNDGEM_D17?: PlaygroundProbe }).__DNDGEM_D17;
        return {
          phase: probe?.phase,
          accepted: probe?.lastDropAccepted,
        };
      });
    })
    .toEqual({ phase: 'idle', accepted: true });

  return box;
}

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

test('playground preserves accepted Metric position through a small Table drag', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.goto('/');

  await page.getByTestId('board').evaluate((node) => {
    const el = node as HTMLElement;
    el.style.width = '900px';
    el.style.maxWidth = 'none';
    el.style.height = '560px';
  });
  await expect
    .poll(async () => {
      return page.evaluate(() => {
        const probe = (window as unknown as { __DNDGEM_D17?: PlaygroundProbe }).__DNDGEM_D17;
        return { validity: probe?.validity, width: probe?.spaceWidth };
      });
    })
    .toEqual({ validity: 'VALID', width: 900 });

  const chart = await page.getByTestId('item-chart').boundingBox();
  const metric = await page.getByTestId('item-metric').boundingBox();
  expect(chart).not.toBeNull();
  expect(metric).not.toBeNull();
  if (chart === null || metric === null) {
    throw new Error('Missing initial Chart or Metric geometry');
  }

  const metricTarget = {
    x: chart.x,
    y: chart.y + chart.height + 16,
  };
  await dragBy(page, 'item-metric', {
    x: metricTarget.x - metric.x,
    y: metricTarget.y - metric.y,
  });

  const metricCommitted = await page.getByTestId('item-metric').boundingBox();
  expect(metricCommitted).not.toBeNull();
  expect(Math.abs((metricCommitted?.x ?? 0) - metricTarget.x)).toBeLessThanOrEqual(RECT_TOLERANCE);
  expect(Math.abs((metricCommitted?.y ?? 0) - metricTarget.y)).toBeLessThanOrEqual(RECT_TOLERANCE);

  const tableBefore = await dragBy(page, 'item-table', { x: 8, y: 4 });
  const tableCommitted = await page.getByTestId('item-table').boundingBox();
  const metricAfterTable = await page.getByTestId('item-metric').boundingBox();
  expect(tableCommitted).not.toBeNull();
  expect(metricAfterTable).not.toBeNull();
  expect(Math.abs((tableCommitted?.x ?? 0) - (tableBefore.x + 8))).toBeLessThanOrEqual(
    RECT_TOLERANCE,
  );
  expect(Math.abs((tableCommitted?.y ?? 0) - (tableBefore.y + 4))).toBeLessThanOrEqual(
    RECT_TOLERANCE,
  );
  expect(Math.abs((metricAfterTable?.x ?? 0) - (metricCommitted?.x ?? 0))).toBeLessThanOrEqual(
    RECT_TOLERANCE,
  );
  expect(Math.abs((metricAfterTable?.y ?? 0) - (metricCommitted?.y ?? 0))).toBeLessThanOrEqual(
    RECT_TOLERANCE,
  );
});
