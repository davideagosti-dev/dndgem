import { test, expect } from '@playwright/test';

test('playground smoke loads technical shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'DnDGem Playground' })).toBeVisible();
  await expect(page.getByText('Technical MVP proof')).toBeVisible();
  await expect(page.getByTestId('board')).toBeVisible();
  await expect(page.getByTestId('status')).toContainText(/VALID|DEGRADED|INVALID/);
});
