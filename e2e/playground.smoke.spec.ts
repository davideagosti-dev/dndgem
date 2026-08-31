import { test, expect } from '@playwright/test';

test('playground smoke loads 30-second proof shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'DnDGem Playground' })).toBeVisible();
  await expect(page.getByText(/Geometric fit isn't enough/i)).toBeVisible();
  await expect(page.getByText(/Geometrically fits/i)).toBeVisible();
  await expect(page.getByTestId('board')).toBeVisible();
  await expect(page.getByTestId('status')).toContainText(/VALID|DEGRADED|INVALID/);
});
