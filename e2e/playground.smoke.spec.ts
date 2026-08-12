import { test, expect } from '@playwright/test';

test('playground smoke loads technical shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'DnDGem Playground' })).toBeVisible();
  await expect(page.getByText('Engineering shell only')).toBeVisible();
});
