import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(pkgRoot, '..', '..');

describe('@dndgem/intelligence-openai package boundary', () => {
  it('remains private 0.0.0', () => {
    const pkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8')) as {
      name: string;
      private?: boolean;
      version: string;
      dependencies?: Record<string, string>;
    };
    expect(pkg.name).toBe('@dndgem/intelligence-openai');
    expect(pkg.private).toBe(true);
    expect(pkg.version).toBe('0.0.0');
    expect(pkg.dependencies?.['@dndgem/intelligence']).toBe('workspace:*');
    expect(pkg.dependencies?.openai).toBeDefined();
    expect(pkg.dependencies?.['@dndgem/core']).toBeUndefined();
  });

  it('is recognized by package topology as optional private', async () => {
    const { pathToFileURL } = await import('node:url');
    const topology = await import(
      pathToFileURL(join(repoRoot, 'scripts', 'package-topology.mjs')).href
    );
    expect(topology.OPTIONAL_PRIVATE_FOLDERS).toContain('intelligence-openai');
    expect(topology.existingPublishableFolders()).not.toContain('intelligence-openai');
  });

  it('production sources do not import DOM/framework packages', () => {
    const files = [
      'src/index.ts',
      'src/planner.ts',
      'src/transport.ts',
      'src/dto.ts',
      'src/alias.ts',
      'src/schema.ts',
      'src/prompt.ts',
      'src/errors.ts',
      'src/types.ts',
    ];
    const forbiddenImport = /from\s+['"]@(?:dndgem\/(?:dom|react|vue|angular|svelte)|dnd-kit\/)/;
    for (const file of files) {
      const source = readFileSync(join(pkgRoot, file), 'utf8');
      expect(forbiddenImport.test(source), `${file} must not import DOM/framework packages`).toBe(
        false,
      );
    }
  });

  it('generic intelligence sources still exclude openai', () => {
    const intelligenceSrc = join(pkgRoot, '..', 'intelligence', 'src');
    for (const file of ['index.ts', 'planner.ts', 'orchestrator.ts', 'types.ts', 'normalize.ts']) {
      const source = readFileSync(join(intelligenceSrc, file), 'utf8');
      expect(source.includes('openai')).toBe(false);
      expect(source.includes('@dndgem/intelligence-openai')).toBe(false);
    }
  });
});
