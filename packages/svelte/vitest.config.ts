import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [svelte()],
        resolve: {
          conditions: ['browser'],
        },
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: ['tests/**/*.test.ts'],
          exclude: ['tests/ssr-import.test.ts', 'tests/ssr-render.test.ts'],
          setupFiles: ['tests/setup.ts'],
        },
      },
      {
        plugins: [svelte()],
        test: {
          name: 'ssr',
          environment: 'node',
          include: ['tests/ssr-import.test.ts', 'tests/ssr-render.test.ts'],
        },
      },
    ],
  },
});
