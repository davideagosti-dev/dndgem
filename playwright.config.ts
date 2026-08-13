import { defineConfig, devices } from '@playwright/test';

/**
 * Browser/E2E strategy for DnDGem.
 * GitHub CI runs Chromium smoke (playground boot + DND-1.6 drag fixture).
 * Full sprint quality gates remain local.
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
  webServer: {
    command: 'npx pnpm@10.34.5 --filter @dndgem/playground run dev:e2e',
    url: 'http://127.0.0.1:5180',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
