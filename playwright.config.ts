import { defineConfig, devices } from '@playwright/test';

/**
 * Browser/E2E strategy for DnDGem (DND-2.4).
 *
 * `pnpm test:e2e` runs the Public Alpha desktop engine matrix:
 * Chromium, Firefox, and WebKit.
 *
 * Promotion CI (`develop` → `master`) installs and executes the same matrix.
 * Feature branches do not run GitHub CI; the local Sprint Final Quality Gate is mandatory.
 *
 * This is engine-level automated validation, not certification of every
 * real-world browser version, mobile browser, or embedded webview.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5180',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npx pnpm@10.34.5 --filter @dndgem/playground run dev:e2e',
      url: 'http://127.0.0.1:5180',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npx pnpm@10.34.5 --filter @dndgem/example-vue run dev',
      url: 'http://127.0.0.1:5176',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
