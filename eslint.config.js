import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const ADAPTERS = ['react', 'vue', 'angular', 'svelte'];
const ADAPTER_PACKAGES = ADAPTERS.map((name) => `@dndgem/${name}`);
const FRAMEWORK_RUNTIMES = [
  { name: 'react', message: 'must not import React.' },
  { name: 'react-dom', message: 'must not import react-dom.' },
  { name: 'vue', message: 'must not import Vue.' },
  { name: '@angular/core', message: 'must not import Angular.' },
  { name: 'svelte', message: 'must not import Svelte.' },
];

function adapterPackagePaths(except) {
  return ADAPTER_PACKAGES.filter((name) => name !== except).map((name) => ({
    name,
    message: `must not depend on ${name} (adapters are siblings over @dndgem/dom).`,
  }));
}

function dndKitPaths(owner) {
  return [
    {
      name: '@dnd-kit/dom',
      message: `${owner} must consume DnDGem interaction APIs, not dnd-kit types.`,
    },
    {
      name: '@dnd-kit/core',
      message: `${owner} must consume DnDGem interaction APIs, not dnd-kit types.`,
    },
  ];
}

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
            ...adapterPackagePaths(),
            ...FRAMEWORK_RUNTIMES.map((runtime) => ({
              name: runtime.name,
              message: `@dndgem/core ${runtime.message}`,
            })),
            ...dndKitPaths('@dndgem/core'),
          ],
          patterns: [
            {
              group: [
                '@dndgem/dom/*',
                '@dndgem/react/*',
                '@dndgem/vue/*',
                '@dndgem/angular/*',
                '@dndgem/svelte/*',
                '@dnd-kit/*',
              ],
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
            ...adapterPackagePaths(),
            ...FRAMEWORK_RUNTIMES.map((runtime) => ({
              name: runtime.name,
              message: `@dndgem/dom ${runtime.message}`,
            })),
          ],
          patterns: [
            {
              group: ['@dndgem/react/*', '@dndgem/vue/*', '@dndgem/angular/*', '@dndgem/svelte/*'],
              message: 'Forbidden reverse dependency into a framework adapter.',
            },
          ],
        },
      ],
    },
  },
  ...ADAPTERS.map((adapter) => ({
    files: [`packages/${adapter}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...adapterPackagePaths(`@dndgem/${adapter}`),
            ...dndKitPaths(`@dndgem/${adapter}`),
          ],
          patterns: [
            {
              group: ['@dnd-kit/*'],
              message: `Forbidden dnd-kit import for @dndgem/${adapter}.`,
            },
          ],
        },
      ],
    },
  })),
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
                '@dnd-kit/*',
              ],
              message:
                'Consumers must import public package entry points (e.g. @dndgem/core), not private source paths or dnd-kit.',
            },
          ],
        },
      ],
    },
  },
);
