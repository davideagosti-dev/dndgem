import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/node_modules/**',
      'pnpm-lock.yaml',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['packages/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@dndgem/dom',
              message:
                '@dndgem/core must remain renderer-agnostic and must not import @dndgem/dom.',
            },
            {
              name: '@dndgem/react',
              message:
                '@dndgem/core must remain renderer-agnostic and must not import @dndgem/react.',
            },
            {
              name: 'react',
              message: '@dndgem/core must not import React.',
            },
            {
              name: 'react-dom',
              message: '@dndgem/core must not import react-dom.',
            },
            {
              name: '@dnd-kit/dom',
              message: '@dndgem/core must never import dnd-kit.',
            },
            {
              name: '@dnd-kit/core',
              message: '@dndgem/core must never import dnd-kit.',
            },
          ],
          patterns: [
            {
              group: ['@dndgem/dom/*', '@dndgem/react/*', '@dnd-kit/*'],
              message: 'Forbidden import for @dndgem/core.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/dom/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              message: '@dndgem/dom must not import React.',
            },
            {
              name: 'react-dom',
              message: '@dndgem/dom must not import react-dom.',
            },
            {
              name: '@dndgem/react',
              message: '@dndgem/dom must not depend on @dndgem/react.',
            },
          ],
          patterns: [
            {
              group: ['@dndgem/react/*'],
              message: 'Forbidden reverse dependency into @dndgem/react.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/react/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@dnd-kit/dom',
              message: '@dndgem/react must consume DnDGem interaction APIs, not dnd-kit types.',
            },
            {
              name: '@dnd-kit/core',
              message: '@dndgem/react must consume DnDGem interaction APIs, not dnd-kit types.',
            },
          ],
          patterns: [
            {
              group: ['@dnd-kit/*'],
              message: 'Forbidden dnd-kit import for @dndgem/react.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/**/*.{ts,tsx}', 'examples/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/packages/*/src/**',
                '@dndgem/*/src/**',
                '@dndgem/*/dist/**',
                '../packages/**',
                '../../packages/**',
              ],
              message:
                'Consumers must import public package entry points (e.g. @dndgem/core), not private source paths.',
            },
          ],
        },
      ],
    },
  },
);
