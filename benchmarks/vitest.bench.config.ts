import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

/** Vitest benchmark mode (`vitest bench`) — timing only; semantics gated by `*.test.ts`. */
export default defineConfig({
  root,
  test: {
    environment: 'node',
    include: ['core/**/*.bench.ts'],
    passWithNoTests: false,
  },
  resolve: {
    alias: {
      '@dndgem/core': path.resolve(root, '../packages/core/dist/index.js'),
    },
  },
});
