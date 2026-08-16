import { expect, test } from '@playwright/test';

/**
 * Post-release regressions for intentional drag-preview overlap (0.1.0-alpha.1).
 *
 * Contract under test:
 * - mid-drag visual overlap is transient preview (active card follows pointer)
 * - Playground status `VALID` is the last committed solver evaluation
 * - Escape restores a coherent committed layout
 * - accepted free-space/generated reflow yields no pairwise visual overlap
 *
 * Not claimed: every accepted drop (including source→source onto another source)
 * is overlap-free. Auto-Layout does not relocate explicit Source Intent.
 */

interface PlaygroundProbe {
  phase?: string;
  validity?: string;
  lastDropAccepted?: boolean;
}

async function visualOverlaps(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    const ids = ['chart', 'table', 'details', 'metric'];
    const boxes = ids.map((id) => {
      const el = document.querySelector(`[data-testid="item-${id}"]`);
      if (el === null) {
        return null;
      }
      const r = el.getBoundingClientRect();
      return { id, x: r.x, y: r.y, width: r.width, height: r.height };
    });
    const hits: string[] = [];
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i];
        const b = boxes[j];
        if (a === null || b === null) {
          continue;
        }
        const overlaps = !(
          a.x + a.width <= b.x ||
          b.x + b.width <= a.x ||
          a.y + a.height <= b.y ||
          b.y + b.height <= a.y
        );
        if (overlaps) {
          hits.push(`${a.id}+${b.id}`);
        }
      }
    }
    return hits;
  });
}

async function readProbe(
  page: import('@playwright/test').Page,
): Promise<PlaygroundProbe | undefined> {
  return page.evaluate(() => {
    return (window as unknown as { __DNDGEM_D17?: PlaygroundProbe }).__DNDGEM_D17;
  });
}

test('transient drag preview may visually overlap while committed VALID stays unchanged', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'DnDGem Playground' })).toBeVisible();

  await expect
    .poll(async () => {
      return (await readProbe(page))?.phase ?? null;
    })
    .toBe('idle');

  expect(await visualOverlaps(page)).toEqual([]);
  const idleProbe = await readProbe(page);
  expect(idleProbe?.validity).toBe('VALID');
  await expect(page.getByTestId('status')).toContainText('VALID');
  await expect(page.getByTestId('status')).toContainText('idle');

  const table = page.getByTestId('item-table');
  const chart = page.getByTestId('item-chart');
  const tableBox = await table.boundingBox();
  const chartBox = await chart.boundingBox();
  expect(tableBox).not.toBeNull();
  expect(chartBox).not.toBeNull();
  if (tableBox === null || chartBox === null) {
    throw new Error('required bounding boxes were not available');
  }

  await page.mouse.move(tableBox.x + 24, tableBox.y + 20);
  await page.mouse.down();
  await page.mouse.move(chartBox.x + chartBox.width / 2, chartBox.y + chartBox.height / 2, {
    steps: 16,
  });

  await expect
    .poll(async () => {
      return (await readProbe(page))?.phase ?? null;
    })
    .toBe('dragging');

  const midProbe = await readProbe(page);
  // Status / probe `validity` is the last committed solve — not the live visual stack.
  expect(midProbe?.validity).toBe('VALID');
  await expect
    .poll(async () => {
      return (await visualOverlaps(page)).length;
    })
    .toBeGreaterThan(0);
  await expect(page.getByTestId('status')).toContainText('VALID');
  await expect(page.getByTestId('status')).toContainText('dragging');

  await page.keyboard.press('Escape');
  await expect
    .poll(async () => {
      return (await readProbe(page))?.phase ?? null;
    })
    .toBe('idle');
  expect(await visualOverlaps(page)).toEqual([]);
  await expect(page.getByTestId('status')).toContainText('idle');
});

test('accepted free-space Auto-Layout drag commits a coherent non-overlapping layout', async ({
  page,
}) => {
  // Narrow contract: free-space / generated reflow — not “every accepted drop”.
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'DnDGem Playground' })).toBeVisible();

  await expect
    .poll(async () => {
      return (await readProbe(page))?.phase ?? null;
    })
    .toBe('idle');

  const table = page.getByTestId('item-table');
  const tableBox = await table.boundingBox();
  expect(tableBox).not.toBeNull();
  if (tableBox === null) {
    throw new Error('item-table bounding box was not available');
  }

  await page.mouse.move(tableBox.x + 24, tableBox.y + 20);
  await page.mouse.down();
  await page.mouse.move(tableBox.x + 90, tableBox.y + 50, { steps: 12 });
  await page.mouse.up();

  await expect
    .poll(async () => {
      return (await readProbe(page))?.lastDropAccepted ?? null;
    })
    .toBe(true);

  const afterProbe = await readProbe(page);
  expect(afterProbe?.phase).toBe('idle');
  expect(await visualOverlaps(page)).toEqual([]);
  await expect(page.getByTestId('status')).toContainText(/VALID|DEGRADED/);
  await expect(page.getByTestId('status')).toContainText('idle');
});
