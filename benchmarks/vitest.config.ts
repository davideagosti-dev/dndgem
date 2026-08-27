import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

/**
 * Benchmarks execute against the built `@dndgem/core` package output (`dist/`),
 * not TypeScript sources, so timings reflect the published compilation path.
 */
export default defineConfig({
  root,
  test: {
    environment: 'node',
    include: ['core/**/*.test.ts'],
    passWithNoTests: false,
  },
  resolve: {
    alias: {
      '@dndgem/core': path.resolve(root, '../packages/core/dist/index.js'),
      '@dndgem/intelligence': path.resolve(root, '../packages/intelligence/dist/index.js'),
    },
  },
});
