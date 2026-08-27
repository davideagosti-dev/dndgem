import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('@dndgem/intelligence package boundary', () => {
  it('remains private workspace package', () => {
    const pkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8')) as {
      private?: boolean;
      name: string;
    };
    expect(pkg.name).toBe('@dndgem/intelligence');
    expect(pkg.private).toBe(true);
  });

  it('depends on Core only in production dependencies', () => {
    const pkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    expect(Object.keys(pkg.dependencies ?? {})).toEqual(['@dndgem/core']);
  });

  it('production sources do not import DOM or framework packages', () => {
    const files = ['src/index.ts', 'src/planner.ts', 'src/normalize.ts', 'src/types.ts'];
    const forbidden = [
      '@dndgem/dom',
      '@dndgem/react',
      '@dndgem/vue',
      '@dndgem/angular',
      '@dndgem/svelte',
      '@dnd-kit/',
      'openai',
      'anthropic',
      '@anthropic-ai/',
      '@google/generative-ai',
    ];
    for (const file of files) {
      const source = readFileSync(join(pkgRoot, file), 'utf8');
      for (const token of forbidden) {
        expect(source.includes(token), `${file} must not reference ${token}`).toBe(false);
      }
    }
  });
});
